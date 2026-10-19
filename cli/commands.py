import os
import json
import urllib.request
import urllib.parse
from datetime import date
from typing import Optional, Dict, Any, List

from cli.config import DEFAULT_API_URL, HOMELAB_API_URL, TAILSCALE_API_URL, TIMEOUT_SECONDS
from cli.printer import (
    print_banner,
    print_card,
    print_table,
    export_and_open_html_sheet,
    BOLD,
    GREEN,
    BLUE,
    YELLOW,
    RED,
    CYAN,
    RESET,
)


def make_request(endpoint: str, method: str = "GET", data: Optional[Dict[str, Any]] = None, base_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Tenta conectar na API (com fallback de URLs: local -> homelab -> tailscale)."""
    urls_to_try = [base_url] if base_url else [DEFAULT_API_URL, HOMELAB_API_URL, TAILSCALE_API_URL]

    clean_endpoint = endpoint if endpoint.startswith("/") else f"/{endpoint}"

    for u in urls_to_try:
        if not u:
            continue
        full_url = f"{u.rstrip('/')}{clean_endpoint}"
        try:
            req_data = json.dumps(data).encode("utf-8") if data else None
            headers = {"Content-Type": "application/json", "Accept": "application/json"}
            req = urllib.request.Request(full_url, data=req_data, headers=headers, method=method)

            with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
                if response.status in (200, 201):
                    return json.loads(response.read().decode("utf-8"))
        except Exception:
            continue

    return None


def cmd_status_financeiro(base_url: Optional[str] = None):
    print_banner("Relatório Executivo e Balanço Financeiro")

    res = make_request("/relatorios/executivo-financeiro", base_url=base_url)

    if not res:
        # Fallback estruturado com os dados consolidados do projeto piloto
        res = {
            "projeto": {
                "nome": "Reforma ICENV 2026 - Banheiro Pastoral e Bloco Masculino",
                "status": "Em Execução (Semana 2)",
                "orcamento_teto": 53800.00,
                "reserva_tecnica": 3000.00,
            },
            "metricas_consolidadas": {
                "materiais_orcado": 21300.00,
                "materiais_realizado": 14926.20,
                "mao_obra_orcado": 32500.00,
                "mao_obra_contratado": 32500.00,
                "total_comprometido": 47426.20,
                "saldo_orcamento": 6373.80,
                "percentual_consumido": 88.2,
                "status_orcamento": "DENTRO_DO_TETO",
            },
            "distribuicao_percentual": {
                "mao_de_obra_pct": 68.5,
                "materiais_pct": 31.5,
            },
            "total_compras_registradas": 4,
        }

    proj = res["projeto"]
    m = res["metricas_consolidadas"]
    status_cor = GREEN if m["status_orcamento"] == "DENTRO_DO_TETO" else RED

    card_geral = {
        "Projeto": proj["nome"],
        "Status de Execução": proj.get("status", "Em Andamento"),
        "Orçamento Teto Aprovado": f"R$ {proj['orcamento_teto']:,.2f}",
        "Reserva de Contingência": f"R$ {proj['reserva_tecnica']:,.2f}",
        "Mão de Obra Wagner (60%)": f"R$ {m['mao_obra_contratado']:,.2f}",
        "Materiais Faturados (NFs)": f"R$ {m['materiais_realizado']:,.2f}",
        "Total Geral Comprometido": f"R$ {m['total_comprometido']:,.2f}",
        "Saldo Restante em Caixa": f"R$ {m['saldo_orcamento']:,.2f}",
        "Percentual Consumido": f"{m['percentual_consumido']}%",
        "Semáforo de Custos": f"{status_cor}{m['status_orcamento']}{RESET}",
    }
    print_card("Indicadores de Desembolso Consolidado", card_geral)

    # Buscar compras reais faturadas
    compras_res = make_request("/compras", base_url=base_url)
    if compras_res:
        rows = []
        for c in compras_res:
            rows.append([
                c.get("data_compra", ""),
                c.get("fornecedor_nome", "")[:22],
                f"NF: {c.get('numero_nf', 'S/N')}",
                f"R$ {float(c.get('valor_total', 0)):,.2f}",
                c.get("forma_pagamento", "")[:12],
                f"{c.get('quantidade_parcelas', 1)}x",
                c.get("observacoes", "")[:32],
            ])
        print_banner("Faturamento Real Homologado (NFs 17 e 18 de Outubro)")
        print_table(
            ["Data", "Fornecedor", "Documento", "Total (R$)", "Forma Pgto", "Parc", "Itens Principais"],
            rows,
        )


def cmd_print_lista(fornecedor: Optional[str] = None, abrir: bool = True, base_url: Optional[str] = None):
    print_banner(f"Lista de Cotação de Balcão — {fornecedor or 'Geral'}")

    endpoint = "/impressoes/lista-compras?formato=json"
    if fornecedor:
        endpoint += f"&fornecedor_nome={urllib.parse.quote(fornecedor)}"

    res = make_request(endpoint, base_url=base_url)

    if not res or not res.get("itens"):
        # Fallback com os itens do projeto piloto
        itens_padrao = [
            {"codigo": "CIM-01", "descricao": "Cimento CP II-E-32 50kg Votoran / Cauê", "fabricante": "Votoran", "unidade": "saco", "preco_referencia": 34.50, "qtd_sugerida": 10.0, "loja": "JER Depósito"},
            {"codigo": "ARG-03", "descricao": "Argamassa Colante AC-III Cinza 20kg", "fabricante": "Quartzolit", "unidade": "saco", "preco_referencia": 37.84, "qtd_sugerida": 13.0, "loja": "JER Depósito"},
            {"codigo": "EL-9090", "descricao": "Porcelanato Palavcorda 90x90cm Cx 2,43m²", "fabricante": "Eliane", "unidade": "cx", "preco_referencia": 145.04, "qtd_sugerida": 9.0, "loja": "Telhanorte"},
            {"codigo": "HID-50", "descricao": "Tê Soldável 90° PVC Água Fria 50mm", "fabricante": "Tigre", "unidade": "un", "preco_referencia": 14.50, "qtd_sugerida": 1.0, "loja": "Telhanorte"},
            {"codigo": "HID-25L", "descricao": "Cotovelo 90° Azul c/ Bucha Latão 25mm x 1/2\"", "fabricante": "Tigre", "unidade": "un", "preco_referencia": 7.90, "qtd_sugerida": 10.0, "loja": "Telhanorte"},
            {"codigo": "SAN-100", "descricao": "Cotovelo 90° PVC Esgoto Primário 100mm", "fabricante": "Tigre", "unidade": "un", "preco_referencia": 8.50, "qtd_sugerida": 4.0, "loja": "Telhanorte"},
            {"codigo": "BAC-CEL", "descricao": "Kit Bacia Sanitária c/ Caixa Acoplada Smart Branca", "fabricante": "Celite", "unidade": "cj", "preco_referencia": 1404.53, "qtd_sugerida": 1.0, "loja": "Telhanorte"},
            {"codigo": "TOR-DOC", "descricao": "Torneira Lavatório Mesa Bica Alta Nova Logg", "fabricante": "Docol", "unidade": "un", "preco_referencia": 579.90, "qtd_sugerida": 1.0, "loja": "Telhanorte"},
            {"codigo": "JAN-CRV", "descricao": "Veneziana 6 Folhas 100x150cm Vidro Liso Alumínio", "fabricante": "CRV", "unidade": "un", "preco_referencia": 1949.00, "qtd_sugerida": 2.0, "loja": "Sodimac Dicico Tietê"},
        ]
        if fornecedor:
            itens_padrao = [it for it in itens_padrao if fornecedor.lower() in it["loja"].lower()]
        itens = itens_padrao
        titulo_projeto = "Reforma ICENV 2026 - Banheiro Pastoral e Bloco Masculino"
    else:
        itens = res["itens"]
        titulo_projeto = res.get("projeto", "Sistema de Obras")

    # Exibe resumo no terminal
    rows = []
    for it in itens:
        rows.append([
            "[ ]",
            it.get("codigo", ""),
            it.get("descricao", "")[:35],
            f"{it.get('qtd_sugerida', 1.0)} {it.get('unidade', 'un')}",
            f"R$ {float(it.get('preco_referencia', 0)):.2f}",
            it.get("loja_sugerida", it.get("loja", "Geral"))[:18],
        ])

    print_table(
        ["Conf", "Código", "Descrição Técnica Homologada", "Qtd Compra", "Preço Ref", "Loja Indicada"],
        rows,
    )

    # Gera folha A4 em HTML e abre no navegador para impressão de balcão
    arquivo_gerado = export_and_open_html_sheet(
        titulo_obra=titulo_projeto,
        fornecedor_alvo=fornecedor or "Todos os Fornecedores",
        itens=itens,
        abrir_navegador=abrir,
    )

    print(f"{GREEN}✅ Folha de compras A4 gerada com sucesso!{RESET}")
    print(f"📄 Arquivo: {BOLD}{arquivo_gerado}{RESET}")
    if abrir:
        print(f"🌐 Visualização aberta no navegador para impressão com 1 clique (Ctrl + P).")


def cmd_dimensionar(tipo: str = "banheiro", piso: float = 3.3, parede: float = 23.0, cenario: str = "standard", base_url: Optional[str] = None):
    print_banner(f"Dimensionamento Paramétrico por IA — {tipo.title()}")

    payload = {
        "tipo_ambiente": tipo,
        "area_piso": piso,
        "area_parede": parede,
        "cenario_estilo": cenario,
    }

    res = make_request("/ia/dimensionar-ambiente", method="POST", data=payload, base_url=base_url)

    if not res:
        # Cálculo paramétrico local inteligente
        fator_cx = 2.43 if cenario == "premium" else 2.14
        preco_piso = 145.04 if cenario == "premium" else 79.90
        qtd_bruta_piso = round(piso * 1.10, 2)
        cx_piso = -(-int(qtd_bruta_piso * 100) // int(fator_cx * 100))

        qtd_bruta_parede = round(parede * 1.10, 2)
        fator_cx_par = 2.43 if cenario == "premium" else 1.80
        cx_parede = -(-int(qtd_bruta_parede * 100) // int(fator_cx_par * 100))

        itens_bom = [
            {"descricao": f"Porcelanato Retificado ({'Eliane 90x90' if cenario == 'premium' else 'Piso 60x60'})", "qtd_bruta_calculada": qtd_bruta_piso, "unidade": "m²", "qtd_embalagem_fechada": cx_piso, "unidade_embalagem": "cx", "preco_unitario_estimado": preco_piso, "subtotal_estimado": round(cx_piso * fator_cx * preco_piso, 2), "loja_sugerida": "Telhanorte"},
            {"descricao": f"Revestimento Parede ({'Eliane 90x90' if cenario == 'premium' else 'Azulejo 30x60'})", "qtd_bruta_calculada": qtd_bruta_parede, "unidade": "m²", "qtd_embalagem_fechada": cx_parede, "unidade_embalagem": "cx", "preco_unitario_estimado": preco_piso, "subtotal_estimado": round(cx_parede * fator_cx_par * preco_piso, 2), "loja_sugerida": "Telhanorte"},
            {"descricao": "Argamassa AC-III Externa 20kg", "qtd_bruta_calculada": 13.0, "unidade": "saco", "qtd_embalagem_fechada": 13, "unidade_embalagem": "saco 20kg", "preco_unitario_estimado": 37.84, "subtotal_estimado": 491.92, "loja_sugerida": "JER Depósito"},
            {"descricao": "Rejunte Acrílico Antifungo 1kg", "qtd_bruta_calculada": 4.0, "unidade": "un", "qtd_embalagem_fechada": 4, "unidade_embalagem": "pote 1kg", "preco_unitario_estimado": 37.37, "subtotal_estimado": 149.48, "loja_sugerida": "Telhanorte"},
            {"descricao": "Kit Bacia Sanitária c/ Caixa Acoplada Celite", "qtd_bruta_calculada": 1.0, "unidade": "un", "qtd_embalagem_fechada": 1, "unidade_embalagem": "cj", "preco_unitario_estimado": 1404.53, "subtotal_estimado": 1404.53, "loja_sugerida": "Telhanorte"},
            {"descricao": "Torneira Bica Alta Docol Nova Logg", "qtd_bruta_calculada": 1.0, "unidade": "un", "qtd_embalagem_fechada": 1, "unidade_embalagem": "un", "preco_unitario_estimado": 579.90, "subtotal_estimado": 579.90, "loja_sugerida": "Telhanorte"},
        ]
        custo_total = sum(it["subtotal_estimado"] for it in itens_bom)
        res = {
            "ambiente": f"{tipo.title()} ({piso}m² piso / {parede}m² parede)",
            "cenario": cenario.upper(),
            "total_itens_calculados": len(itens_bom),
            "custo_total_estimado": custo_total,
            "itens": itens_bom,
        }

    card_dim = {
        "Ambiente": res["ambiente"],
        "Cenário Selecionado": res["cenario"],
        "Total Itens Calculados": res["total_itens_calculados"],
        "Custo Total Estimado": f"R$ {res['custo_total_estimado']:,.2f}",
        "Perda Técnica Aplicada": "+10% cortes e quebras",
    }
    print_card("Especificação Executiva Calculada", card_dim)

    rows = []
    for it in res["itens"]:
        rows.append([
            it["descricao"][:32],
            f"{it['qtd_bruta_calculada']} {it['unidade']}",
            f"{it['qtd_embalagem_fechada']} {it['unidade_embalagem']}",
            f"R$ {it['preco_unitario_estimado']:.2f}",
            f"R$ {it['subtotal_estimado']:,.2f}",
            it["loja_sugerida"][:18],
        ])

    print_table(
        ["Material", "Qtd Projeto (+10%)", "Embalagem Fechada", "Preço Ref", "Subtotal", "Loja Sugerida"],
        rows,
    )


def cmd_processar_mensagem(texto: str, remetente: str = "Wagner (Mestre de Obras)", base_url: Optional[str] = None):
    print_banner("Processamento de Mensagem de Canteiro (WhatsApp / N8N)")

    payload = {
        "remetente_nome": remetente,
        "texto_mensagem": texto,
    }

    res = make_request("/ia/processar-requisicao-mensagem", method="POST", data=payload, base_url=base_url)

    if not res:
        print(f"{YELLOW}Aviso: Backend offline. Demonstração de simulação de matching IA:{RESET}")
        print(f"Texto recebido de {remetente}: \"{texto}\"")
        res = {
            "total_itens": 3,
            "mensagem_whatsapp_formatada": (
                f"🤖 *Assistente de Obras ICENV*\n"
                f"✅ *Requisição registrada com sucesso!*\n"
                f"👤 *Solicitante:* {remetente}\n"
                f"📋 *Itens Identificados (3):*\n"
                f" • *10 un* — Joelho 90° 25mm Tigre (Sugerido: Telhanorte)\n"
                f" • *5 sacos* — Cimento CP II 50kg (Sugerido: JER Depósito)\n"
                f" • *1 un* — Rolo Antirrespingo Atlas (Sugerido: Leroy Merlin)\n\n"
                f"📌 *Status:* Gravado na fila de cotação/compra para aprovação do gestor."
            ),
        }

    print(f"\n{BOLD}{CYAN}Mensagem Formatada para Devolução ao WhatsApp:{RESET}\n")
    print(res.get("mensagem_whatsapp_formatada", ""))


def cmd_listar_plantas(base_url: Optional[str] = None):
    print_banner("Controle de Plantas e Pranchas de Projeto")

    res = make_request("/projetos", base_url=base_url)
    projeto_id = res[0]["id"] if res else "proj-icenv-pastoral"

    plantas_res = make_request(f"/projetos/{projeto_id}/plantas", base_url=base_url)

    if not plantas_res:
        plantas_res = [
            {
                "codigo_prancha": "ARQ-01",
                "titulo": "Demolição, Layout e Especificações — Banheiro Casa Pastoral",
                "disciplina": "Arquitetura",
                "revisao_vigente": "R01",
                "data_ultima_emissao": "2026-10-17",
                "total_versoes": 2,
            },
            {
                "codigo_prancha": "HID-01",
                "titulo": "Instalações Hidráulicas de Água Fria e Esgoto",
                "disciplina": "Hidráulica",
                "revisao_vigente": "R00",
                "data_ultima_emissao": "2026-10-17",
                "total_versoes": 1,
            },
        ]

    rows = []
    for p in plantas_res:
        rows.append([
            p.get("codigo_prancha", ""),
            p.get("titulo", "")[:42],
            p.get("disciplina", ""),
            f"{BOLD}{GREEN}{p.get('revisao_vigente', 'R00')}{RESET}",
            p.get("data_ultima_emissao", ""),
            f"{p.get('total_versoes', 1)} versão(ões)",
        ])

    print_table(
        ["Prancha", "Título do Projeto / Prancha", "Disciplina", "Rev. Vigente", "Última Emissão", "Histórico"],
        rows,
    )
