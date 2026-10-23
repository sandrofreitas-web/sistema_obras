"""
Agente Especialista em Ingestão Fiscal e Suprimentos de Construção Civil
Sistema de Obras (ObraCerta / ICENV)

Suporta pipeline híbrido:
1. Fast-path determinístico para arquivos XML de NF-e e NFC-e (SEFAZ padrão nacional).
2. Agentic Multimodal Path para PDFs, fotos de cupons térmicos (NFC-e / SAT),
   comprovantes de balcão (JER, Telhanorte, Sodimac) e recibos de canteiro via Gemini Vision.
3. Reconciliador semântico automático com a WBS e EAP do projeto ativo da obra.
"""

import os
import re
import json
import base64
import logging
import xml.etree.ElementTree as ET
from datetime import date, datetime
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Projeto, Cenario, ItemProjeto, Material, Fornecedor
from app.api.schemas import IngestaoNotaFiscalResponse, ItemNotaFiscalExtraido

logger = logging.getLogger("invoice_agent")
logger.setLevel(logging.INFO)


def _normalize_unit(raw_unit: Optional[str]) -> str:
    """Normaliza unidades de medida da construção civil para o padrão do catálogo."""
    if not raw_unit:
        return "un"
    u = raw_unit.strip().lower()
    if u in ["cx", "cxa", "caixa", "caixas"]:
        return "cx"
    if u in ["sc", "saco", "sacos"]:
        return "saco"
    if u in ["m2", "m²", "metro quadrado", "metros quadrados"]:
        return "m²"
    if u in ["m", "mt", "metro", "metros", "barra", "br"]:
        return "m"
    if u in ["kg", "quilo", "quilos"]:
        return "kg"
    if u in ["l", "lt", "litro", "litros", "galao", "balde"]:
        return "l"
    if u in ["pc", "pç", "peca", "peça", "peças", "un", "und", "unidade"]:
        return "un"
    return "un"


def _infer_category(descricao: str) -> str:
    """Classifica semanticamente o item no agrupamento de insumos da obra."""
    d = descricao.lower()
    if any(w in d for w in ["porcelanato", "piso", "revestimento", "azulejo", "rodapé", "soleira", "pastilha"]):
        return "Revestimento"
    if any(w in d for w in ["cimento", "argamassa", "areia", "brita", "rejunte", "gesso", "bloco", "tijolo"]):
        return "Argamassas e Brutos"
    if any(w in d for w in ["tubo", "cano", "joelho", "cotovelo", "registro", "valvula", "ralo", "sifao", "caixa dagua", "esgoto", "torneira"]):
        return "Hidráulica"
    if any(w in d for w in ["cabo", "fio", "disjuntor", "tomada", "interruptor", "conduite", "lampada", "spot", "led", "quadro"]):
        return "Elétrica"
    if any(w in d for w in ["tinta", "massa corrida", "selador", "verniz", "rolo", "pincel", "fita crepe", "lixa"]):
        return "Tintas e Pintura"
    if any(w in d for w in ["fechadura", "dobradiça", "prego", "parafuso", "bucha", "disco", "broca", "espátula"]):
        return "Ferragens e Ferramentas"
    if any(w in d for w in ["mao de obra", "diaria", "instalacao", "servico", "frete"]):
        return "Mão de Obra e Serviços"
    return "Materiais Gerais"


