import re
import json
import math
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.database import get_db
from app.models.entities import (
    Projeto,
    Material,
    Fornecedor,
    RequisicaoCampo,
    ItemRequisicao,
    RegistroAuditoria,
)
from app.api.schemas import (
    RequisicaoMensagemIn,
    RequisicaoMensagemResponse,
    ItemRequisicaoOut,
    DimensionarAmbienteIn,
    DimensionarAmbienteOut,
    ItemBOM,
)

router = APIRouter()


@router.get("/requisicoes")
@router.get("/ia/requisicoes")
def list_requisicoes_campo(projeto_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lista todas as requisições recebidas do campo (WhatsApp/N8N) com itens e status."""
    query = db.query(RequisicaoCampo)
    if projeto_id:
        query = query.filter_by(projeto_id=projeto_id)
    requisicoes = query.order_by(desc(RequisicaoCampo.criado_em)).all()

    resultado = []
    for r in requisicoes:
        itens = db.query(ItemRequisicao).filter_by(requisicao_id=r.id).all()
        resultado.append({
            "id": r.id,
            "projeto_id": r.projeto_id,
            "remetente_nome": r.remetente_nome,
            "canal": r.canal,
            "texto_original": r.texto_original,
            "audio_url": r.audio_url,
            "status": r.status,
            "criado_em": r.criado_em.isoformat() if r.criado_em else None,
            "data_requisicao": r.data_requisicao.isoformat() if r.data_requisicao else None,
            "itens": [
                {
                    "id": it.id,
                    "descricao_informal": it.descricao_informal,
                    "qtd_solicitada": float(it.qtd_solicitada or 1.0),
                    "unidade_solicitada": it.unidade_solicitada,
                    "material_sugerido_id": it.material_sugerido_id,
                    "loja_sugerida_id": it.loja_sugerida_id,
                    "loja_sugerida_nome": it.loja_sugerida.nome if it.loja_sugerida else None,
                    "status": it.status,
                }
                for it in itens
            ],
        })
    return resultado


@router.patch("/requisicoes/{requisicao_id}/status")
@router.patch("/ia/requisicoes/{requisicao_id}/status")
def update_status_requisicao(requisicao_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Atualiza o status de aprovação ou andamento de uma requisição de campo."""
    r = db.query(RequisicaoCampo).filter_by(id=requisicao_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Requisição não encontrada")
    if "status" in payload:
        r.status = payload["status"]
        db.commit()
        db.refresh(r)
    return {"id": r.id, "status": r.status}


@router.post("/processar-requisicao-mensagem", response_model=RequisicaoMensagemResponse)
@router.post("/ia/processar-requisicao-mensagem", response_model=RequisicaoMensagemResponse)
def processar_requisicao_mensagem(payload: RequisicaoMensagemIn, db: Session = Depends(get_db)):
    """
    Processa mensagens de texto ou áudios transcritos do WhatsApp de mestres de obra (Wagner),
    faz matching de cada item com o catálogo canônico e lojas homologadas, e persiste a requisição.
    """
    projeto = None
    if payload.projeto_id:
        projeto = db.query(Projeto).filter_by(id=payload.projeto_id).first()
    if not projeto:
        projeto = db.query(Projeto).first()

    if not projeto:
        raise HTTPException(status_code=404, detail="Nenhum projeto ativo encontrado para vincular a requisição")

    # 1. Cria o registro mestre da requisição de campo
    nova_requisicao = RequisicaoCampo(
        projeto_id=projeto.id,
        remetente_nome=payload.remetente_nome,
        canal=payload.canal,
        texto_original=payload.texto_mensagem,
        audio_url=payload.audio_url,
        status="Processado",
    )
    db.add(nova_requisicao)
    db.flush()

    texto = payload.texto_mensagem
    itens_extraidos = []

    # Heurística de parsing de lista de materiais (compatível com regex ou chamadas LLM)
    # Procura padrões como "5 sacos de cimento", "10 joelhos 25mm", "20m de conduíte", "1 caixa 4x2"
    linhas_ou_frases = re.split(r"[,\n;]|\be\b", texto, flags=re.IGNORECASE)

    materiais_cadastrados = db.query(Material).all()
    forn_jer = db.query(Fornecedor).filter(Fornecedor.nome.like("%JER%")).first()
    forn_telhanorte = db.query(Fornecedor).filter(Fornecedor.nome.like("%Telhanorte%")).first()
    forn_leroy = db.query(Fornecedor).filter(Fornecedor.nome.like("%Leroy%")).first()

    for trecho in linhas_ou_frases:
        trecho_limpo = trecho.strip()
        if len(trecho_limpo) < 3:
            continue

        # Regex para quantidade e unidade
        match_qtd = re.search(r"(\d+(?:[\.,]\d+)?)\s*(sacos?|unidades?|un|m²|m2|metros?|m|caixas?|cx|latas?|peças?|folhas?|barras?)?\s*(?:de\s*)?(.+)", trecho_limpo, re.IGNORECASE)
        if match_qtd:
            qtd = float(match_qtd.group(1).replace(",", "."))
            un = match_qtd.group(2) or "un"
            descricao_item = match_qtd.group(3).strip()
        else:
            qtd = 1.0
            un = "un"
            descricao_item = trecho_limpo

        # Matching com catálogo
        desc_upper = descricao_item.upper()
        mat_encontrado = None
        for m in materiais_cadastrados:
            palavras = m.descricao.upper().split()
            if any(p in desc_upper for p in palavras if len(p) >= 4):
                mat_encontrado = m
                break

        # Regra de fornecedor sugerido por tipo de material
        loja_sugerida = forn_telhanorte
        if any(w in desc_upper for w in ["CIMENTO", "AREIA", "BRITA", "BLOCO", "ARGAMASSA"]):
            loja_sugerida = forn_jer or forn_telhanorte
        elif any(w in desc_upper for w in ["RALO", "REGISTRO", "CHUVEIRO", "TINTA", "PINCEL"]):
            loja_sugerida = forn_leroy or forn_telhanorte

        preco_ref = 35.00
        if "CIMENTO" in desc_upper:
            preco_ref = 34.50
        elif "CONDUÍTE" in desc_upper or "ELETRODUTO" in desc_upper:
            preco_ref = 2.20
        elif "JOELHO" in desc_upper or "COTOVELO" in desc_upper:
            preco_ref = 2.50
        elif "CAIXA 4X2" in desc_upper:
            preco_ref = 2.80

        subtotal = round(qtd * preco_ref, 2)

        # Salva o ItemRequisicao
        item_req = ItemRequisicao(
            requisicao_id=nova_requisicao.id,
            descricao_informal=descricao_item[:250],
            qtd_solicitada=qtd,
            unidade_solicitada=un[:20],
            material_sugerido_id=mat_encontrado.id if mat_encontrado else None,
            loja_sugerida_id=loja_sugerida.id if loja_sugerida else None,
            status="Pendente",
        )
        db.add(item_req)

        itens_extraidos.append(
            ItemRequisicaoOut(
                descricao_informal=descricao_item,
                qtd_solicitada=qtd,
                unidade_solicitada=un,
                material_sugerido_id=mat_encontrado.id if mat_encontrado else None,
                material_sugerido_nome=mat_encontrado.descricao if mat_encontrado else f"Item Homologado: {descricao_item}",
                fabricante_sugerido=mat_encontrado.fabricante if mat_encontrado else "Marca Homologada",
                loja_sugerida_id=loja_sugerida.id if loja_sugerida else None,
                loja_sugerida_nome=loja_sugerida.nome if loja_sugerida else "Depósito Homologado",
                preco_referencia=preco_ref,
                subtotal_estimado=subtotal,
            )
        )

    # Formatar resposta amigável para envio de volta ao grupo do WhatsApp
    linhas_msg = [
        f"🤖 *Assistente de Obras ICENV*",
        f"✅ *Requisição registrada com sucesso!*",
        f"👤 *Solicitante:* {payload.remetente_nome}",
        f"📋 *Itens Identificados ({len(itens_extraidos)}):*",
    ]
    for it in itens_extraidos:
        linhas_msg.append(f" • *{it.qtd_solicitada} {it.unidade_solicitada}* — {it.descricao_informal} (Sugerido: {it.loja_sugerida_nome})")
    linhas_msg.append("\n📌 *Status:* Gravado na fila de cotação/compra para aprovação do gestor.")

    mensagem_formatada = "\n".join(linhas_msg)

    # Registrar auditoria
    db.add(
        RegistroAuditoria(
            usuario_nome=payload.remetente_nome,
            papel="mestre_obras",
            acao="requisicao_mensagem_whatsapp",
            entidade="requisicao_campo",
            entidade_id=nova_requisicao.id,
            detalhes={"total_itens": len(itens_extraidos), "texto": payload.texto_mensagem},
        )
    )

    db.commit()

    return RequisicaoMensagemResponse(
        requisicao_id=nova_requisicao.id,
        status="Processado",
        remetente=payload.remetente_nome,
        texto_original=payload.texto_mensagem,
        total_itens=len(itens_extraidos),
        itens=itens_extraidos,
        mensagem_whatsapp_formatada=mensagem_formatada,
    )


@router.post("/ia/dimensionar-ambiente", response_model=DimensionarAmbienteOut)
def dimensionar_ambiente_ia(payload: DimensionarAmbienteIn, db: Session = Depends(get_db)):
    """
    Gera a Lista Mestra de Materiais (BOM) paramétrica a partir das metragens de projeto:
    Aplica perdas técnicas (+10% revestimentos, +5% bruto) e arredondamento em caixas/sacos inteiros.
    """
    area_piso = payload.area_piso
    area_parede = payload.area_parede
    estilo = (payload.cenario_estilo or "standard").lower()

    # 1. Revestimento de Piso (Porcelanato Retificado)
    # Caixa com 2.43 m² (Eliane 90x90) ou 2.16 m²
    fator_cx_piso = 2.43 if estilo == "premium" else 2.14
    preco_m2_piso = 145.04 if estilo == "premium" else 79.90
    qtd_liquida_piso = area_piso
    qtd_bruta_piso = round(qtd_liquida_piso * 1.10, 2)  # +10% corte
    cx_piso = math.ceil(qtd_bruta_piso / fator_cx_piso)

    # 2. Revestimento de Parede (Azulejo / Porcelanato Parede)
    fator_cx_parede = 2.43 if estilo == "premium" else 1.80
    preco_m2_parede = 145.04 if estilo == "premium" else 58.90
    qtd_liquida_parede = area_parede
    qtd_bruta_parede = round(qtd_liquida_parede * 1.10, 2)
    cx_parede = math.ceil(qtd_bruta_parede / fator_cx_parede)

    # 3. Argamassa AC-III Externa (1 saco de 20kg rende ~3.5 a 4 m² em dupla colagem)
    area_total_revestir = qtd_bruta_piso + qtd_bruta_parede
    sacos_argamassa = math.ceil(area_total_revestir / 3.8)

    # 4. Rejunte Acrílico Antifungo (1 pote de 1kg rende ~8 m² para junta 1.5mm)
    potes_rejunte = math.ceil(area_total_revestir / 8.0)

    # 5. Itens hidráulicos e metais
    bacia_nome = "Kit Bacia Sanitária com Caixa Acoplada Smart Branca Celite" if estilo == "premium" else "Kit Bacia Caixa Acoplada Standard Deca"
    bacia_preco = 1404.53 if estilo == "premium" else 680.00

    torneira_nome = "Torneira Lavatório Mesa Bica Alta Nova Logg Docol" if estilo == "premium" else "Torneira Cromada Monocomando Standard"
    torneira_preco = 579.90 if estilo == "premium" else 220.00

    itens_bom: List[ItemBOM] = [
        ItemBOM(
            descricao=f"Porcelanato Retificado {'Palavcorda 90x90 Eliane' if estilo == 'premium' else 'Piso 60x60 Retificado'}",
            categoria="Revestimento",
            fabricante_sugerido="Eliane" if estilo == "premium" else "Portobello",
            qtd_liquida=qtd_liquida_piso,
            margem_perda_pct=10.0,
            qtd_bruta_calculada=qtd_bruta_piso,
            unidade="m²",
            fator_embalagem=fator_cx_piso,
            qtd_embalagem_fechada=cx_piso,
            unidade_embalagem="cx",
            preco_unitario_estimado=preco_m2_piso,
            subtotal_estimado=round(cx_piso * fator_cx_piso * preco_m2_piso, 2),
            loja_sugerida="Telhanorte",
        ),
        ItemBOM(
            descricao=f"Revestimento Parede Retificado {'Palavcorda 90x90 Eliane' if estilo == 'premium' else 'Azulejo 30x60 Branco'}",
            categoria="Revestimento",
            fabricante_sugerido="Eliane" if estilo == "premium" else "Incepa",
            qtd_liquida=qtd_liquida_parede,
            margem_perda_pct=10.0,
            qtd_bruta_calculada=qtd_bruta_parede,
            unidade="m²",
            fator_embalagem=fator_cx_parede,
            qtd_embalagem_fechada=cx_parede,
            unidade_embalagem="cx",
            preco_unitario_estimado=preco_m2_parede,
            subtotal_estimado=round(cx_parede * fator_cx_parede * preco_m2_parede, 2),
            loja_sugerida="Telhanorte",
        ),
        ItemBOM(
            descricao="Argamassa Colante AC-III Externa Cinza 20kg",
            categoria="Bruto / Estrutura",
            fabricante_sugerido="Quartzolit",
            qtd_liquida=float(sacos_argamassa),
            margem_perda_pct=5.0,
            qtd_bruta_calculada=float(sacos_argamassa),
            unidade="saco",
            fator_embalagem=20.0,
            qtd_embalagem_fechada=sacos_argamassa,
            unidade_embalagem="saco 20kg",
            preco_unitario_estimado=37.84,
            subtotal_estimado=round(sacos_argamassa * 37.84, 2),
            loja_sugerida="JER Depósito de Mat. Construção",
        ),
        ItemBOM(
            descricao="Rejunte Acrílico Antifungo Corda/Cinza 1kg",
            categoria="Revestimento",
            fabricante_sugerido="Quartzolit",
            qtd_liquida=float(potes_rejunte),
            margem_perda_pct=0.0,
            qtd_bruta_calculada=float(potes_rejunte),
            unidade="un",
            fator_embalagem=1.0,
            qtd_embalagem_fechada=potes_rejunte,
            unidade_embalagem="pote 1kg",
            preco_unitario_estimado=37.37,
            subtotal_estimado=round(potes_rejunte * 37.37, 2),
            loja_sugerida="Telhanorte",
        ),
        ItemBOM(
            descricao=bacia_nome,
            categoria="Louças & Metais",
            fabricante_sugerido="Celite" if estilo == "premium" else "Deca",
            qtd_liquida=1.0,
            margem_perda_pct=0.0,
            qtd_bruta_calculada=1.0,
            unidade="un",
            fator_embalagem=1.0,
            qtd_embalagem_fechada=1,
            unidade_embalagem="conjunto",
            preco_unitario_estimado=bacia_preco,
            subtotal_estimado=bacia_preco,
            loja_sugerida="Telhanorte",
        ),
        ItemBOM(
            descricao=torneira_nome,
            categoria="Louças & Metais",
            fabricante_sugerido="Docol",
            qtd_liquida=1.0,
            margem_perda_pct=0.0,
            qtd_bruta_calculada=1.0,
            unidade="un",
            fator_embalagem=1.0,
            qtd_embalagem_fechada=1,
            unidade_embalagem="un",
            preco_unitario_estimado=torneira_preco,
            subtotal_estimado=torneira_preco,
            loja_sugerida="Telhanorte",
        ),
        ItemBOM(
            descricao="Kit Nivelador de Porcelanato 1.0mm e Cunhas",
            categoria="Revestimento",
            fabricante_sugerido="Cortag",
            qtd_liquida=1.0,
            margem_perda_pct=0.0,
            qtd_bruta_calculada=1.0,
            unidade="un",
            fator_embalagem=1.0,
            qtd_embalagem_fechada=1,
            unidade_embalagem="kit",
            preco_unitario_estimado=91.57,
            subtotal_estimado=91.57,
            loja_sugerida="Telhanorte",
        ),
    ]

    custo_total = sum(it.subtotal_estimado for it in itens_bom)

    return DimensionarAmbienteOut(
        ambiente=f"{payload.tipo_ambiente.title()} ({area_piso:.1f}m² piso / {area_parede:.1f}m² parede)",
        area_piso=area_piso,
        area_parede=area_parede,
        cenario=estilo.upper(),
        total_itens_calculados=len(itens_bom),
        custo_total_estimado=round(custo_total, 2),
        itens=itens_bom,
    )
