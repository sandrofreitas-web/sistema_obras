import uuid
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Text,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    nome = Column(String(150), nullable=False)
    cargo = Column(String(100), nullable=True)
    permissao = Column(String(50), default="operador")
    criado_em = Column(DateTime, default=datetime.utcnow)

    precos_capturados = relationship("PrecoCaptura", back_populates="usuario")


class Fornecedor(Base):
    __tablename__ = "fornecedor"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(150), nullable=False, unique=True)
    tipo_parceiro = Column(String(80), nullable=True)
    especialidade = Column(Text, nullable=True)
    cnpj = Column(String(20), nullable=True)
    telefone_contato = Column(String(30), nullable=True)
    endereco = Column(Text, nullable=True)
    historico_compras_2024 = Column(Numeric(12, 2), default=0.00)
    status = Column(String(30), default="Homologado")
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    precos = relationship("PrecoCaptura", back_populates="fornecedor")
    compras = relationship("Compra", back_populates="fornecedor")


class Categoria(Base):
    __tablename__ = "categoria"

    id = Column(Integer, primary_key=True, autoincrement=True)
    classe = Column(String(80), nullable=False)
    tipo = Column(String(100), nullable=False)
    unidade_padrao = Column(String(30), nullable=False)
    fator_embalagem_padrao = Column(Numeric(10, 3), default=1.000)

    materiais = relationship("Material", back_populates="categoria")


