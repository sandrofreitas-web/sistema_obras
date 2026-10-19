import logging
from datetime import date, timedelta, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

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
    ItemProjeto,
    EtapaObra,
    ServicoMaoObra,
    Compra,
    ParcelaPagamento,
    ItemCompra,
)

logger = logging.getLogger(__name__)


def seed_projetos_e_dados_completos(db: Session):
    """
    Hidratação e migração completa para PostgreSQL 16 (obras_db).
    Garante:
    1. Os 3 projetos canônicos:
       - proj-icenv-pastoral (1ª Fase: Banheiro Casa Pastoral — Obra ICENV 2026)
       - proj-icenv-masculino (2ª Fase: Banheiro Masculino Igreja — Obra ICENV 2026)
       - proj-icenv-2024 (Benchmarking Reforma ICENV 2024)
    2. Ambientes, cenários e itens de projeto (WBS orçamentário completo).
    3. As 8 notas fiscais / ordens de compra reais totalizando R$ 19.932,32 vinculadas ao projeto pastoral.
    4. Mão de obra contratada (Wagner) e cronograma oficial por etapas.
    5. Pranchas de plantas e revisões (ARQ-01 e HID-01).
    6. Limpeza de registros legados duplicados.
    """
    logger.info("=== Iniciando Hidratação Completa do PostgreSQL (Fase 1) ===")

    # ---------------------------------------------------------
    # 0. Limpeza de compras duplicadas stubs (que não possuem itens)
    # ---------------------------------------------------------
    stub_ids = [
        "d809fc28-7ac3-4676-ba04-98d7826e5f50",
        "858f2e25-f4c5-4e74-87c7-327bba1bc912",
        "24d25eef-0574-4ad0-bdf9-8d879ef44be2",
        "4c9d808c-9e1e-43b9-8251-daeff9e00482",
    ]
    for s_id in stub_ids:
        db.query(ParcelaPagamento).filter_by(compra_id=s_id).delete()
        db.query(ItemCompra).filter_by(compra_id=s_id).delete()
        db.query(Compra).filter_by(id=s_id).delete()
    db.commit()

    # ---------------------------------------------------------
    # 1. Usuários Padrão (RBAC)
    # ---------------------------------------------------------
    usuarios_data = [
        {"nome": "Sandro Gestor", "email": "sandro@sistemaobras.local", "papel": "gestor", "cargo": "Engenheiro / Gestor Geral", "permissao": "admin"},
        {"nome": "Arquiteto Especificador", "email": "arquiteto@sistemaobras.local", "papel": "arquiteto", "cargo": "Arquiteto Titular", "permissao": "operador"},
        {"nome": "Wagner (Mestre de Obras)", "telefone": "11999999999", "papel": "mestre_obras", "cargo": "Empreiteiro Geral", "permissao": "operador"},
        {"nome": "Comissão de Obras ICENV", "email": "conselho@icenv.local", "papel": "cliente", "cargo": "Diretoria Institucional", "permissao": "leitor"},
    ]
    for u in usuarios_data:
        existente = db.query(Usuario).filter_by(nome=u["nome"]).first()
        if not existente:
            db.add(Usuario(**u))
    db.commit()

    # ---------------------------------------------------------
    # 2. Fornecedores Homologados
    # ---------------------------------------------------------
    fornecedores_lista = [
        {"id": 1, "nome": "Leroy Merlin Interlagos", "tipo_parceiro": "Home Center", "especialidade": "Geral, Louças, Metais, Pisos e Acabamentos", "status": "Homologado"},
        {"id": 2, "nome": "Telhanorte Marginal Tietê", "tipo_parceiro": "Home Center", "especialidade": "Tubulações Tigre, Porcelanatos Eliane, Argamassas, Metais Docol", "status": "Homologado"},
        {"id": 3, "nome": "Obramax Mooca", "tipo_parceiro": "Atacarejo da Construção", "especialidade": "Básicos, Argamassa AC-III, Tubos, Drywall e Impermeabilizantes", "status": "Homologado"},
        {"id": 4, "nome": "C&C Casa e Construção Interlagos", "tipo_parceiro": "Home Center", "especialidade": "Louças Deca/Celite, Pisos e Metais", "status": "Homologado"},
        {"id": 5, "nome": "Marmoraria Granitos & Cia", "tipo_parceiro": "Marmoraria", "especialidade": "Bancadas, Peitoris e Divisórias Granito Cinza Corumbá", "status": "Homologado"},
        {"id": 6, "nome": "Caçambas União", "tipo_parceiro": "Caçambas & Serviços", "especialidade": "Descarte e Locação de Caçambas Estacionárias 5m³", "status": "Homologado"},
        {"id": 7, "nome": "Andra Materiais Elétricos", "tipo_parceiro": "Especializada Elétrica", "especialidade": "Cabos Flexíveis Pirelli/Corfio, Eletrodutos, Disjuntores", "status": "Homologado"},
        {"id": 8, "nome": "Depósito Zumkeller", "tipo_parceiro": "Depósito Local", "especialidade": "Areia, Brita, Cimento CP-II, Tijolos, Vigas, Laje e Entregas Rápidas", "status": "Homologado"},
        {"id": 9, "nome": "Longametragem Ferragens LTDA", "tipo_parceiro": "Comércio Ferragens", "especialidade": "Canaletas Baianas, Vergalhões de Aço e Ferramentas", "status": "Homologado"},
        {"id": 10, "nome": "Sodimac Dicico Tietê", "tipo_parceiro": "Home Center", "especialidade": "Esquadrias CRV, Portas, Janelas Venezianas e Ferragens", "status": "Homologado"},
        {"id": 11, "nome": "Hiper Pedras Marmoraria", "tipo_parceiro": "Marmoraria", "especialidade": "Soleiras, Peitoris e Divisórias Institucionais", "status": "Homologado"},
    ]
    for f_data in fornecedores_lista:
        f_exist = db.query(Fornecedor).filter((Fornecedor.id == f_data["id"]) | (Fornecedor.nome == f_data["nome"])).first()
        if not f_exist:
            db.add(Fornecedor(**f_data))
        else:
            f_exist.especialidade = f_data["especialidade"]
            f_exist.tipo_parceiro = f_data["tipo_parceiro"]
            f_exist.status = f_data["status"]
    db.commit()

    # ---------------------------------------------------------
    # 3. Categorias Essenciais
    # ---------------------------------------------------------
    categorias_necessarias = [
        {"classe": "Revestimento", "tipo": "Piso Porcelanato Retificado", "unidade_padrao": "m²", "fator_embalagem_padrao": 2.43},
        {"classe": "Revestimento", "tipo": "Azulejo / Revestimento de Parede Retificado", "unidade_padrao": "m²", "fator_embalagem_padrao": 1.50},
        {"classe": "Bruto / Estrutura", "tipo": "Argamassa AC-III", "unidade_padrao": "saco", "fator_embalagem_padrao": 20.0},
        {"classe": "Bruto / Estrutura", "tipo": "Impermeabilizante Flexível Polimérico", "unidade_padrao": "cx", "fator_embalagem_padrao": 18.0},
        {"classe": "Marmoraria", "tipo": "Divisórias em Granito Cinza Corumbá Polido", "unidade_padrao": "lote", "fator_embalagem_padrao": 1.0},
        {"classe": "Louças & Metais", "tipo": "Bacia Sanitária com Caixa Acoplada 3/6L", "unidade_padrao": "conjunto", "fator_embalagem_padrao": 1.0},
        {"classe": "Louças & Metais", "tipo": "Mictório em Louça com Válvula Automática", "unidade_padrao": "un", "fator_embalagem_padrao": 1.0},
        {"classe": "Louças & Metais", "tipo": "Lavatório com Coluna ou Cuba de Embutir", "unidade_padrao": "un", "fator_embalagem_padrao": 1.0},
        {"classe": "Louças & Metais", "tipo": "Torneira de Mesa Antivandalismo / Temporizada", "unidade_padrao": "un", "fator_embalagem_padrao": 1.0},
        {"classe": "Forro & Gesso", "tipo": "Gesso Acartonado RU (Verde Resistente à Umidade)", "unidade_padrao": "lote", "fator_embalagem_padrao": 1.0},
        {"classe": "Hidráulica", "tipo": "Tubo Soldável PVC Água Fria 25mm / 32mm", "unidade_padrao": "lote", "fator_embalagem_padrao": 1.0},
        {"classe": "Elétrica", "tipo": "Cabo Flexível 2,5mm² 750V", "unidade_padrao": "lote", "fator_embalagem_padrao": 1.0},
        {"classe": "Caçambas & Infra", "tipo": "Caçamba Estacionária para Entulho 5 m³", "unidade_padrao": "un", "fator_embalagem_padrao": 1.0},
        {"classe": "Pintura", "tipo": "Tinta Acrílica Fosca Lavável Premium", "unidade_padrao": "lote", "fator_embalagem_padrao": 1.0},
    ]
    for cat_data in categorias_necessarias:
        cat_exist = db.query(Categoria).filter_by(classe=cat_data["classe"], tipo=cat_data["tipo"]).first()
        if not cat_exist:
            db.add(Categoria(**cat_data))
    db.commit()

    # ---------------------------------------------------------
    # 4. PROJETO 1: Banheiro Casa Pastoral 2026 (proj-icenv-pastoral)
    # ---------------------------------------------------------
    pastoral_id = "proj-icenv-pastoral"
    proj_pastoral = db.query(Projeto).filter_by(id=pastoral_id).first()

    # Verificar se existe o projeto legado com UUID
    legacy_uuid = "627293a8-1f22-46d4-af28-821bec6b9725"
    legacy_proj = db.query(Projeto).filter_by(id=legacy_uuid).first()

    if not proj_pastoral:
        proj_pastoral = Projeto(
            id=pastoral_id,
            nome="1ª Fase: Banheiro Casa Pastoral — Obra ICENV 2026",
            status="Em Execução",
            data_inicio=date(2026, 10, 13),
            data_previsao_fim=date(2026, 11, 2),
            orcamento_teto=39000.00,
            orcamento_mao_obra=17000.00,
            orcamento_materiais=22000.00,
            reserva_tecnica=3000.00,
            descricao="Reforma completa do Banheiro da Casa Pastoral (3,3m² piso / 23m² paredes), demolição de beiral externo no quintal, regularização de janelas de dormitórios e fechamento de parede em alvenaria. Mão de obra contratada Wagner R$ 17.000,00 e Materiais R$ 22.000,00.",
        )
        db.add(proj_pastoral)
        db.flush()
    else:
        proj_pastoral.nome = "1ª Fase: Banheiro Casa Pastoral — Obra ICENV 2026"
        proj_pastoral.status = "Em Execução"
        proj_pastoral.orcamento_teto = 39000.00
        proj_pastoral.orcamento_mao_obra = 17000.00
        proj_pastoral.orcamento_materiais = 22000.00
        proj_pastoral.reserva_tecnica = 3000.00

    # Se existe o legado, re-apontar chaves estrangeiras
    if legacy_proj:
        db.execute(text("UPDATE ambiente SET projeto_id = :new_id WHERE projeto_id = :old_id"), {"new_id": pastoral_id, "old_id": legacy_uuid})
        db.execute(text("UPDATE cenario SET projeto_id = :new_id WHERE projeto_id = :old_id"), {"new_id": pastoral_id, "old_id": legacy_uuid})
        db.execute(text("UPDATE etapa_obra SET projeto_id = :new_id WHERE projeto_id = :old_id"), {"new_id": pastoral_id, "old_id": legacy_uuid})
        db.execute(text("UPDATE servico_mao_obra SET projeto_id = :new_id WHERE projeto_id = :old_id"), {"new_id": pastoral_id, "old_id": legacy_uuid})
        db.execute(text("UPDATE planta_projeto SET projeto_id = :new_id WHERE projeto_id = :old_id"), {"new_id": pastoral_id, "old_id": legacy_uuid})
        db.execute(text("UPDATE compra SET projeto_id = :new_id WHERE projeto_id = :old_id"), {"new_id": pastoral_id, "old_id": legacy_uuid})
        db.flush()
        db.delete(legacy_proj)
        db.commit()

    # Ambientes Pastoral
    amb_pastoral_id = "amb-pastoral"
    amb_externa_id = "amb-externa-pastoral"
    amb_comum_id = "amb-comum-pastoral"

    # Mapear ambientes anteriores se existirem com UUID
    old_amb_pastoral = db.query(Ambiente).filter(Ambiente.nome.like("%Casa Pastoral%")).first()
    if old_amb_pastoral and old_amb_pastoral.id != amb_pastoral_id:
        old_id = old_amb_pastoral.id
        db.execute(text("UPDATE item_projeto SET ambiente_id = :old_id_temp WHERE ambiente_id = :old_id"), {"old_id_temp": old_id, "old_id": old_id})
        # Criar amb-pastoral se não existir
        if not db.query(Ambiente).filter_by(id=amb_pastoral_id).first():
            db.add(Ambiente(id=amb_pastoral_id, projeto_id=pastoral_id, nome="Banheiro Casa Pastoral", area_piso=3.30, area_parede=23.00, perimetro=7.40))
            db.flush()
        db.execute(text("UPDATE item_projeto SET ambiente_id = :new_id WHERE ambiente_id = :old_id"), {"new_id": amb_pastoral_id, "old_id": old_id})
        db.delete(old_amb_pastoral)
        db.flush()
    elif not old_amb_pastoral:
        db.add(Ambiente(id=amb_pastoral_id, projeto_id=pastoral_id, nome="Banheiro Casa Pastoral", area_piso=3.30, area_parede=23.00, perimetro=7.40))

    old_amb_externa = db.query(Ambiente).filter_by(nome="Área Externa").first()
    if old_amb_externa and old_amb_externa.id != amb_externa_id:
        old_id = old_amb_externa.id
        if not db.query(Ambiente).filter_by(id=amb_externa_id).first():
            db.add(Ambiente(id=amb_externa_id, projeto_id=pastoral_id, nome="Área Externa", area_piso=12.00, area_parede=28.00, perimetro=14.00))
            db.flush()
        db.execute(text("UPDATE item_projeto SET ambiente_id = :new_id WHERE ambiente_id = :old_id"), {"new_id": amb_externa_id, "old_id": old_id})
        db.delete(old_amb_externa)
        db.flush()
    elif not old_amb_externa:
        db.add(Ambiente(id=amb_externa_id, projeto_id=pastoral_id, nome="Área Externa", area_piso=12.00, area_parede=28.00, perimetro=14.00))

    if not db.query(Ambiente).filter_by(id=amb_comum_id).first():
        db.add(Ambiente(id=amb_comum_id, projeto_id=pastoral_id, nome="Área Externa & Descarte (Casa Pastoral)", area_piso=0.00, area_parede=0.00, perimetro=0.00))

    # Cenário Pastoral
    cen_pastoral_id = "cenario-pastoral-std"
    old_cen = db.query(Cenario).filter((Cenario.id == "b0786118-9a21-46ca-8536-ec4be7a376c1") | (Cenario.nome.like("%Standard%"))).first()
    if old_cen and old_cen.id != cen_pastoral_id:
        old_id = old_cen.id
        if not db.query(Cenario).filter_by(id=cen_pastoral_id).first():
            db.add(Cenario(id=cen_pastoral_id, projeto_id=pastoral_id, nome="Detalhamento Executivo Oficial (Casa Pastoral)", ativo=True))
            db.flush()
        db.execute(text("UPDATE item_projeto SET cenario_id = :new_id WHERE cenario_id = :old_id"), {"new_id": cen_pastoral_id, "old_id": old_id})
        db.delete(old_cen)
        db.flush()
    elif not old_cen and not db.query(Cenario).filter_by(id=cen_pastoral_id).first():
        db.add(Cenario(id=cen_pastoral_id, projeto_id=pastoral_id, nome="Detalhamento Executivo Oficial (Casa Pastoral)", ativo=True))
    db.commit()

    # Mão de obra Pastoral
    mo_pastoral = db.query(ServicoMaoObra).filter_by(projeto_id=pastoral_id).first()
    if not mo_pastoral:
        db.add(
            ServicoMaoObra(
                id="mo-pastoral-wagner",
                projeto_id=pastoral_id,
                prestador_nome="Profissional Wagner",
                escopo_etapa="Demolições, hidráulica, elétrica, contrapiso, impermeabilização, revestimentos e louças Casa Pastoral",
                valor_contratado=17000.00,
                valor_pago_acumulado=0.00,
                status="Em Andamento",
            )
        )
    else:
        mo_pastoral.valor_contratado = 17000.00
        mo_pastoral.status = "Em Andamento"
    db.commit()

    # Etapas Pastoral
    etapas_pastoral_data = [
        ("etapa-pas-s1", pastoral_id, "Semana 1 (13/10 a 19/10): Demolições gerais, caçambas, remoção de beiral externo e janelas", 1, date(2026, 10, 13), date(2026, 10, 19), 100, "Concluída"),
        ("etapa-pas-s2", pastoral_id, "Semana 2 (20/10 a 26/10): Novas instalações de água fria/esgoto, eletrodutos, vão janela e alvenaria", 2, date(2026, 10, 20), date(2026, 10, 26), 40, "Em Andamento"),
        ("etapa-pas-s3", pastoral_id, "Semana 3 (27/10 a 02/11): Contrapiso com caimento, impermeabilização 72h, piso porcelanato, azulejo, forro e entrega", 3, date(2026, 10, 27), date(2026, 11, 2), 0, "Não Iniciada"),
    ]
    for eid, pid, nome, sem, ini, fim, perc, stat in etapas_pastoral_data:
        e_exist = db.query(EtapaObra).filter((EtapaObra.id == eid) | ((EtapaObra.projeto_id == pid) & (EtapaObra.semana_cronograma == sem))).first()
        if not e_exist:
            db.add(EtapaObra(id=eid, projeto_id=pid, nome_etapa=nome, semana_cronograma=sem, data_inicio_prevista=ini, data_fim_prevista=fim, percentual_concluido=perc, status=stat))
        else:
            e_exist.nome_etapa = nome
            e_exist.percentual_concluido = perc
            e_exist.status = stat
    db.commit()

    # Plantas e Revisões Pastoral
    planta_arq = db.query(PlantaProjeto).filter_by(projeto_id=pastoral_id, codigo_prancha="ARQ-01").first()
    if not planta_arq:
        planta_arq = PlantaProjeto(
            id="planta-arq-01",
            projeto_id=pastoral_id,
            codigo_prancha="ARQ-01",
            titulo="Demolição, Layout e Especificações — Banheiro Casa Pastoral",
            disciplina="Arquitetura",
            arquivo_url="plantas/ARQ-01_Pastoral_R01.pdf",
        )
        db.add(planta_arq)
        db.flush()

        db.add(VersaoPlanta(
            id="versao-arq-r00",
            planta_id=planta_arq.id,
            revisao="R00",
            data_emissao=date(2026, 10, 13),
            autor_arquiteto="Arquiteto Titular",
            aprovador_gestor="Sandro Gestor",
            status="Superada",
            notas_alteracao="Emissão inicial de projeto conceitual e estimativa inicial de áreas.",
            metadados_extracao={"area_piso": 3.3, "area_parede": 23.0, "perimetro": 7.4},
        ))
        db.add(VersaoPlanta(
            id="versao-arq-r01",
            planta_id=planta_arq.id,
            revisao="R01",
            data_emissao=date(2026, 10, 17),
            autor_arquiteto="Arquiteto Titular",
            aprovador_gestor="Sandro Gestor",
            status="Vigente",
            notas_alteracao="Especificação executiva: Porcelanato Eliane Palavcorda 90x90, metais Docol Nova Logg e Bacia Celite Smart.",
            metadados_extracao={"area_piso": 3.3, "area_parede": 23.0, "perimetro": 7.4, "acabamento": "Porcelanato Palavcorda 90x90cm", "fabricante": "Eliane"},
        ))
    db.commit()

    # ---------------------------------------------------------
    # 5. AS 8 COMPRAS REAIS FATURADAS (R$ 19.932,32)
    # ---------------------------------------------------------
    compras_reais_data = [
        {
            "id": "compra-zumkeller-86007",
            "projeto_id": pastoral_id,
            "fornecedor_id": 8,
            "numero_nf": "86.007",
            "data_compra": date(2026, 10, 10),
            "valor_total": Decimal("4196.59"),
            "forma_pagamento": "dinheiro",
            "quantidade_parcelas": 1,
            "foto_nf_url": "Zunkler_10OUT26.pdf",
            "observacoes": "16 itens de materiais brutos, alvenaria, madeiras, aço, laje + R$ 50,00 frete. Pago à vista.",
            "parcelas": [(1, date(2026, 10, 10), Decimal("4196.59"), "Pago", date(2026, 10, 10))],
        },
        {
            "id": "compra-zumkeller-86006",
            "projeto_id": pastoral_id,
            "fornecedor_id": 8,
            "numero_nf": "86.006",
            "data_compra": date(2026, 10, 10),
            "valor_total": Decimal("46.45"),
            "forma_pagamento": "dinheiro",
            "quantidade_parcelas": 1,
            "foto_nf_url": "Zunkler_10OUT26.pdf",
            "observacoes": "Plafon LED sobrepor 24W 6400K Quadrado Ourolux para a Área Externa. Pago à vista.",
            "parcelas": [(1, date(2026, 10, 10), Decimal("46.45"), "Pago", date(2026, 10, 10))],
        },
        {
            "id": "compra-longametragem-92041",
            "projeto_id": pastoral_id,
            "fornecedor_id": 9,
            "numero_nf": "92.041",
            "data_compra": date(2026, 10, 15),
            "valor_total": Decimal("52.80"),
            "forma_pagamento": "dinheiro",
            "quantidade_parcelas": 1,
            "foto_nf_url": "92041 - DANFE - IGREJA CRISTA EVANGELICA NOVA VIDA  ICEB.pdf",
            "observacoes": "24 canaletas baianas econômicas Guaru para a viga de respaldo. Pago à vista.",
            "parcelas": [(1, date(2026, 10, 15), Decimal("52.80"), "Pago", date(2026, 10, 15))],
        },
        {
            "id": "compra-zumkeller-86653",
            "projeto_id": pastoral_id,
            "fornecedor_id": 8,
            "numero_nf": "86.653",
            "data_compra": date(2026, 10, 16),
            "valor_total": Decimal("710.92"),
            "forma_pagamento": "dinheiro",
            "quantidade_parcelas": 1,
            "foto_nf_url": "Zunkler_16OUT26.pdf",
            "observacoes": "5 itens de materiais hidráulicos Krona (50mm/25mm) e esgoto (100mm/75mm) + 20 sacos brita 20kg e R$ 50,00 frete. Pago à vista.",
            "parcelas": [(1, date(2026, 10, 16), Decimal("710.92"), "Pago", date(2026, 10, 16))],
        },
        {
            "id": "compra-sodimac-1918242567",
            "projeto_id": pastoral_id,
            "fornecedor_id": 10,
            "numero_nf": "OV-1918242567",
            "data_compra": date(2026, 10, 18),
            "valor_total": Decimal("4264.41"),
            "valor_frete": Decimal("366.41"),
            "forma_pagamento": "cartao_credito",
            "quantidade_parcelas": 6,
            "foto_nf_url": "Sodimac_18Out.pdf",
            "observacoes": "2 janelas venezianas 6F 100x150cm vidro liso CRV (R$ 3.898,00) + Frete (R$ 366,41). Parcelado em 6x no cartão de crédito.",
            "parcelas": [
                (1, date(2026, 11, 18), Decimal("710.73"), "Pendente", None),
                (2, date(2026, 12, 18), Decimal("710.73"), "Pendente", None),
                (3, date(2027, 1, 18), Decimal("710.73"), "Pendente", None),
                (4, date(2027, 2, 18), Decimal("710.73"), "Pendente", None),
                (5, date(2027, 3, 18), Decimal("710.73"), "Pendente", None),
                (6, date(2027, 4, 18), Decimal("710.76"), "Pendente", None),
            ],
        },
        {
            "id": "compra-telhanorte-53813",
            "projeto_id": pastoral_id,
            "fornecedor_id": 2,
            "numero_nf": "53.813",
            "data_compra": date(2026, 10, 17),
            "valor_total": Decimal("3261.79"),
            "forma_pagamento": "cartao_credito",
            "quantidade_parcelas": 1,
            "foto_nf_url": "Telha Norte_17out.pdf",
            "observacoes": "37 itens de hidráulica Tigre, conexões, ferramentas Starrett/Atlas, pintura Suvinil, registros Deca e metais Docol Nova Logg. Cartão de crédito.",
            "parcelas": [(1, date(2026, 11, 17), Decimal("3261.79"), "Pendente", None)],
        },
        {
            "id": "compra-telhanorte-005576",
            "projeto_id": pastoral_id,
            "fornecedor_id": 2,
            "numero_nf": "PED-005576",
            "data_compra": date(2026, 10, 17),
            "valor_total": Decimal("863.54"),
            "valor_frete": Decimal("79.54"),
            "valor_desconto_geral": Decimal("0.04"),
            "forma_pagamento": "cartao_credito",
            "quantidade_parcelas": 1,
            "foto_nf_url": "Telha Norte_17Out_2.pdf",
            "observacoes": "10,1m² revestimento Fachada Mint 7,5x25 (R$ 783,96) com frete de entrega (R$ 79,54). Entrega prevista para 04/11/2026.",
            "parcelas": [(1, date(2026, 11, 17), Decimal("863.54"), "Pendente", None)],
        },
        {
            "id": "compra-telhanorte-005578",
            "projeto_id": pastoral_id,
            "fornecedor_id": 2,
            "numero_nf": "PED-005578",
            "data_compra": date(2026, 10, 17),
            "valor_total": Decimal("6536.46"),
            "valor_frete": Decimal("540.34"),
            "forma_pagamento": "cartao_credito",
            "quantidade_parcelas": 1,
            "foto_nf_url": "Telha Norte_17Out_2.pdf",
            "observacoes": "Porcelanato Eliane Palavcorda 90x90 (21,87m²), 13 sacos AC-III, rejunte acrílico, kit niveladores, Bacia Smart Celite, Cuba Icasa, Vitrô Top Sul e frete.",
            "parcelas": [(1, date(2026, 11, 17), Decimal("6536.46"), "Pendente", None)],
        },
    ]

    for c_info in compras_reais_data:
        c_exist = db.query(Compra).filter_by(id=c_info["id"]).first()
        if not c_exist:
            c_exist = Compra(
                id=c_info["id"],
                projeto_id=c_info["projeto_id"],
                fornecedor_id=c_info["fornecedor_id"],
                numero_nf=c_info["numero_nf"],
                data_compra=c_info["data_compra"],
                valor_total=c_info["valor_total"],
                valor_frete=c_info.get("valor_frete", Decimal("0.00")),
                valor_desconto_geral=c_info.get("valor_desconto_geral", Decimal("0.00")),
                forma_pagamento=c_info["forma_pagamento"],
                quantidade_parcelas=c_info["quantidade_parcelas"],
                foto_nf_url=c_info.get("foto_nf_url"),
                observacoes=c_info.get("observacoes"),
            )
            db.add(c_exist)
            db.flush()
        else:
            c_exist.projeto_id = c_info["projeto_id"]
            c_exist.fornecedor_id = c_info["fornecedor_id"]
            c_exist.valor_total = c_info["valor_total"]
            c_exist.quantidade_parcelas = c_info["quantidade_parcelas"]
            c_exist.forma_pagamento = c_info["forma_pagamento"]

        # Garantir parcelas
        for num_p, dt_venc, val_p, st, dt_pg in c_info["parcelas"]:
            p_exist = db.query(ParcelaPagamento).filter_by(compra_id=c_exist.id, numero_parcela=num_p).first()
            if not p_exist:
                p_novo = ParcelaPagamento(
                    compra_id=c_exist.id,
                    numero_parcela=num_p,
                    data_vencimento=dt_venc,
                    valor_parcela=val_p,
                    status=st,
                    data_pagamento_efetivo=dt_pg,
                )
                db.add(p_novo)
            else:
                p_exist.valor_parcela = val_p
                p_exist.status = st
                p_exist.data_pagamento_efetivo = dt_pg
    db.commit()

    # ---------------------------------------------------------
    # 6. PROJETO 2: Banheiro Masculino Igreja 2026 (proj-icenv-masculino)
    # ---------------------------------------------------------
    masc_id = "proj-icenv-masculino"
    proj_masculino = db.query(Projeto).filter_by(id=masc_id).first()

    if not proj_masculino:
        proj_masculino = Projeto(
            id=masc_id,
            nome="2ª Fase: Banheiro Masculino Igreja — Obra ICENV 2026",
            status="Planejamento",
            data_inicio=date(2026, 11, 3),
            data_previsao_fim=date(2026, 11, 24),
            orcamento_teto=28325.00,
            orcamento_mao_obra=15500.00,
            orcamento_materiais=12825.00,
            reserva_tecnica=2500.00,
            descricao="Reforma completa do Bloco Sanitário Coletivo Masculino da Igreja (~10m² piso / 37m² paredes), revisão completa hidráulica/elétrica, montagem de divisórias de granito nos boxes, 2 bacias, 2 mictórios e forro de gesso. Mão de obra contratada Wagner R$ 15.500,00 e Materiais R$ 12.825,00.",
        )
        db.add(proj_masculino)
        db.flush()
    else:
        proj_masculino.nome = "2ª Fase: Banheiro Masculino Igreja — Obra ICENV 2026"
        proj_masculino.status = "Planejamento"
        proj_masculino.orcamento_teto = 28325.00
        proj_masculino.orcamento_mao_obra = 15500.00
        proj_masculino.orcamento_materiais = 12825.00
        proj_masculino.reserva_tecnica = 2500.00

    # Ambientes Masculino
    amb_masc_id = "amb-masculino"
    amb_comum_masc_id = "amb-comum-masculino"

    if not db.query(Ambiente).filter_by(id=amb_masc_id).first():
        db.add(Ambiente(id=amb_masc_id, projeto_id=masc_id, nome="Banheiro Masculino Igreja", area_piso=10.00, area_parede=37.00, perimetro=13.00))
    if not db.query(Ambiente).filter_by(id=amb_comum_masc_id).first():
        db.add(Ambiente(id=amb_comum_masc_id, projeto_id=masc_id, nome="Área Externa & Descarte (Igreja)", area_piso=0.00, area_parede=0.00, perimetro=0.00))

    # Cenário Masculino
    cen_masc_id = "cenario-masc-std"
    if not db.query(Cenario).filter_by(id=cen_masc_id).first():
        db.add(Cenario(id=cen_masc_id, projeto_id=masc_id, nome="Detalhamento Executivo Oficial (Banheiro Masculino)", ativo=True))
    db.commit()

    # Mão de obra Masculino
    if not db.query(ServicoMaoObra).filter_by(projeto_id=masc_id).first():
        db.add(
            ServicoMaoObra(
                id="mo-masculino-wagner",
                projeto_id=masc_id,
                prestador_nome="Profissional Wagner",
                escopo_etapa="Demolições, hidráulica/elétrica para 2 bacias e 2 mictórios, contrapiso, impermeabilização, divisórias de granito e acabamentos Bloco Masculino",
                valor_contratado=15500.00,
                valor_pago_acumulado=0.00,
                status="A Iniciar",
            )
        )

    # Etapas Masculino
    etapas_masculino_data = [
        ("etapa-masc-s1", masc_id, "Semana 1 (03/11 a 09/11): Desativação, caçambas, demolição de revestimentos e divisórias antigas", 1, date(2026, 11, 3), date(2026, 11, 9), 0, "Não Iniciada"),
        ("etapa-masc-s2", masc_id, "Semana 2 (10/11 a 16/11): Revisão hidráulica/elétrica, pontos 2 bacias/2 mictórios, contrapiso e impermeabilização 72h", 2, date(2026, 11, 10), date(2026, 11, 16), 0, "Não Iniciada"),
        ("etapa-masc-s3", masc_id, "Semana 3 (17/11 a 24/11): Divisórias granito Corumbá, revestimentos cerâmicos, louças, metais e entrega", 3, date(2026, 11, 17), date(2026, 11, 24), 0, "Não Iniciada"),
    ]
    for eid, pid, nome, sem, ini, fim, perc, stat in etapas_masculino_data:
        e_exist = db.query(EtapaObra).filter((EtapaObra.id == eid) | ((EtapaObra.projeto_id == pid) & (EtapaObra.semana_cronograma == sem))).first()
        if not e_exist:
            db.add(EtapaObra(id=eid, projeto_id=pid, nome_etapa=nome, semana_cronograma=sem, data_inicio_prevista=ini, data_fim_prevista=fim, percentual_concluido=perc, status=stat))
    db.commit()

    # Materiais e Itens do Projeto Masculino (WBS com 14 itens)
    itens_masculino_especificacoes = [
        ("item-masc-1", amb_masc_id, "mat-rev-01", "Piso Porcelanato Esmaltado Retificado 60x60 / 84x84", "Portobello / Eliane", "m²", 10.0, 10.0, 11.0, 1, 68.00, "Revestimento", "Piso Porcelanato Retificado"),
        ("item-masc-2", amb_masc_id, "mat-rev-02", "Azulejo / Revestimento de Parede Cerâmico Retificado White 30x60", "Eliane / Ceusa", "m²", 37.0, 10.0, 40.7, 1, 55.00, "Revestimento", "Azulejo / Revestimento de Parede Retificado"),
        ("item-masc-3", amb_masc_id, "mat-br-05", "Argamassa AC-III Cinza 20kg Quartzolit", "Quartzolit", "saco", 15.0, 0.0, 15.0, 15, 42.00, "Bruto / Estrutura", "Argamassa AC-III"),
        ("item-masc-4", amb_masc_id, "mat-mar-01", "Divisórias em Granito Cinza Corumbá Polido (p/ boxes masculinos)", "Marmoraria Especializada / Hiper Pedras", "lote", 1.0, 0.0, 1.0, 1, 2500.00, "Marmoraria", "Divisórias em Granito Cinza Corumbá Polido"),
        ("item-masc-5", amb_masc_id, "mat-lou-01", "Bacia Sanitária c/ Caixa Acoplada 3/6L (Deca/Celite)", "Celite / Deca", "conjunto", 2.0, 0.0, 2.0, 2, 620.00, "Louças & Metais", "Bacia Sanitária com Caixa Acoplada 3/6L"),
        ("item-masc-6", amb_masc_id, "mat-lou-05", "Mictórios em louça com válvula automática", "Deca", "un", 2.0, 0.0, 2.0, 2, 320.00, "Louças & Metais", "Mictório em Louça com Válvula Automática"),
        ("item-masc-7", amb_masc_id, "mat-lou-02", "Lavatório c/ coluna ou cuba de embutir", "Deca / Celite", "un", 2.0, 0.0, 2.0, 2, 250.00, "Louças & Metais", "Lavatório com Coluna ou Cuba de Embutir"),
        ("item-masc-8", amb_masc_id, "mat-lou-03", "Torneiras de mesa antivandalismo / temporizadas", "Docol / Deca", "un", 2.0, 0.0, 2.0, 2, 140.00, "Louças & Metais", "Torneira de Mesa Antivandalismo / Temporizada"),
        ("item-masc-9", amb_masc_id, "mat-ges-01", "Gesso Acartonado RU (Verde Resistente à Umidade) e perfis F530", "Placo / Knauf", "lote", 1.0, 0.0, 1.0, 1, 800.00, "Forro & Gesso", "Gesso Acartonado RU (Verde Resistente à Umidade)"),
        ("item-masc-10", amb_masc_id, "mat-hid-01", "Tubulações e Conexões Soldáveis PVC Água Fria e Esgoto Série Normal", "Tigre / Amanco", "lote", 1.0, 0.0, 1.0, 1, 850.00, "Hidráulica", "Tubo Soldável PVC Água Fria 25mm / 32mm"),
        ("item-masc-11", amb_masc_id, "mat-elet-01", "Cabos Flexíveis 2,5mm² e 4,0mm² e Eletrodutos Reforçados", "Pirelli / Tigre", "lote", 1.0, 0.0, 1.0, 1, 520.00, "Elétrica", "Cabo Flexível 2,5mm² 750V"),
        ("item-masc-12", amb_masc_id, "mat-br-06", "Impermeabilizante Flexível Polimérico Viaplus 1000/7000 (Caixas 18kg)", "Viapol / Sika", "cx", 3.0, 0.0, 3.0, 3, 180.00, "Bruto / Estrutura", "Impermeabilizante Flexível Polimérico"),
        ("item-masc-13", amb_comum_masc_id, "mat-cac-01", "Caçamba Estacionária para Entulho (5 m³)", "Caçambas União", "un", 2.0, 0.0, 2.0, 2, 475.00, "Caçambas & Infra", "Caçamba Estacionária para Entulho 5 m³"),
        ("item-masc-14", amb_masc_id, "mat-pin-01", "Pintura Acrílica Premium Lavável e Esmalte para Esquadrias/Portas", "Suvinil / Coral", "lote", 1.0, 0.0, 1.0, 1, 580.00, "Pintura", "Tinta Acrílica Fosca Lavável Premium"),
    ]

    for it_id, amb_target, mat_id, mat_desc, fab, unid, q_liq, margem, q_bruta, embal, pr_unit, cat_cl, cat_tp in itens_masculino_especificacoes:
        # Garantir material
        mat = db.query(Material).filter_by(id=mat_id).first()
        cat = db.query(Categoria).filter_by(classe=cat_cl, tipo=cat_tp).first()
        if not mat:
            mat = Material(
                id=mat_id,
                categoria_id=cat.id if cat else None,
                descricao=mat_desc,
                fabricante=fab,
                modelo_sku=mat_desc[:50],
                unidade_venda=unid,
                fator_embalagem=1.0,
            )
            db.add(mat)
            db.flush()

        # Garantir item_projeto
        ip_exist = db.query(ItemProjeto).filter_by(id=it_id).first()
        if not ip_exist:
            db.add(
                ItemProjeto(
                    id=it_id,
                    ambiente_id=amb_target,
                    material_id=mat.id,
                    cenario_id=cen_masc_id,
                    qtd_necessaria_liquida=q_liq,
                    margem_perda_pct=margem,
                    qtd_calculada_bruta=q_bruta,
                    qtd_embalagem_fechada=embal,
                    preco_unitario_estimado=pr_unit,
                )
            )
    db.commit()

    # ---------------------------------------------------------
    # 7. PROJETO 3: Benchmarking 2024 (proj-icenv-2024)
    # ---------------------------------------------------------
    hist_id = "proj-icenv-2024"
    proj_2024 = db.query(Projeto).filter_by(id=hist_id).first()

    if not proj_2024:
        proj_2024 = Projeto(
            id=hist_id,
            nome="Benchmarking Reforma ICENV 2024",
            status="Concluído",
            data_inicio=date(2024, 5, 10),
            data_previsao_fim=date(2024, 8, 30),
            orcamento_teto=28425.24,
            orcamento_mao_obra=12000.00,
            orcamento_materiais=16425.24,
            reserva_tecnica=0.00,
            descricao="Projeto histórico de referência e benchmarking de custos da Igreja Nova Vida (2024). Registros consolidados para comparação de índices de produtividade e preços unitários.",
        )
        db.add(proj_2024)
        db.flush()

        amb_2024 = Ambiente(id="amb-2024-salao", projeto_id=hist_id, nome="Salão Social & Apoio", area_piso=25.00, area_parede=60.00, perimetro=20.00)
        db.add(amb_2024)

        cen_2024 = Cenario(id="cenario-2024-asbuilt", projeto_id=hist_id, nome="As-Built Executado 2024", ativo=True)
        db.add(cen_2024)

        etapa_2024 = EtapaObra(
            id="etapa-2024-concluida",
            projeto_id=hist_id,
            nome_etapa="Reforma Geral Concluída e Aprovada em 2024",
            semana_cronograma=1,
            data_inicio_prevista=date(2024, 5, 10),
            data_fim_prevista=date(2024, 8, 30),
            percentual_concluido=100,
            status="Concluída",
        )
        db.add(etapa_2024)

        mo_2024 = ServicoMaoObra(
            id="mo-2024-executada",
            projeto_id=hist_id,
            prestador_nome="Mão de Obra Empreitada 2024",
            escopo_etapa="Alvenaria, pisos, pintura e instalações elétricas/hidráulicas salão",
            valor_contratado=12000.00,
            valor_pago_acumulado=12000.00,
            status="Concluído",
        )
        db.add(mo_2024)
        db.commit()

    logger.info("=== Hidratação e Migração Completa Concluída com Sucesso! ===")


if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_projetos_e_dados_completos(db)
    finally:
        db.close()
