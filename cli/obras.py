import sys
import argparse

from cli.commands import (
    cmd_status_financeiro,
    cmd_print_lista,
    cmd_dimensionar,
    cmd_processar_mensagem,
    cmd_listar_plantas,
)


def main():
    parser = argparse.ArgumentParser(
        prog="obras",
        description="🏗️ CLI do Sistema de Obras — Terminal Agêntico para Gestores e Arquitetos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso rápido:
  python -m cli.obras status
  python -m cli.obras print-lista --fornecedor "JER"
  python -m cli.obras print-lista --fornecedor "Telhanorte"
  python -m cli.obras dimensionar --piso 3.3 --parede 23.0 --cenario premium
  python -m cli.obras mensagem --texto "Wagner pediu 10 joelhos 25mm e 5 sacos de cimento"
  python -m cli.obras plantas
        """,
    )

    subparsers = parser.add_subparsers(dest="comando", help="Comandos operacionais disponíveis")

    # 1. Status Financeiro
    p_status = subparsers.add_parser("status", help="Exibe o balanço financeiro, orçado x realizado e parcelas")
    p_status.add_argument("--url", help="URL do backend da API", default=None)

    # 2. Imprimir Lista de Balcão
    p_print = subparsers.add_parser("print-lista", help="Gera folha de compras A4 pautada pronta para impressão no navegador")
    p_print.add_argument("--fornecedor", "-f", help="Filtrar por nome do fornecedor (ex: JER, Telhanorte, Sodimac)", default=None)
    p_print.add_argument("--no-open", action="store_true", help="Não abrir o navegador automaticamente após gerar o arquivo")
    p_print.add_argument("--url", help="URL do backend da API", default=None)

    # 3. Dimensionamento Paramétrico
    p_dim = subparsers.add_parser("dimensionar", help="Calcula a Lista Mestra de materiais com perdas de corte e caixas fechadas")
    p_dim.add_argument("--tipo", "-t", default="banheiro", help="Tipo de ambiente (ex: banheiro, cozinha, fachada)")
    p_dim.add_argument("--piso", "-p", type=float, default=3.3, help="Área de piso em m²")
    p_dim.add_argument("--parede", "-a", type=float, default=23.0, help="Área de paredes revestidas em m²")
    p_dim.add_argument("--cenario", "-c", choices=["standard", "premium"], default="standard", help="Padrão de acabamento")
    p_dim.add_argument("--url", help="URL do backend da API", default=None)

    # 4. Processar Mensagem de Canteiro (WhatsApp / N8N)
    p_msg = subparsers.add_parser("mensagem", help="Processa requisições de áudio/texto de mestres de obra via WhatsApp")
    p_msg.add_argument("texto", nargs="?", help="Texto da mensagem enviada no WhatsApp")
    p_msg.add_argument("--texto", "-t", dest="texto_opt", help="Texto alternativo da mensagem")
    p_msg.add_argument("--remetente", "-r", default="Wagner (Mestre de Obras)", help="Nome do solicitante")
    p_msg.add_argument("--url", help="URL do backend da API", default=None)

    # 5. Controle de Plantas e Versionamento
    p_plantas = subparsers.add_parser("plantas", help="Lista as pranchas e revisões ativas de arquitetura e engenharia")
    p_plantas.add_argument("--url", help="URL do backend da API", default=None)

    args = parser.parse_args()

    if not args.comando or args.comando == "status":
        cmd_status_financeiro(base_url=getattr(args, "url", None))
    elif args.comando == "print-lista":
        cmd_print_lista(fornecedor=args.fornecedor, abrir=not args.no_open, base_url=args.url)
    elif args.comando == "dimensionar":
        cmd_dimensionar(tipo=args.tipo, piso=args.piso, parede=args.parede, cenario=args.cenario, base_url=args.url)
    elif args.comando == "mensagem":
        msg_texto = args.texto or args.texto_opt or "Wagner: preciso de 10 joelhos 25mm e 5 sacos de cimento"
        cmd_processar_mensagem(texto=msg_texto, remetente=args.remetente, base_url=args.url)
    elif args.comando == "plantas":
        cmd_listar_plantas(base_url=args.url)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