class Material(Base):
    __tablename__ = "material"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    categoria_id = Column(Integer, ForeignKey("categoria.id"), nullable=True)
    descricao = Column(String(255), nullable=False)
    fabricante = Column(String(100), nullable=True)
    modelo_sku = Column(String(100), nullable=True)
    unidade_venda = Column(String(30), nullable=False)
    fator_embalagem = Column(Numeric(10, 3), default=1.000)
    foto_referencia_url = Column(Text, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    categoria = relationship("Categoria", back_populates="materiais")
    precos = relationship("PrecoCaptura", back_populates="material")
    itens_projeto = relationship("ItemProjeto", back_populates="material")
    itens_compra = relationship("ItemCompra", back_populates="material")


class PrecoCaptura(Base):
    __tablename__ = "preco_captura"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    material_id = Column(String(36), ForeignKey("material.id"), nullable=False)
    fornecedor_id = Column(Integer, ForeignKey("fornecedor.id"), nullable=False)
    usuario_id = Column(String(36), ForeignKey("usuario.id"), nullable=True)
    preco_vista = Column(Numeric(12, 2), nullable=False)
    preco_prazo = Column(Numeric(12, 2), nullable=True)
    data_captura = Column(DateTime, default=datetime.utcnow)
    foto_etiqueta_url = Column(Text, nullable=True)

    material = relationship("Material", back_populates="precos")
    fornecedor = relationship("Fornecedor", back_populates="precos")
    usuario = relationship("Usuario", back_populates="precos_capturados")


class Projeto(Base):
    __tablename__ = "projeto"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    nome = Column(String(150), nullable=False)
    status = Column(String(30), default="Planejamento")
    data_inicio = Column(Date, nullable=True)
    data_previsao_fim = Column(Date, nullable=True)
    orcamento_teto = Column(Numeric(14, 2), default=0.00)
    orcamento_mao_obra = Column(Numeric(14, 2), default=0.00)
    orcamento_materiais = Column(Numeric(14, 2), default=0.00)
    reserva_tecnica = Column(Numeric(14, 2), default=0.00)
    descricao = Column(Text, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    ambientes = relationship("Ambiente", back_populates="projeto", cascade="all, delete-orphan")
    cenarios = relationship("Cenario", back_populates="projeto", cascade="all, delete-orphan")
    servicos_mao_obra = relationship("ServicoMaoObra", back_populates="projeto")
    etapas = relationship("EtapaObra", back_populates="projeto", cascade="all, delete-orphan")


class Ambiente(Base):
    __tablename__ = "ambiente"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    projeto_id = Column(String(36), ForeignKey("projeto.id"), nullable=False)
    nome = Column(String(100), nullable=False)
    area_piso = Column(Numeric(10, 2), default=0.00)
    area_parede = Column(Numeric(10, 2), default=0.00)
    perimetro = Column(Numeric(10, 2), default=0.00)

    projeto = relationship("Projeto", back_populates="ambientes")
    itens_projeto = relationship("ItemProjeto", back_populates="ambiente", cascade="all, delete-orphan")


class Cenario(Base):
    __tablename__ = "cenario"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    projeto_id = Column(String(36), ForeignKey("projeto.id"), nullable=False)
    nome = Column(String(150), nullable=False)
    ativo = Column(Boolean, default=True)

    projeto = relationship("Projeto", back_populates="cenarios")
    itens_projeto = relationship("ItemProjeto", back_populates="cenario", cascade="all, delete-orphan")


class ItemProjeto(Base):
    __tablename__ = "item_projeto"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ambiente_id = Column(String(36), ForeignKey("ambiente.id"), nullable=False)
    material_id = Column(String(36), ForeignKey("material.id"), nullable=False)
    cenario_id = Column(String(36), ForeignKey("cenario.id"), nullable=False)
    qtd_necessaria_liquida = Column(Numeric(10, 2), default=0.00)
    margem_perda_pct = Column(Numeric(5, 2), default=10.00)
    qtd_calculada_bruta = Column(Numeric(10, 2), default=0.00)
    qtd_embalagem_fechada = Column(Integer, default=1)
    preco_unitario_estimado = Column(Numeric(12, 2), default=0.00)

    ambiente = relationship("Ambiente", back_populates="itens_projeto")
    material = relationship("Material", back_populates="itens_projeto")
    cenario = relationship("Cenario", back_populates="itens_projeto")
    itens_compra = relationship("ItemCompra", back_populates="item_projeto")


class ServicoMaoObra(Base):
    __tablename__ = "servico_mao_obra"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    projeto_id = Column(String(36), ForeignKey("projeto.id"), nullable=False)
    prestador_nome = Column(String(120), nullable=False)
    escopo_etapa = Column(String(200), nullable=False)
    valor_contratado = Column(Numeric(12, 2), nullable=False)
    valor_pago_acumulado = Column(Numeric(12, 2), default=0.00)
    status = Column(String(30), default="A Iniciar")

    projeto = relationship("Projeto", back_populates="servicos_mao_obra")


class Compra(Base):
    __tablename__ = "compra"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    fornecedor_id = Column(Integer, ForeignKey("fornecedor.id"), nullable=False)
    numero_nf = Column(String(50), nullable=True)
    data_compra = Column(Date, default=date.today)
    valor_total = Column(Numeric(12, 2), nullable=False)
    valor_desconto_geral = Column(Numeric(12, 2), default=0.00)
    valor_frete = Column(Numeric(12, 2), default=0.00)
    forma_pagamento = Column(String(30), default="A Vista")
    quantidade_parcelas = Column(Integer, default=1)
    foto_nf_url = Column(Text, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    fornecedor = relationship("Fornecedor", back_populates="compras")
    parcelas = relationship("ParcelaPagamento", back_populates="compra", cascade="all, delete-orphan")
    itens = relationship("ItemCompra", back_populates="compra", cascade="all, delete-orphan")


class ParcelaPagamento(Base):
    __tablename__ = "parcela_pagamento"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    compra_id = Column(String(36), ForeignKey("compra.id"), nullable=False)
    numero_parcela = Column(Integer, nullable=False)
    data_vencimento = Column(Date, nullable=False)
    valor_parcela = Column(Numeric(12, 2), nullable=False)
    data_pagamento_efetivo = Column(Date, nullable=True)
    status = Column(String(20), default="Pendente")

    compra = relationship("Compra", back_populates="parcelas")


class ItemCompra(Base):
    __tablename__ = "item_compra"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    compra_id = Column(String(36), ForeignKey("compra.id"), nullable=False)
    item_projeto_id = Column(String(36), ForeignKey("item_projeto.id"), nullable=True)
    material_id = Column(String(36), ForeignKey("material.id"), nullable=False)
    qtd_comprada = Column(Numeric(10, 2), nullable=False)
    preco_unitario_real = Column(Numeric(12, 2), nullable=False)

    compra = relationship("Compra", back_populates="itens")
    item_projeto = relationship("ItemProjeto", back_populates="itens_compra")
    material = relationship("Material", back_populates="itens_compra")


class EtapaObra(Base):
    __tablename__ = "etapa_obra"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    projeto_id = Column(String(36), ForeignKey("projeto.id"), nullable=False)
    nome_etapa = Column(String(255), nullable=False)
    semana_cronograma = Column(Integer, nullable=True)
    data_inicio_prevista = Column(Date, nullable=True)
    data_fim_prevista = Column(Date, nullable=True)
    percentual_concluido = Column(Integer, default=0)
    status = Column(String(30), default="Não Iniciada")

    projeto = relationship("Projeto", back_populates="etapas")
    diarios = relationship("DiarioObraRDO", back_populates="etapa_obra")


class DiarioObraRDO(Base):
    __tablename__ = "diario_obra_rdo"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    etapa_obra_id = Column(String(36), ForeignKey("etapa_obra.id"), nullable=False)
    data_registro = Column(Date, default=date.today)
    condicoes_climaticas = Column(String(30), default="Bom")
    efetivo_pedreiros = Column(Integer, default=0)
    efetivo_ajudantes = Column(Integer, default=0)
    atividades_realizadas = Column(Text, nullable=False)
    ocorrencias_imprevistos = Column(Text, nullable=True)
    fotos_urls = Column(JSON, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    etapa_obra = relationship("EtapaObra", back_populates="diarios")