def parse_xml_nfe(xml_text: str) -> Dict[str, Any]:
    """Extrai cabeçalho e itens de arquivos XML oficiais de NF-e ou NFC-e (SEFAZ)."""
    # Remove namespaces para facilitar navegação via XPath
    clean_xml = re.sub(r'\sxmlns(:\w+)?="[^"]+"', '', xml_text, count=0)
    root = ET.fromstring(clean_xml)

    # 1. Identificação da Nota
    ide = root.find(".//ide")
    n_nf = ide.findtext("nNF") if ide is not None else None
    serie = ide.findtext("serie") if ide is not None else None
    dh_emi = ide.findtext("dhEmi") or ide.findtext("dEmi") if ide is not None else None
    data_compra = date.today().isoformat()
    if dh_emi:
        data_compra = dh_emi.split("T")[0]

    # 2. Emitente (Fornecedor)
    emit = root.find(".//emit")
    razao_social = emit.findtext("xNome") if emit is not None else "Fornecedor Local"
    fantasia = emit.findtext("xFant") if emit is not None else None
    cnpj = emit.findtext("CNPJ") if emit is not None else None
    fornecedor_nome = fantasia or razao_social or "Fornecedor Local"

    # Chave de acesso de 44 dígitos
    inf_nfe = root.find(".//infNFe")
    chave_acesso = None
    if inf_nfe is not None and "Id" in inf_nfe.attrib:
        chave_acesso = inf_nfe.attrib["Id"].replace("NFe", "")

    # 3. Totais
    total_elem = root.find(".//total/ICMSTot")
    valor_total = float(total_elem.findtext("vNF", "0.0")) if total_elem is not None else 0.0
    valor_frete = float(total_elem.findtext("vFrete", "0.0")) if total_elem is not None else 0.0
    valor_desconto = float(total_elem.findtext("vDesc", "0.0")) if total_elem is not None else 0.0

    # 4. Forma de Pagamento
    forma_pagamento = "cartao_credito"
    t_pag = root.findtext(".//pag//tPag") or root.findtext(".//detPag/tPag")
    if t_pag == "01":
        forma_pagamento = "dinheiro"
    elif t_pag in ["03", "04"]:
        forma_pagamento = "cartao_credito" if t_pag == "03" else "cartao_debito"
    elif t_pag == "15":
        forma_pagamento = "boleto"
    elif t_pag == "17":
        forma_pagamento = "pix"

    # 5. Itens Detalhados (Line items)
    itens = []
    for idx, det in enumerate(root.findall(".//det")):
        prod = det.find("prod")
        if prod is None:
            continue
        c_prod = prod.findtext("cProd")
        x_prod = prod.findtext("xProd", f"Item {idx + 1}")
        ncm = prod.findtext("NCM")
        u_com = _normalize_unit(prod.findtext("uCom"))
        q_com = float(prod.findtext("qCom", "1.0"))
        v_un_com = float(prod.findtext("vUnCom", "0.0"))
        v_prod = float(prod.findtext("vProd", str(q_com * v_un_com)))

        itens.append({
            "id": f"xml-item-{idx + 1}",
            "codigo_produto": c_prod,
            "descricao": x_prod,
            "ncm": ncm,
            "quantidade": q_com,
            "unidade": u_com,
            "valor_unitario": v_un_com,
            "valor_total": v_prod,
            "categoria_sugerida": _infer_category(x_prod),
        })

    return {
        "sucesso": True,
        "metodo_extracao": "xml_sefaz",
        "fornecedor_nome": fornecedor_nome,
        "cnpj": cnpj,
        "numero_nf": n_nf,
        "serie": serie,
        "chave_acesso": chave_acesso,
        "data_compra": data_compra,
        "valor_total": valor_total if valor_total > 0 else sum(i["valor_total"] for i in itens),
        "valor_frete": valor_frete,
        "valor_desconto": valor_desconto,
        "forma_pagamento_sugerida": forma_pagamento,
        "itens": itens,
        "confianca_geral": 1.0,
        "observacoes": f"XML de NF-e processado com sucesso. {len(itens)} itens faturados.",
    }


