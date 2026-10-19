import os
import webbrowser
from datetime import date
from typing import List, Dict, Any, Optional

# Códigos ANSI para estilização limpa no terminal
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"


def print_banner(titulo: str):
    print(f"\n{BOLD}{BLUE}======================================================================{RESET}")
    print(f"{BOLD}{CYAN}  🏗️  SISTEMA DE OBRAS — {titulo.upper()}{RESET}")
    print(f"{BOLD}{BLUE}======================================================================{RESET}")


def print_card(titulo: str, dados: Dict[str, Any]):
    print(f"\n{BOLD}{YELLOW}┌─ {titulo.upper()} {'─' * max(0, 50 - len(titulo))}┐{RESET}")
    for k, v in dados.items():
        val_str = str(v)
        print(f"│  {BOLD}{k:<24}:{RESET} {val_str:<28} │")
    print(f"{BOLD}{YELLOW}└{'─' * 55}┘{RESET}")


def print_table(headers: List[str], rows: List[List[str]], col_widths: Optional[List[int]] = None):
    if not col_widths:
        col_widths = []
        for i in range(len(headers)):
            max_len = len(headers[i])
            for r in rows:
                if i < len(r):
                    max_len = max(max_len, len(str(r[i])))
            col_widths.append(min(max(max_len + 2, 8), 45))

    # Linha de cabeçalho
    header_line = "".join(f"{h:<{w}}" for h, w in zip(headers, col_widths))
    sep_line = "".join("-" * (w - 1) + " " for w in col_widths)

    print(f"\n{BOLD}{header_line}{RESET}")
    print(sep_line)
    for r in rows:
        row_line = "".join(f"{str(cell):<{w}}" for cell, w in zip(r, col_widths))
        print(row_line)
    print()


def export_and_open_html_sheet(
    titulo_obra: str,
    fornecedor_alvo: str,
    itens: List[Dict[str, Any]],
    output_path: Optional[str] = None,
    abrir_navegador: bool = True
) -> str:
    """Gera folha de compras A4 pautada pronta para impressão no navegador."""
    if not output_path:
        data_str = date.today().strftime("%Y%m%d")
        loja_safe = (fornecedor_alvo or "todas_as_lojas").lower().replace(" ", "_").replace("/", "_")
        output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", f"lista_balcao_{loja_safe}_{data_str}.html")

    linhas_html = ""
    for idx, it in enumerate(itens, 1):
        descricao = it.get("descricao", "")
        fabricante = it.get("fabricante", "Homologado")
        codigo = it.get("codigo", "")
        qtd = it.get("qtd_sugerida", it.get("qtd_embalagem_fechada", 1.0))
        unidade = it.get("unidade", it.get("unidade_embalagem", "un"))
        preco_ref = it.get("preco_referencia", it.get("preco_unitario_estimado", 0.0))

        linhas_html += f"""
        <tr>
            <td style="text-align: center; width: 32px;"><div style="width: 14px; height: 14px; border: 1.5px solid #222; margin: auto;"></div></td>
            <td style="text-align: center; font-weight: bold; font-size: 11px;">{idx}</td>
            <td style="font-size: 11px;">
                <strong>{descricao}</strong><br/>
                <span style="color: #666; font-size: 10px;">Marca: {fabricante} | Ref/SKU: {codigo}</span>
            </td>
            <td style="text-align: center; font-weight: bold; font-size: 12px;">{qtd} {unidade}</td>
            <td style="text-align: right; font-size: 11px;">R$ {float(preco_ref):.2f}</td>
            <td style="width: 80px; border-bottom: 1px dotted #999;"></td>
            <td style="width: 80px; border-bottom: 1px dotted #999;"></td>
            <td style="width: 90px; border-bottom: 1px dotted #999;"></td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Lista de Compras de Balcão — {fornecedor_alvo}</title>
    <style>
        @page {{ size: A4 portrait; margin: 12mm; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0; padding: 12px; font-size: 12px; }}
        .header {{ border-bottom: 2.5px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }}
        .title {{ font-size: 17px; font-weight: bold; color: #1e3a8a; margin: 0; }}
        .subtitle {{ font-size: 12px; color: #4b5563; margin-top: 3px; }}
        .info-box {{ display: flex; justify-content: space-between; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 11px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 5px; }}
        th {{ background: #1e3a8a; color: #fff; font-weight: 600; font-size: 10px; text-transform: uppercase; padding: 6px 8px; text-align: left; }}
        td {{ padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }}
        tr:nth-child(even) {{ background: #fafafa; }}
        .footer {{ margin-top: 25px; border-top: 1px solid #ccc; padding-top: 10px; display: flex; justify-content: space-between; font-size: 11px; }}
        .sign-box {{ width: 220px; border-top: 1px solid #000; text-align: center; padding-top: 4px; margin-top: 25px; }}
        .no-print {{ text-align: right; margin-bottom: 12px; }}
        .btn-print {{ background: #1e3a8a; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px; }}
        @media print {{
            body {{ padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="no-print">
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir Folha A4 para Balcão</button>
    </div>

    <div class="header">
        <div>
            <h1 class="title">📋 LISTA DE COTAÇÃO & COMPRA DE BALCÃO</h1>
            <div class="subtitle">{titulo_obra} — Gestão de Suprimentos</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #666;">
            Emissão: <strong>{date.today().strftime('%d/%m/%Y')}</strong><br/>
            Fornecedor-Alvo: <strong>{fornecedor_alvo}</strong>
        </div>
    </div>

    <div class="info-box">
        <div><strong>Comprador / Gestor:</strong> Sandro (11) 98118-2026</div>
        <div><strong>Condição Prevista:</strong> Cartão Corporativo (até 6x) / Pix à Vista</div>
        <div><strong>Entrega Canteiro:</strong> ICENV Nova Vida</div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 32px; text-align: center;">Conf</th>
                <th style="width: 30px; text-align: center;">Item</th>
                <th>Descrição Técnica do Material & Marca Homologada</th>
                <th style="width: 85px; text-align: center;">Qtd Compra</th>
                <th style="width: 80px; text-align: right;">Preço Ref.</th>
                <th style="width: 80px; text-align: center;">Preço Real</th>
                <th style="width: 80px; text-align: center;">Subtotal</th>
                <th style="width: 90px; text-align: center;">Visto / NF</th>
            </tr>
        </thead>
        <tbody>
            {linhas_html}
        </tbody>
    </table>

    <div class="footer">
        <div>
            <strong>Instruções de Recebimento no Canteiro:</strong><br/>
            • Conferir caixas de pisos/revestimentos e sacarias de cimento/argamassa no ato do descarregamento.<br/>
            • Enviar foto da Nota Fiscal no grupo de WhatsApp da obra para registro contábil e garantia.
        </div>
        <div>
            <div class="sign-box">Assinatura do Vendedor / Carimbo Loja</div>
        </div>
    </div>
</body>
</html>
"""

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    if abrir_navegador:
        webbrowser.open(f"file://{os.path.abspath(output_path)}")

    return output_path
