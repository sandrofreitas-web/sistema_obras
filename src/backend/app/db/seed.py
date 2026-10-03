import os
import json
import logging
from datetime import date
from sqlalchemy.orm import Session
from app.models.entities import (
    Fornecedor,
    Categoria,
    Projeto,
    Ambiente,
    Cenario,
    EtapaObra,
    ServicoMaoObra,
)

logger = logging.getLogger(__name__)


def get_data_dir():
    # Quando em container com volume montado
    if os.path.exists("/data/seed_fornecedores.json"):
        return "/data"
    # Fallback para desenvolvimento local
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data"))


def run_seeds(db: Session):
    data_dir = get_data_dir()
    logger.info(f"Iniciando rotina de seeds a partir de: {data_dir}")

    # 1. Seed de Fornecedores Homologados
    fornecedores_path = os.path.join(data_dir, "seed_fornecedores.json")
    if os.path.exists(fornecedores_path):
        with open(fornecedores_path, "r", encoding="utf-8-sig") as f:
            fornecedores_data = json.load(f)
            for item in fornecedores_data:
                existente = db.query(Fornecedor).filter_by(nome=item["nome"]).first()
                if not existente:
                    novo = Fornecedor(
                        id=item.get("id"),
                        nome=item["nome"],
                        tipo_parceiro=item.get("tipo_parceiro"),
                        especialidade=item.get("especialidade"),
                        historico_compras_2024=item.get("historico_compras_2024", 0.0),
                        status=item.get("status", "Homologado"),
                    )
                    db.add(novo)
            db.commit()
            logger.info("Seed de Fornecedores aplicado com sucesso.")

    # 2. Seed de Taxonomia de Materiais
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

    # 3. Seed do Projeto Piloto: Obra ICENV 2026
    projeto_nome = "Reforma ICENV 2026 - Banheiro Pastoral e Bloco Masculino"
    projeto_existente = db.query(Projeto).filter_by(nome=projeto_nome).first()

    if not projeto_existente:
        projeto = Projeto(
            nome=projeto_nome,
            status="Planejamento",
            data_inicio=date(2026, 10, 13),
            data_previsao_fim=date(2026, 11, 15),
            orcamento_teto=53800.00,
            orcamento_mao_obra=32500.00,
            orcamento_materiais=21300.00,
            reserva_tecnica=3000.00,
            descricao="Projeto piloto oficial: Reforma do Banheiro da Casa Pastoral (3,3m² piso / 23m² paredes) e Bloco Masculino da Igreja (~10m² piso / 37m² paredes).",
        )
        db.add(projeto)
        db.flush()

        # Ambientes
        amb_pastoral = Ambiente(
            projeto_id=projeto.id,
            nome="Banheiro Casa Pastoral",
            area_piso=3.30,
            area_parede=23.00,
            perimetro=7.40,
        )
        amb_masculino = Ambiente(
            projeto_id=projeto.id,
            nome="Banheiro Masculino Igreja",
            area_piso=10.00,
            area_parede=37.00,
            perimetro=13.00,
        )
        amb_comum = Ambiente(
            projeto_id=projeto.id,
            nome="Área Comum & Caçambas",
            area_piso=0.00,
            area_parede=0.00,
            perimetro=0.00,
        )
        db.add_all([amb_pastoral, amb_masculino, amb_comum])

        # Cenários A/B
        cen_padrao = Cenario(
            projeto_id=projeto.id,
            nome="Cenário Standard (Melhor Custo-Benefício)",
            ativo=True,
        )
        cen_premium = Cenario(
            projeto_id=projeto.id,
            nome="Cenário Premium (Durabilidade Institucional Deca/Portobello)",
            ativo=False,
        )
        db.add_all([cen_padrao, cen_premium])

        # Mão de obra contratada
        mo_wagner = ServicoMaoObra(
            projeto_id=projeto.id,
            prestador_nome="Profissional Wagner",
            escopo_etapa="Demolições, hidráulica, elétrica, contrapiso, impermeabilização, revestimentos e louças",
            valor_contratado=32500.00,
            valor_pago_acumulado=0.00,
            status="A Iniciar",
        )
        db.add(mo_wagner)

        # 5 Semanas do Cronograma Oficial
        etapas = [
            EtapaObra(
                projeto_id=projeto.id,
                nome_etapa="Semana 1: Mobilização, demolições e descarte caçambas",
                semana_cronograma=1,
                data_inicio_prevista=date(2026, 10, 13),
                data_fim_prevista=date(2026, 10, 18),
                percentual_concluido=0,
                status="Não Iniciada",
            ),
            EtapaObra(
                projeto_id=projeto.id,
                nome_etapa="Semana 2: Novas instalações hidráulicas e elétricas; testes estanqueidade",
                semana_cronograma=2,
                data_inicio_prevista=date(2026, 10, 19),
                data_fim_prevista=date(2026, 10, 25),
                percentual_concluido=0,
                status="Não Iniciada",
            ),
            EtapaObra(
                projeto_id=projeto.id,
                nome_etapa="Semana 3: Regularização contrapiso, impermeabilização 72h e início pisos",
                semana_cronograma=3,
                data_inicio_prevista=date(2026, 10, 26),
                data_fim_prevista=date(2026, 11, 1),
                percentual_concluido=0,
                status="Não Iniciada",
            ),
            EtapaObra(
                projeto_id=projeto.id,
                nome_etapa="Semana 4: Revestimentos de paredes, forro de gesso e divisórias Hiper Pedras",
                semana_cronograma=4,
                data_inicio_prevista=date(2026, 11, 2),
                data_fim_prevista=date(2026, 11, 8),
                percentual_concluido=0,
                status="Não Iniciada",
            ),
            EtapaObra(
                projeto_id=projeto.id,
                nome_etapa="Semana 5: Montagem louças/metais, pintura, vistoria final e entrega",
                semana_cronograma=5,
                data_inicio_prevista=date(2026, 11, 9),
                data_fim_prevista=date(2026, 11, 15),
                percentual_concluido=0,
                status="Não Iniciada",
            ),
        ]
        db.add_all(etapas)
        db.commit()
        logger.info("Seed do Projeto Piloto ICENV 2026 cadastrado com sucesso.")