def parse_invoice_multimodal(file_bytes: bytes, mime_type: str, filename: str) -> Dict[str, Any]:
    """
    Agente Multimodal com LLM Vision (Gemini):
    Extrai informações estruturadas de fotos de cupons térmicos (NFC-e, SAT),
    DANFEs em PDF, recibos de depósito local e comprovantes de canteiro.
    """
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY não configurada. Utilizando fallback inteligente de extração.")
        return _fallback_extraction(filename)

    base64_data = base64.b64encode(file_bytes).decode("utf-8")

    system_instruction = (
        "Você é o Agente Especialista em Ingestão Fiscal e Suprimentos de Construção Civil do Sistema de Obras (ObraCerta / ICENV). "
        "Sua missão é inspecionar minuciosamente este documento (que pode ser DANFE de NF-e A4, Cupom Fiscal Eletrônico NFC-e em bobina térmica estreita, "
        "CF-e SAT de São Paulo, foto de cupom de balcão amassado ou canhoto de depósito tipo JER, Telhanorte, Sodimac, Leroy Merlin) "
        "e extrair dados estruturados fiéis em formato JSON estrito.\n\n"
        "REGRAS DE EXTRAÇÃO:\n"
        "1. Fornecedor: Identifique a Razão Social ou Nome Fantasia claro (ex: 'Telhanorte', 'Sodimac', 'JER Materiais de Construção', 'Leroy Merlin', etc.).\n"
        "2. Identificação da Nota: Número da NF, Cupom ou Extrato SAT, Série e Chave de Acesso (se houver).\n"
        "3. Data: Data da emissão ou compra no formato YYYY-MM-DD. Se ano for ambíguo, considere 2026.\n"
        "4. Valores: Valor total líquido pago (float), valor do frete e desconto se destacados.\n"
        "5. Forma de Pagamento: Escolha entre ['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'dinheiro'].\n"
        "6. Itens Faturados: Tabela de produtos comprados:\n"
        "   - descricao: Nome claro e normalizado do insumo (ex: 'Porcelanato Bianco di Lucca 84x84', 'Argamassa AC-III Cinza 20kg').\n"
        "   - quantidade: Quantidade numérica comprada (float).\n"
        "   - unidade: Normalizada entre 'un', 'cx', 'saco', 'm²', 'm', 'kg', 'l'.\n"
        "   - valor_unitario: Preço unitário real pago (float).\n"
        "   - valor_total: Preço total daquela linha de item (float).\n"
        "7. Se for um comprovante resumido de maquininha de cartão sem lista de itens, gere 1 item consolidado: descricao='Materiais e Insumos Diversos (Comprovante Balcão)' com o valor total pago.\n"
        "8. Responda APENAS com o objeto JSON válido, sem texto introdutório ou markdown extra."
    )

    prompt = (
        "Extraia os dados fiscais desta Nota Fiscal / Cupom Fiscal da obra civil conforme o schema JSON:\n"
        "{\n"
        '  "fornecedor_nome": string,\n'
        '  "cnpj": string or null,\n'
        '  "numero_nf": string or null,\n'
        '  "serie": string or null,\n'
        '  "chave_acesso": string or null,\n'
        '  "data_compra": "YYYY-MM-DD",\n'
        '  "valor_total": float,\n'
        '  "valor_frete": float,\n'
        '  "valor_desconto": float,\n'
        '  "forma_pagamento_sugerida": string,\n'
        '  "itens": [\n'
        '    {\n'
        '      "descricao": string,\n'
        '      "quantidade": float,\n'
        '      "unidade": string,\n'
        '      "valor_unitario": float,\n'
        '      "valor_total": float\n'
        '    }\n'
        '  ]\n'
        "}"
    )

    models_to_try = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash",
        "gemini-2.5-flash-lite",
    ]
    last_error = None

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\n{prompt}"},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64_data,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json",
            },
        }

        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "").strip()
                            clean_json = re.sub(r"^```json\s*", "", raw_text)
                            clean_json = re.sub(r"\s*```$", "", clean_json)
                            parsed = json.loads(clean_json)

                            # Normalizações pós-extração
                            itens = parsed.get("itens", [])
                            for idx, it in enumerate(itens):
                                it["id"] = f"ia-item-{idx + 1}"
                                it["unidade"] = _normalize_unit(it.get("unidade"))
                                it["categoria_sugerida"] = _infer_category(it.get("descricao", ""))
                                qtd = float(it.get("quantidade") or 1.0)
                                v_unit = float(it.get("valor_unitario") or 0.0)
                                v_tot = float(it.get("valor_total") or (qtd * v_unit))
                                it["quantidade"] = qtd
                                it["valor_unitario"] = v_unit
                                it["valor_total"] = v_tot

                            v_total = float(parsed.get("valor_total") or sum(it["valor_total"] for it in itens) or 0.0)

                            return {
                                "sucesso": True,
                                "metodo_extracao": "ia_multimodal",
                                "fornecedor_nome": parsed.get("fornecedor_nome") or "Fornecedor Local",
                                "cnpj": parsed.get("cnpj"),
                                "numero_nf": parsed.get("numero_nf"),
                                "serie": parsed.get("serie"),
                                "chave_acesso": parsed.get("chave_acesso"),
                                "data_compra": parsed.get("data_compra") or date.today().isoformat(),
                                "valor_total": v_total,
                                "valor_frete": float(parsed.get("valor_frete") or 0.0),
                                "valor_desconto": float(parsed.get("valor_desconto") or 0.0),
                                "forma_pagamento_sugerida": parsed.get("forma_pagamento_sugerida") or "cartao_credito",
                                "itens": itens,
                                "confianca_geral": 0.94,
                                "observacoes": f"Extraído via Agente Multimodal IA ({model_name}). {len(itens)} itens detectados.",
                            }
                else:
                    last_error = f"HTTP {res.status_code}: {res.text[:200]}"
                    logger.warning(f"Tentativa com {model_name} falhou: {last_error}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Exceção ao chamar {model_name}: {e}")

    logger.error(f"Todas as tentativas de extração IA falharam. Último erro: {last_error}")
    return _fallback_extraction(filename, erro=last_error)


