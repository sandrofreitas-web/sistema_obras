import os
import json
import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.entities import (
    Usuario,
    Fornecedor,
    Categoria,
    Material,
    PrecoCaptura,
    Projeto,
    PlantaProjeto,
    VersaoPlanta,
    Ambiente,
    Cenario,
    EtapaObra,
    ServicoMaoObra,
    Compra,
    ParcelaPagamento,
    ItemCompra,
)

logger = logging.getLogger(__name__)


def get_data_dir():
    if os.path.exists("/data/seed_fornecedores.json"):
        return "/data"
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data"))


def run_seeds(db: Session):
    data_dir = get_data_dir()
    logger.info(f"Iniciando rotina de seeds a partir de: {data_dir}")

    # 1. Seed de Usuários Padrão (RBAC)
    usuarios_padrao = [
        {"nome": "Sandro Gestor", "email": "sandro@sistemaobras.local", "papel": "gestor", "cargo": "Engenheiro / Gestor Geral"},
        {"nome": "Arquiteto Especificador", "email": "arquiteto@sistemaobras.local", "papel": "arquiteto", "cargo": "Arquiteto Titular"},
        {"nome": "Wagner (Mestre de Obras)", "telefone": "11999999999", "papel": "mestre_obras", "cargo": "Empreiteiro Geral"},
        {"nome": "Comissão de Obras ICENV", "email": "conselho@icenv.local", "papel": "cliente", "cargo": "Diretoria Institucional"},
    ]
    for u_data in usuarios_padrao:
        existente = db.query(Usuario).filter_by(nome=u_data["nome"]).first()
        if not existente:
            novo_u = Usuario(
                nome=u_data["nome"],
                email=u_data.get("email"),
                telefone=u_data.get("telefone"),
                papel=u_data["papel"],
                cargo=u_data["cargo"],
                permissao="admin" if u_data["papel"] == "gestor" else "operador",
            )
            db.add(novo_u)
    db.commit()
    logger.info("Seed de Usuários e Perfis RBAC aplicado.")

    # 2. Seed de Fornecedores Homologados
    fornecedores_path = os.path.join(data_dir, "seed_fornecedores.json")
    if os.path.exists(fornecedores_path):
        with open(fornecedores_path, "r", encoding="utf-8-sig") as f:
            fornecedores_data = json.load(f)
            for item in fornecedores_data:
                existente = (
                    db.query(Fornecedor)
                    .filter((Fornecedor.id == item.get("id")) | (Fornecedor.nome.ilike(f"%{item['nome'][:10]}%")))
                    .first()
                )
                if not existente:
                    novo = Fornecedor(
                        nome=item["nome"],
                        tipo_parceiro=item.get("tipo_parceiro"),
                        especialidade=item.get("especialidade"),
                        historico_compras_2024=item.get("historico_compras_2024", 0.0),
                        status=item.get("status", "Homologado"),
                    )
                    db.add(novo)
                else:
                    if item.get("historico_compras_2024") is not None:
                        existente.historico_compras_2024 = item["historico_compras_2024"]
            db.commit()
            logger.info("Seed de Fornecedores aplicado com sucesso.")

    # 3. Seed de Taxonomia de Materiais
    taxonomia_path = os.path.join(data_dir, "seed_taxonomia.json")
    if os.path.exists(taxonomia_path):
        with open(taxonomia_path, "r", encoding="utf-8-sig") as f:
            taxonomia_data = json.load(f)
            for classe_item in taxonomia_data:
                classe_nome = classe_item["classe"]
                for subitem in classe_item["itens"]:
                    tipo_nome = subitem["tipo"]
                    existente = (
                        db.query(Categoria)
                        .filter_by(classe=classe_nome, tipo=tipo_nome)
                        .first()
                    )
                    if not existente:
                        nova_cat = Categoria(
                            classe=classe_nome,
                            tipo=tipo_nome,
                            unidade_padrao=subitem.get("unidade_padrao", "un"),
                            fator_embalagem_padrao=subitem.get("fator_embalagem", 1.0),
                        )
                        db.add(nova_cat)
            db.commit()
            logger.info("Seed de Taxonomia aplicado com sucesso.")

    # 4. Hidratação Completa e Canônica de Projetos (Pastoral, Masculino e 2024 Benchmarking)
    from app.db.seed_projetos_completo import seed_projetos_e_dados_completos
    seed_projetos_e_dados_completos(db)


