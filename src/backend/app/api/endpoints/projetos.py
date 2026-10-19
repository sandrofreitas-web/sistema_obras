from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.entities import (
    Projeto,
    Ambiente,
    Cenario,
    EtapaObra,
    ServicoMaoObra,
    ItemProjeto,
    Material,
    Categoria,
    PlantaProjeto,
    VersaoPlanta,
    Compra,
    ItemCompra,
    Fornecedor,
)

router = APIRouter()


class ProjetoCreateIn(BaseModel):
    id: Optional[str] = None
    nome: str
    status: Optional[str] = "Planejamento"
    data_inicio: Optional[date] = None
    data_previsao_fim: Optional[date] = None
    orcamento_teto: Optional[float] = 0.0
    orcamento_mao_obra: Optional[float] = 0.0
    orcamento_materiais: Optional[float] = 0.0
    reserva_tecnica: Optional[float] = 0.0
    descricao: Optional[str] = None


class ProjetoUpdateIn(BaseModel):
    nome: Optional[str] = None
    status: Optional[str] = None
    data_inicio: Optional[date] = None
    data_previsao_fim: Optional[date] = None
    orcamento_teto: Optional[float] = None
    orcamento_mao_obra: Optional[float] = None
    orcamento_materiais: Optional[float] = None
    reserva_tecnica: Optional[float] = None
    descricao: Optional[str] = None


class ItemProjetoCreateIn(BaseModel):
    ambiente_id: str
    material_id: str
    cenario_id: Optional[str] = None
    qtd_necessaria_liquida: float = Field(..., gt=0)
    margem_perda_pct: float = Field(default=10.0, ge=0)
    qtd_embalagem_fechada: Optional[int] = 1
    preco_unitario_estimado: float = Field(default=0.0, ge=0)


class ItemProjetoUpdateIn(BaseModel):
    qtd_necessaria_liquida: Optional[float] = None
    margem_perda_pct: Optional[float] = None
    qtd_embalagem_fechada: Optional[int] = None
    preco_unitario_estimado: Optional[float] = None
    ambiente_id: Optional[str] = None


@router.get("/projetos")
def list_projetos(db: Session = Depends(get_db)):
    """Lista todos os projetos cadastrados com métricas consolidadas (WBS e Compras)."""
    projetos = db.query(Projeto).order_by(Projeto.id).all()
    resultado = []

    for p in projetos:
        # Ambientes count
        total_amb = db.query(Ambiente).filter_by(projeto_id=p.id).count()

        # Cenário ativo
        cenario_ativo = db.query(Cenario).filter_by(projeto_id=p.id, ativo=True).first()
        total_itens = 0
        if cenario_ativo:
            total_itens = db.query(ItemProjeto).filter_by(cenario_id=cenario_ativo.id).count()

        # Compras vinculadas
        compras_totais = (
            db.query(func.coalesce(func.sum(Compra.valor_total), 0))
            .filter_by(projeto_id=p.id)
            .scalar()
        )
        total_compras_count = db.query(Compra).filter_by(projeto_id=p.id).count()

        # Média de conclusão das etapas
        etapas = db.query(EtapaObra).filter_by(projeto_id=p.id).all()
        avg_conclusao = 0
        if etapas:
            avg_conclusao = sum(e.percentual_concluido or 0 for e in etapas) / len(etapas)

        resultado.append({
            "id": p.id,
            "nome": p.nome,
            "status": p.status,
            "data_inicio": str(p.data_inicio) if p.data_inicio else None,
            "data_previsao_fim": str(p.data_previsao_fim) if p.data_previsao_fim else None,
            "orcamento_teto": float(p.orcamento_teto or 0),
            "orcamento_mao_obra": float(p.orcamento_mao_obra or 0),
            "orcamento_materiais": float(p.orcamento_materiais or 0),
            "reserva_tecnica": float(p.reserva_tecnica or 0),
            "descricao": p.descricao,
            "total_ambientes": total_amb,
            "total_itens_wbs": total_itens,
            "total_compras_count": total_compras_count,
            "total_compras_valor": float(compras_totais or 0),
            "percentual_concluido_medio": round(avg_conclusao, 1),
        })

    return resultado


