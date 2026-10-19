from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any, Optional
from datetime import date, datetime

from app.core.database import get_db
from app.models.entities import (
    Projeto,
    PlantaProjeto,
    VersaoPlanta,
    Ambiente,
    RegistroAuditoria,
)
from app.api.schemas import (
    PlantaIn,
    PlantaOut,
    VersaoPlantaIn,
    VersaoPlantaOut,
)

router = APIRouter()


@router.get("/projetos/{projeto_id}/plantas")
def list_plantas_projeto(projeto_id: str, db: Session = Depends(get_db)):
    """Lista todas as pranchas e arquivos de projeto vinculados a uma obra."""
    plantas = db.query(PlantaProjeto).filter_by(projeto_id=projeto_id).all()
    resultado = []
    for p in plantas:
        versoes = db.query(VersaoPlanta).filter_by(planta_id=p.id).order_by(desc(VersaoPlanta.criado_em)).all()
        versao_vigente = next((v for v in versoes if v.status == "Vigente"), versoes[0] if versoes else None)

        resultado.append({
            "id": p.id,
            "projeto_id": p.projeto_id,
            "codigo_prancha": p.codigo_prancha,
            "titulo": p.titulo,
            "disciplina": p.disciplina,
            "arquivo_url": p.arquivo_url,
            "revisao_vigente": versao_vigente.revisao if versao_vigente else "R00",
            "data_ultima_emissao": str(versao_vigente.data_emissao) if versao_vigente else str(p.criado_em.date()),
            "total_versoes": len(versoes),
            "versoes": [
                {
                    "id": v.id,
                    "revisao": v.revisao,
                    "status": v.status,
                    "data_emissao": str(v.data_emissao),
                    "autor_arquiteto": v.autor_arquiteto,
                    "aprovador_gestor": v.aprovador_gestor,
                    "notas_alteracao": v.notas_alteracao,
                    "metadados": v.metadados_extracao,
                }
                for v in versoes
            ]
        })
    return resultado


@router.post("/projetos/{projeto_id}/plantas")
def criar_planta_projeto(projeto_id: str, payload: PlantaIn, db: Session = Depends(get_db)):
    """Cadastra uma nova prancha ou disciplina de projeto e cria sua revisão inicial (R00)."""
    projeto = db.query(Projeto).filter_by(id=projeto_id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    existente = db.query(PlantaProjeto).filter_by(projeto_id=projeto_id, codigo_prancha=payload.codigo_prancha).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Prancha {payload.codigo_prancha} já cadastrada neste projeto")

    nova_planta = PlantaProjeto(
        projeto_id=projeto_id,
        codigo_prancha=payload.codigo_prancha,
        titulo=payload.titulo,
        disciplina=payload.disciplina,
        arquivo_url=payload.arquivo_url,
    )
    db.add(nova_planta)
    db.flush()

    versao_inicial = VersaoPlanta(
        planta_id=nova_planta.id,
        revisao=payload.revisao_inicial or "R00",
        data_emissao=date.today(),
        status="Vigente",
        arquivo_pdf_url=payload.arquivo_url,
        notas_alteracao=payload.notas_alteracao or "Emissão inicial da prancha",
    )
    db.add(versao_inicial)

    # Registrar na auditoria
    db.add(
        RegistroAuditoria(
            usuario_nome="Arquiteto",
            papel="arquiteto",
            acao="cadastro_prancha",
            entidade="planta_projeto",
            entidade_id=nova_planta.id,
            detalhes={"codigo_prancha": payload.codigo_prancha, "titulo": payload.titulo},
        )
    )

    db.commit()
    db.refresh(nova_planta)
    return {
        "status": "sucesso",
        "planta_id": nova_planta.id,
        "codigo_prancha": nova_planta.codigo_prancha,
        "revisao_ativa": versao_inicial.revisao,
    }


@router.post("/plantas/{planta_id}/versoes")
def adicionar_versao_planta(planta_id: str, payload: VersaoPlantaIn, db: Session = Depends(get_db)):
    """Adiciona uma nova revisão (ex: R01, R02) a uma prancha existente."""
    planta = db.query(PlantaProjeto).filter_by(id=planta_id).first()
    if not planta:
        raise HTTPException(status_code=404, detail="Prancha não encontrada")

    # Marca versões anteriores como Superadas se a nova for marcada como Vigente
    versoes_anteriores = db.query(VersaoPlanta).filter_by(planta_id=planta_id).all()
    for v in versoes_anteriores:
        v.status = "Superada"

    nova_versao = VersaoPlanta(
        planta_id=planta_id,
        revisao=payload.revisao,
        data_emissao=date.today(),
        autor_arquiteto=payload.autor_arquiteto or "Arquiteto",
        aprovador_gestor=payload.aprovador_gestor,
        status="Vigente",
        arquivo_pdf_url=payload.arquivo_pdf_url or planta.arquivo_url,
        notas_alteracao=payload.notas_alteracao,
        metadados_extracao=payload.metadados_extracao,
    )
    db.add(nova_versao)

    # Registrar auditoria
    db.add(
        RegistroAuditoria(
            usuario_nome=payload.autor_arquiteto or "Arquiteto",
            papel="arquiteto",
            acao="nova_revisao_planta",
            entidade="versao_planta",
            entidade_id=planta_id,
            detalhes={"revisao": payload.revisao, "notas": payload.notas_alteracao},
        )
    )

    db.commit()
    return {
        "status": "sucesso",
        "mensagem": f"Revisão {payload.revisao} da prancha {planta.codigo_prancha} registrada com sucesso!",
        "versao_id": nova_versao.id,
        "revisao": nova_versao.revisao,
    }


@router.get("/plantas/comparar-versoes")
def comparar_versoes_planta(versao_a_id: str, versao_b_id: str, db: Session = Depends(get_db)):
    """Retorna um comparativo analítico entre duas revisões de uma mesma prancha."""
    va = db.query(VersaoPlanta).filter_by(id=versao_a_id).first()
    vb = db.query(VersaoPlanta).filter_by(id=versao_b_id).first()
    if not va or not vb:
        raise HTTPException(status_code=404, detail="Uma ou ambas as versões não foram localizadas")

    return {
        "versao_anterior": {
            "id": va.id,
            "revisao": va.revisao,
            "data": str(va.data_emissao),
            "notas": va.notas_alteracao,
            "metadados": va.metadados_extracao or {},
        },
        "versao_nova": {
            "id": vb.id,
            "revisao": vb.revisao,
            "data": str(vb.data_emissao),
            "notas": vb.notas_alteracao,
            "metadados": vb.metadados_extracao or {},
        },
        "diff_notas": f"De {va.revisao} para {vb.revisao}: {vb.notas_alteracao or 'Sem observações'}",
    }