def _fallback_extraction(filename: str, erro: Optional[str] = None) -> Dict[str, Any]:
    """Gera um esqueleto estruturado quando não há chave ou há falha de conexão."""
    name_clean = os.path.splitext(filename)[0].replace("_", " ").title()
    # Tenta deduzir fornecedor comum pelo nome do arquivo
    forn = "Fornecedor Local"
    if "telhanorte" in filename.lower():
        forn = "Telhanorte"
    elif "sodimac" in filename.lower():
        forn = "Sodimac"
    elif "jer" in filename.lower():
        forn = "JER Materiais de Construção"
    elif "leroy" in filename.lower():
        forn = "Leroy Merlin"

    return {
        "sucesso": True,
        "metodo_extracao": "fallback",
        "fornecedor_nome": forn,
        "cnpj": None,
        "numero_nf": f"NF-{date.today().strftime('%m%d')}-01",
        "serie": "1",
        "chave_acesso": None,
        "data_compra": date.today().isoformat(),
        "valor_total": 0.0,
        "valor_frete": 0.0,
        "valor_desconto": 0.0,
        "forma_pagamento_sugerida": "cartao_credito",
        "itens": [
            {
                "id": "fallback-item-1",
                "descricao": f"Compra registrada a partir do documento {filename}",
                "quantidade": 1.0,
                "unidade": "un",
                "valor_unitario": 0.0,
                "valor_total": 0.0,
                "categoria_sugerida": "Materiais Gerais",
            }
        ],
        "confianca_geral": 0.50,
        "observacoes": (
            f"Extração em modo local offline. "
            + (f"Motivo: {erro[:100]}" if erro else "Verifique e complete os valores no formulário.")
        ),
    }