@router.get("/projetos/{projeto_id}")
def get_projeto_detalhe(projeto_id: str, db: Session = Depends(get_db)):
    """Retorna a árvore WBS completa de um projeto: Ambientes, Cenários com Itens, Etapas, Mão de Obra e Compras."""
    p = db.query(Projeto).filter_by(id=projeto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    ambientes = db.query(Ambiente).filter_by(projeto_id=p.id).all()
    cenarios = db.query(Cenario).filter_by(projeto_id=p.id).all()
    etapas = db.query(EtapaObra).filter_by(projeto_id=p.id).order_by(EtapaObra.semana_cronograma).all()
    mao_obra = db.query(ServicoMaoObra).filter_by(projeto_id=p.id).all()
    plantas = db.query(PlantaProjeto).filter_by(projeto_id=p.id).all()
    compras = db.query(Compra).filter_by(projeto_id=p.id).order_by(desc(Compra.data_compra)).all()

    # Montar cenários com seus itens detalhados
    cenarios_out = []
    for c in cenarios:
        itens_db = db.query(ItemProjeto).filter_by(cenario_id=c.id).all()
        itens_list = []
        for it in itens_db:
            mat = db.query(Material).filter_by(id=it.material_id).first()
            cat = db.query(Categoria).filter_by(id=mat.categoria_id).first() if mat and mat.categoria_id else None
            # Verificar se já existe compra deste item
            comprado = db.query(ItemCompra).filter_by(item_projeto_id=it.id).first() is not None

            preco_unit = float(it.preco_unitario_estimado or 0)
            qtd_bruta = float(it.qtd_calculada_bruta or 0)
            preco_total = round(preco_unit * qtd_bruta, 2)

            itens_list.append({
                "id": it.id,
                "ambiente_id": it.ambiente_id,
                "material_id": it.material_id,
                "material_nome": mat.descricao if mat else "Material desconhecido",
                "fabricante": mat.fabricante if mat else None,
                "classe": cat.classe if cat else None,
                "tipo": cat.tipo if cat else None,
                "unidade": mat.unidade_venda if mat else "un",
                "quantidade_liquida": float(it.qtd_necessaria_liquida or 0),
                "margem_perda_pct": float(it.margem_perda_pct or 0),
                "quantidade_bruta": qtd_bruta,
                "quantidade_embalagem": it.qtd_embalagem_fechada,
                "preco_unitario": preco_unit,
                "preco_total": preco_total,
                "comprado": comprado,
            })

        cenarios_out.append({
            "id": c.id,
            "nome": c.nome,
            "ativo": c.ativo,
            "total_itens": len(itens_list),
            "valor_total_estimado": round(sum(i["preco_total"] for i in itens_list), 2),
            "itens": itens_list,
        })

    # Compras resumidas
    compras_out = []
    for comp in compras:
        forn = db.query(Fornecedor).filter_by(id=comp.fornecedor_id).first()
        compras_out.append({
            "id": comp.id,
            "fornecedor_id": comp.fornecedor_id,
            "fornecedor_nome": forn.nome if forn else "Não identificado",
            "numero_nf": comp.numero_nf,
            "data_compra": str(comp.data_compra),
            "valor_total": float(comp.valor_total),
            "forma_pagamento": comp.forma_pagamento,
            "quantidade_parcelas": comp.quantidade_parcelas,
            "foto_nf_url": comp.foto_nf_url,
        })

    return {
        "id": p.id,
        "nome": p.nome,
        "status": p.status,
        "data_inicio": str(p.data_inicio) if p.data_inicio else None,
        "data_previsao_fim": str(p.data_previsao_fim) if p.data_previsao_fim else None,
        "orcamento_teto": float(p.orcamento_teto or 0),
        "orcamento_mao_obra": float(p.orcamento_mao_obra or 0),
        "orcamento_materiais": float(p.orcamento_materiais or 0),
        "reserva_tecnica": float(p.reserva_tecnica or 0),
        "descricao": p.descricao,
        "ambientes": [
            {
                "id": a.id,
                "nome": a.nome,
                "area_piso": float(a.area_piso or 0),
                "area_parede": float(a.area_parede or 0),
                "perimetro": float(a.perimetro or 0),
                "planta_id": a.planta_id,
                "versao_planta_id": a.versao_planta_id,
                "coordenadas_quadrante": a.coordenadas_quadrante,
            }
            for a in ambientes
        ],
        "cenarios": cenarios_out,
        "etapas": [
            {
                "id": e.id,
                "semana": e.semana_cronograma,
                "nome": e.nome_etapa,
                "data_inicio": str(e.data_inicio_prevista) if e.data_inicio_prevista else None,
                "data_fim": str(e.data_fim_prevista) if e.data_fim_prevista else None,
                "status": e.status,
                "percentual": e.percentual_concluido,
            }
            for e in etapas
        ],
        "mao_de_obra": [
            {
                "id": m.id,
                "prestador": m.prestador_nome,
                "escopo": m.escopo_etapa,
                "valor_contratado": float(m.valor_contratado or 0),
                "status": m.status,
            }
            for m in mao_obra
        ],
        "compras": compras_out,
        "total_plantas": len(plantas),
    }


@router.get("/projetos/{projeto_id}/itens")
def list_itens_projeto(
    projeto_id: str,
    cenario_id: Optional[str] = None,
    ambiente_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Retorna os itens de orçamento WBS de um projeto, opcionalmente filtrados por ambiente ou cenário."""
    p = db.query(Projeto).filter_by(id=projeto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    # Se não foi fornecido cenario_id, selecionar o cenário ativo
    if not cenario_id:
        c_ativo = db.query(Cenario).filter_by(projeto_id=p.id, ativo=True).first()
        if not c_ativo:
            c_ativo = db.query(Cenario).filter_by(projeto_id=p.id).first()
        cenario_id = c_ativo.id if c_ativo else None

    if not cenario_id:
        return []

    query = db.query(ItemProjeto).filter_by(cenario_id=cenario_id)
    if ambiente_id:
        query = query.filter_by(ambiente_id=ambiente_id)

    itens = query.all()
    resultado = []
    for it in itens:
        mat = db.query(Material).filter_by(id=it.material_id).first()
        cat = db.query(Categoria).filter_by(id=mat.categoria_id).first() if mat and mat.categoria_id else None
        amb = db.query(Ambiente).filter_by(id=it.ambiente_id).first()
        comprado = db.query(ItemCompra).filter_by(item_projeto_id=it.id).first() is not None

        preco_unit = float(it.preco_unitario_estimado or 0)
        qtd_bruta = float(it.qtd_calculada_bruta or 0)

        resultado.append({
            "id": it.id,
            "projeto_id": p.id,
            "cenario_id": it.cenario_id,
            "ambiente_id": it.ambiente_id,
            "ambiente_nome": amb.nome if amb else "Geral",
            "material_id": it.material_id,
            "material_nome": mat.descricao if mat else "Material desconhecido",
            "fabricante": mat.fabricante if mat else None,
            "classe": cat.classe if cat else None,
            "tipo": cat.tipo if cat else None,
            "unidade": mat.unidade_venda if mat else "un",
            "quantidade_liquida": float(it.qtd_necessaria_liquida or 0),
            "margem_perda_pct": float(it.margem_perda_pct or 0),
            "quantidade_bruta": qtd_bruta,
            "quantidade_embalagem": it.qtd_embalagem_fechada,
            "preco_unitario": preco_unit,
            "preco_total": round(preco_unit * qtd_bruta, 2),
            "comprado": comprado,
        })

    return resultado


@router.post("/projetos")
def create_projeto(payload: ProjetoCreateIn, db: Session = Depends(get_db)):
    """Cria um novo projeto de reforma / obra civil no PostgreSQL."""
    novo_id = payload.id or f"proj-{int(datetime.utcnow().timestamp())}"
    existente = db.query(Projeto).filter_by(id=novo_id).first()
    if existente:
        raise HTTPException(status_code=400, detail="Projeto com este ID já existe")

    proj = Projeto(
        id=novo_id,
        nome=payload.nome,
        status=payload.status or "Planejamento",
        data_inicio=payload.data_inicio,
        data_previsao_fim=payload.data_previsao_fim,
        orcamento_teto=payload.orcamento_teto or 0.0,
        orcamento_mao_obra=payload.orcamento_mao_obra or 0.0,
        orcamento_materiais=payload.orcamento_materiais or 0.0,
        reserva_tecnica=payload.reserva_tecnica or 0.0,
        descricao=payload.descricao,
    )
    db.add(proj)
    db.flush()

    # Criar cenário padrão
    cenario_std = Cenario(
        id=f"cenario-{novo_id}-std",
        projeto_id=proj.id,
        nome="Cenário Executivo Padrão",
        ativo=True,
    )
    db.add(cenario_std)
    db.commit()

    return {"status": "sucesso", "mensagem": "Projeto criado com sucesso", "projeto_id": proj.id}


@router.put("/projetos/{projeto_id}")
def update_projeto(projeto_id: str, payload: ProjetoUpdateIn, db: Session = Depends(get_db)):
    """Atualiza dados cadastrais, orçamentos e prazos de um projeto."""
    proj = db.query(Projeto).filter_by(id=projeto_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    if payload.nome is not None:
        proj.nome = payload.nome
    if payload.status is not None:
        proj.status = payload.status
    if payload.data_inicio is not None:
        proj.data_inicio = payload.data_inicio
    if payload.data_previsao_fim is not None:
        proj.data_previsao_fim = payload.data_previsao_fim
    if payload.orcamento_teto is not None:
        proj.orcamento_teto = payload.orcamento_teto
    if payload.orcamento_mao_obra is not None:
        proj.orcamento_mao_obra = payload.orcamento_mao_obra
    if payload.orcamento_materiais is not None:
        proj.orcamento_materiais = payload.orcamento_materiais
    if payload.reserva_tecnica is not None:
        proj.reserva_tecnica = payload.reserva_tecnica
    if payload.descricao is not None:
        proj.descricao = payload.descricao

    db.commit()
    return {"status": "sucesso", "mensagem": "Projeto atualizado com sucesso"}


@router.delete("/projetos/{projeto_id}")
def delete_projeto(projeto_id: str, db: Session = Depends(get_db)):
    """Exclui um projeto e seus relacionamentos no PostgreSQL."""
    proj = db.query(Projeto).filter_by(id=projeto_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    db.delete(proj)
    db.commit()
    return {"status": "sucesso", "mensagem": f"Projeto {projeto_id} excluído"}


@router.post("/projetos/{projeto_id}/itens")
def add_item_projeto(projeto_id: str, payload: ItemProjetoCreateIn, db: Session = Depends(get_db)):
    """Adiciona um novo material ao WBS de um projeto calculando perda técnica."""
    proj = db.query(Projeto).filter_by(id=projeto_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    cenario_id = payload.cenario_id
    if not cenario_id:
        cen = db.query(Cenario).filter_by(projeto_id=proj.id, ativo=True).first()
        if not cen:
            raise HTTPException(status_code=400, detail="Projeto não possui cenário ativo")
        cenario_id = cen.id

    # Cálculo da quantidade bruta com perda
    margem = payload.margem_perda_pct
    qtd_liquida = payload.qtd_necessaria_liquida
    qtd_bruta = round(qtd_liquida * (1.0 + (margem / 100.0)), 2)

    novo_item = ItemProjeto(
        ambiente_id=payload.ambiente_id,
        material_id=payload.material_id,
        cenario_id=cenario_id,
        qtd_necessaria_liquida=qtd_liquida,
        margem_perda_pct=margem,
        qtd_calculada_bruta=qtd_bruta,
        qtd_embalagem_fechada=payload.qtd_embalagem_fechada or 1,
        preco_unitario_estimado=payload.preco_unitario_estimado,
    )
    db.add(novo_item)
    db.commit()
    return {"status": "sucesso", "mensagem": "Item adicionado ao orçamento", "item_id": novo_item.id}


@router.put("/projetos/{projeto_id}/itens/{item_id}")
def update_item_projeto(projeto_id: str, item_id: str, payload: ItemProjetoUpdateIn, db: Session = Depends(get_db)):
    """Atualiza quantidade, perda técnica ou preço de um item do WBS."""
    item = db.query(ItemProjeto).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item de projeto não encontrado")

    if payload.qtd_necessaria_liquida is not None:
        item.qtd_necessaria_liquida = payload.qtd_necessaria_liquida
    if payload.margem_perda_pct is not None:
        item.margem_perda_pct = payload.margem_perda_pct
    if payload.qtd_embalagem_fechada is not None:
        item.qtd_embalagem_fechada = payload.qtd_embalagem_fechada
    if payload.preco_unitario_estimado is not None:
        item.preco_unitario_estimado = payload.preco_unitario_estimado
    if payload.ambiente_id is not None:
        item.ambiente_id = payload.ambiente_id

    # Recalcular quantidade bruta
    liq = float(item.qtd_necessaria_liquida or 0)
    perda = float(item.margem_perda_pct or 0)
    item.qtd_calculada_bruta = round(liq * (1.0 + (perda / 100.0)), 2)

    db.commit()
    return {"status": "sucesso", "mensagem": "Item atualizado com sucesso"}


@router.delete("/projetos/{projeto_id}/itens/{item_id}")
def delete_item_projeto(projeto_id: str, item_id: str, db: Session = Depends(get_db)):
    """Remove um item do orçamento do projeto."""
    item = db.query(ItemProjeto).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item de projeto não encontrado")

    db.delete(item)
    db.commit()
    return {"status": "sucesso", "mensagem": "Item removido com sucesso"}


@router.get("/resumo-obra-2026")
def get_resumo_obra_2026(db: Session = Depends(get_db)):
    """Compatibilidade para tela inicial: retorna o projeto pastoral oficial."""
    return get_projeto_detalhe("proj-icenv-pastoral", db)
