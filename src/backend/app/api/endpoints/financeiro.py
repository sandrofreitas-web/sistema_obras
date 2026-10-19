from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta

from app.core.database import get_db
from app.models.entities import (
    Projeto,
    Fornecedor,
    Compra,
    ParcelaPagamento,
    ItemCompra,
    ServicoMaoObra,
    RegistroAuditoria,
)
from app.api.schemas import (
    CompraIn,
    CompraOut,
    ParcelaOut,
)

router = APIRouter()


@router.get("/compras")
def list_compras(projeto_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lista todas as compras registradas com parcelas e fornecedores vinculados."""
    query = db.query(Compra)
    if projeto_id:
        query = query.filter_by(projeto_id=projeto_id)
    compras = query.order_by(desc(Compra.data_compra)).all()

    resultado = []
    for c in compras:
        forn = db.query(Fornecedor).filter_by(id=c.fornecedor_id).first()
        parcelas = db.query(ParcelaPagamento).filter_by(compra_id=c.id).order_by(ParcelaPagamento.numero_parcela).all()

        resultado.append({
            "id": c.id,
            "projeto_id": c.projeto_id,
            "fornecedor_id": c.fornecedor_id,
            "fornecedor_nome": forn.nome if forn else "Fornecedor não identificado",
            "numero_nf": c.numero_nf,
            "data_compra": str(c.data_compra),
            "valor_total": float(c.valor_total),
            "valor_frete": float(c.valor_frete or 0),
            "valor_desconto_geral": float(c.valor_desconto_geral or 0),
            "forma_pagamento": c.forma_pagamento,
            "quantidade_parcelas": c.quantidade_parcelas,
            "foto_nf_url": c.foto_nf_url,
            "observacoes": c.observacoes,
            "parcelas": [
                {
                    "id": p.id,
                    "numero_parcela": p.numero_parcela,
                    "data_vencimento": str(p.data_vencimento),
                    "valor_parcela": float(p.valor_parcela),
                    "data_pagamento_efetivo": str(p.data_pagamento_efetivo) if p.data_pagamento_efetivo else None,
                    "status": p.status,
                }
                for p in parcelas
            ]
        })
    return resultado


@router.post("/compras")
def registrar_compra(payload: CompraIn, db: Session = Depends(get_db)):
    """Registra uma nova compra efetiva (Nota Fiscal, Cupom ou Ordem de Venda)."""
    forn = db.query(Fornecedor).filter_by(id=payload.fornecedor_id).first()
    if not forn:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    nova_compra = Compra(
        projeto_id=payload.projeto_id,
        fornecedor_id=payload.fornecedor_id,
        numero_nf=payload.numero_nf,
        data_compra=payload.data_compra,
        valor_total=payload.valor_total,
        valor_frete=payload.valor_frete,
        valor_desconto_geral=payload.valor_desconto_geral,
        forma_pagamento=payload.forma_pagamento,
        quantidade_parcelas=payload.quantidade_parcelas,
        foto_nf_url=payload.foto_nf_url,
        observacoes=payload.observacoes,
    )
    db.add(nova_compra)
    db.flush()

    # Gerar parcelas automaticamente
    num_parcelas = max(1, payload.quantidade_parcelas)
    valor_parcela = round(payload.valor_total / num_parcelas, 2)
    for i in range(1, num_parcelas + 1):
        vencimento = payload.data_compra + timedelta(days=30 * i)
        db.add(
            ParcelaPagamento(
                compra_id=nova_compra.id,
                numero_parcela=i,
                data_vencimento=vencimento,
                valor_parcela=valor_parcela if i < num_parcelas else round(payload.valor_total - (valor_parcela * (num_parcelas - 1)), 2),
                status="Pendente",
            )
        )

    # Inserir itens se houver
    if payload.itens:
        for it in payload.itens:
            db.add(
                ItemCompra(
                    compra_id=nova_compra.id,
                    material_id=it.material_id,
                    qtd_comprada=it.qtd_comprada,
                    preco_unitario_real=it.preco_unitario_real,
                    item_projeto_id=it.item_projeto_id,
                )
            )

    # Registrar auditoria
    db.add(
        RegistroAuditoria(
            usuario_nome="Gestor",
            papel="gestor",
            acao="registro_compra_nf",
            entidade="compra",
            entidade_id=nova_compra.id,
            detalhes={"nf": payload.numero_nf, "valor": payload.valor_total, "fornecedor": forn.nome},
        )
    )

    db.commit()
    return {
        "status": "sucesso",
        "mensagem": f"Compra de R$ {payload.valor_total:.2f} registrada com sucesso!",
        "compra_id": nova_compra.id,
    }


@router.get("/compras/parcelas")
def list_fluxo_parcelas(db: Session = Depends(get_db)):
    """Retorna a visão de desembolso futuro consolidada de parcelas a vencer."""
    parcelas = (
        db.query(ParcelaPagamento, Compra, Fornecedor)
        .join(Compra, ParcelaPagamento.compra_id == Compra.id)
        .join(Fornecedor, Compra.fornecedor_id == Fornecedor.id)
        .order_by(ParcelaPagamento.data_vencimento)
        .all()
    )

    resultado = []
    total_pendente = 0.0
    for p, c, f in parcelas:
        if p.status == "Pendente":
            total_pendente += float(p.valor_parcela)
        resultado.append({
            "parcela_id": p.id,
            "numero_parcela": p.numero_parcela,
            "total_parcelas": c.quantidade_parcelas,
            "fornecedor": f.nome,
            "numero_nf": c.numero_nf,
            "data_vencimento": str(p.data_vencimento),
            "valor_parcela": float(p.valor_parcela),
            "status": p.status,
            "data_pagamento_efetivo": str(p.data_pagamento_efetivo) if p.data_pagamento_efetivo else None,
        })

    return {
        "total_comprometido_futuro": total_pendente,
        "parcelas": resultado,
    }


@router.get("/relatorios/executivo-financeiro")
def get_relatorio_executivo_financeiro(projeto_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Retorna o balanço executivo consolidado para conselhos e clientes:
    Orçado vs Realizado, Curva S, Distribuição Mão de Obra vs Materiais e Alertas de Teto.
    """
    projeto = db.query(Projeto).filter_by(id=projeto_id).first() if projeto_id else db.query(Projeto).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    # 1. Total faturado em materiais
    compras = db.query(Compra).filter_by(projeto_id=projeto.id).all()
    total_materiais_realizado = sum(float(c.valor_total) for c in compras)

    # 2. Total em mão de obra
    servicos_mo = db.query(ServicoMaoObra).filter_by(projeto_id=projeto.id).all()
    total_mo_contratado = sum(float(m.valor_contratado) for m in servicos_mo)
    total_mo_pago = sum(float(m.valor_pago_acumulado) for m in servicos_mo)

    # 3. Consolidado
    total_comprometido_geral = total_materiais_realizado + total_mo_contratado
    saldo_restante_orcamento = float(projeto.orcamento_teto or 0) - total_comprometido_geral
    percentual_orcamento_consumido = (total_comprometido_geral / float(projeto.orcamento_teto)) * 100 if float(projeto.orcamento_teto or 0) > 0 else 0

    return {
        "projeto": {
            "id": projeto.id,
            "nome": projeto.nome,
            "status": projeto.status,
            "orcamento_teto": float(projeto.orcamento_teto or 0),
            "reserva_tecnica": float(projeto.reserva_tecnica or 0),
        },
        "metricas_consolidadas": {
            "materiais_orcado": float(projeto.orcamento_materiais or 0),
            "materiais_realizado": total_materiais_realizado,
            "mao_obra_orcado": float(projeto.orcamento_mao_obra or 0),
            "mao_obra_contratado": total_mo_contratado,
            "mao_obra_pago": total_mo_pago,
            "total_comprometido": total_comprometido_geral,
            "saldo_orcamento": saldo_restante_orcamento,
            "percentual_consumido": round(percentual_orcamento_consumido, 1),
            "status_orcamento": "DENTRO_DO_TETO" if saldo_restante_orcamento >= 0 else "ALERTA_ESTOURO",
        },
        "distribuicao_percentual": {
            "mao_de_obra_pct": round((total_mo_contratado / total_comprometido_geral) * 100, 1) if total_comprometido_geral > 0 else 0,
            "materiais_pct": round((total_materiais_realizado / total_comprometido_geral) * 100, 1) if total_comprometido_geral > 0 else 0,
        },
        "total_compras_registradas": len(compras),
    }