def reconcile_with_wbs(itens: List[Dict[str, Any]], projeto_id: Optional[str], db: Session) -> List[Dict[str, Any]]:
    """
    Reconciliador Semântico com a WBS da Obra:
    Para cada item faturado da nota, localiza o item planejado mais aderente
    na EAP do projeto ativo para sugerir a conciliação ("De-Para") automática.
    """
    if not projeto_id:
        return itens

    # Busca os itens do projeto via Cenario
    itens_planejados = []
    if projeto_id:
        itens_planejados = (
            db.query(ItemProjeto)
            .join(Cenario, ItemProjeto.cenario_id == Cenario.id)
            .filter(Cenario.projeto_id == projeto_id)
            .all()
        )
    if not itens_planejados:
        itens_planejados = db.query(ItemProjeto).all()

    def _normalize_tokens(text: str) -> set:
        clean = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        tokens = set(clean.split())
        stopwords = {"de", "para", "com", "e", "em", "do", "da", "dos", "das", "um", "uma", "o", "a", "os", "as"}
        return tokens - stopwords

    for item_nf in itens:
        desc_nf = item_nf.get("descricao", "")
        tokens_nf = _normalize_tokens(desc_nf)
        if not tokens_nf:
            continue

        best_match = None
        best_score = 0.0

        for it_plan in itens_planejados:
            nome_plan = it_plan.material.descricao if it_plan.material else ""
            classe_plan = (
                it_plan.material.categoria.classe
                if (it_plan.material and it_plan.material.categoria)
                else ""
            )
            tokens_plan = _normalize_tokens(f"{nome_plan} {classe_plan}")

            intersection = tokens_nf & tokens_plan
            if not intersection:
                continue

            score = len(intersection) / max(len(tokens_nf), len(tokens_plan), 1)

            # Bônus para mesma categoria inferida
            if item_nf.get("categoria_sugerida") == classe_plan:
                score += 0.2

            if score > best_score:
                best_score = score
                best_match = it_plan

        if best_match and best_score >= 0.35:
            item_nf["item_projeto_id_sugerido"] = best_match.id
            desc_mat = best_match.material.descricao if best_match.material else "Item"
            amb_nome = best_match.ambiente.nome if best_match.ambiente else "Geral"
            item_nf["item_projeto_nome_sugerido"] = f"{desc_mat} (Ambiente: {amb_nome})"
            item_nf["confianca_matching"] = round(min(best_score, 0.98), 2)

    return itens


def process_invoice_file(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    projeto_id: Optional[str],
    db: Session,
) -> IngestaoNotaFiscalResponse:
    """
    Ponto de entrada unificado para processamento de Notas Fiscais e Cupons Fiscais.
    Detecta automaticamente o formato (XML vs PDF/Imagem) e executa o fluxo agêntico.
    """
    ext = os.path.splitext(filename.lower())[1]

    # 1. Caminho XML
    if ext == ".xml" or b"<nfeProc" in file_bytes[:500] or b"<NFe" in file_bytes[:500]:
        try:
            xml_text = file_bytes.decode("utf-8", errors="replace")
            res_dict = parse_xml_nfe(xml_text)
        except Exception as e:
            logger.error(f"Erro ao processar XML de NF: {e}")
            res_dict = _fallback_extraction(filename, erro=str(e))
    # 2. Caminho Multimodal (PDF, PNG, JPG, WEBP)
    else:
        mime = content_type or "application/octet-stream"
        if ext in [".jpg", ".jpeg"]:
            mime = "image/jpeg"
        elif ext == ".png":
            mime = "image/png"
        elif ext == ".webp":
            mime = "image/webp"
        elif ext == ".pdf":
            mime = "application/pdf"

        res_dict = parse_invoice_multimodal(file_bytes, mime, filename)

    # 3. Conciliação com a WBS da Obra Ativa
    itens_conciliados = reconcile_with_wbs(res_dict.get("itens", []), projeto_id, db)
    res_dict["itens"] = itens_conciliados
    res_dict["arquivo_nome"] = filename

    # Converte os itens para os schemas Pydantic
    itens_schemas = [ItemNotaFiscalExtraido(**it) for it in itens_conciliados]

    return IngestaoNotaFiscalResponse(
        sucesso=res_dict.get("sucesso", True),
        metodo_extracao=res_dict.get("metodo_extracao", "ia_multimodal"),
        fornecedor_nome=res_dict.get("fornecedor_nome", "Fornecedor Local"),
        cnpj=res_dict.get("cnpj"),
        numero_nf=res_dict.get("numero_nf"),
        serie=res_dict.get("serie"),
        chave_acesso=res_dict.get("chave_acesso"),
        data_compra=res_dict.get("data_compra", date.today().isoformat()),
        valor_total=float(res_dict.get("valor_total", 0.0)),
        valor_frete=float(res_dict.get("valor_frete", 0.0)),
        valor_desconto=float(res_dict.get("valor_desconto", 0.0)),
        forma_pagamento_sugerida=res_dict.get("forma_pagamento_sugerida", "cartao_credito"),
        itens=itens_schemas,
        confianca_geral=float(res_dict.get("confianca_geral", 0.95)),
        observacoes=res_dict.get("observacoes"),
        arquivo_nome=filename,
    )
