from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date


# ============================================================================
# SUPRIMENTOS E CATÁLOGO
# ============================================================================

class FornecedorOut(BaseModel):
    id: int
    nome: str
    tipo_parceiro: Optional[str] = None
    especialidade: Optional[str] = None
    historico_compras_2024: float = 0.0
    status: str = "Homologado"
    telefone_contato: Optional[str] = None

    class Config:
        populate_by_name = True


class PrecoCapturaOut(BaseModel):
    id: str
    material_id: str
    fornecedor_id: int
    fornecedor_nome: Optional[str] = None
    preco_vista: float
    preco_prazo: Optional[float] = None
    data_captura: datetime
    foto_etiqueta_url: Optional[str] = None


class MaterialOut(BaseModel):
    id: str
    descricao: str
    fabricante: Optional[str] = None
    modelo_sku: Optional[str] = None
    categoria_id: Optional[int] = None
    categoria_classe: Optional[str] = None
    categoria_tipo: Optional[str] = None
    unidade_venda: str
    fator_embalagem: float
    foto_referencia_url: Optional[str] = None
    ultimo_preco_vista: Optional[float] = None
    ultimo_preco_prazo: Optional[float] = None
    ultima_loja: Optional[str] = None
    data_ultima_captura: Optional[datetime] = None


class CapturaCompletaIn(BaseModel):
    fornecedor_id: int
    descricao: str
    fabricante: Optional[str] = None
    modelo_sku: Optional[str] = None
    categoria_id: Optional[int] = None
    unidade_venda: str = "un"
    fator_embalagem: float = 1.0
    preco_vista: float
    preco_prazo: Optional[float] = None
    foto_etiqueta_url: Optional[str] = None


class OCRAnaliseRequest(BaseModel):
    imagem_base64: Optional[str] = None
    texto_bruto: Optional[str] = None
    loja_sugerida: Optional[str] = None


class OCRAnaliseResponse(BaseModel):
    descricao: str
    fabricante: Optional[str] = None
    modelo_sku: Optional[str] = None
    unidade_venda: str
    fator_embalagem: float
    preco_vista: float
    preco_prazo: Optional[float] = None
    categoria_sugerida_id: Optional[int] = None
    loja_detectada: Optional[str] = None
    loja_detectada_id: Optional[int] = None
    confianca_ocr: float
    observacoes: Optional[str] = None


# ============================================================================
# PLANTAS E VERSIONAMENTO
# ============================================================================

class VersaoPlantaIn(BaseModel):
    revisao: str  # ex: "R01"
    autor_arquiteto: Optional[str] = "Arquiteto"
    aprovador_gestor: Optional[str] = None
    arquivo_pdf_url: Optional[str] = None
    notas_alteracao: Optional[str] = None
    metadados_extracao: Optional[Dict[str, Any]] = None


class VersaoPlantaOut(BaseModel):
    id: str
    planta_id: str
    revisao: str
    data_emissao: date
    autor_arquiteto: Optional[str] = None
    aprovador_gestor: Optional[str] = None
    status: str
    arquivo_pdf_url: Optional[str] = None
    notas_alteracao: Optional[str] = None
    metadados_extracao: Optional[Dict[str, Any]] = None
    criado_em: datetime


class PlantaIn(BaseModel):
    projeto_id: str
    codigo_prancha: str  # ex: "ARQ-01"
    titulo: str
    disciplina: str = "Arquitetura"
    arquivo_url: Optional[str] = None
    revisao_inicial: Optional[str] = "R00"
    notas_alteracao: Optional[str] = "Emissão inicial"


class PlantaOut(BaseModel):
    id: str
    projeto_id: str
    codigo_prancha: str
    titulo: str
    disciplina: str
    arquivo_url: Optional[str] = None
    criado_em: datetime
    versoes: List[VersaoPlantaOut] = []


# ============================================================================
# FINANCEIRO E COMPRAS
# ============================================================================

class ParcelaOut(BaseModel):
    id: str
    numero_parcela: int
    data_vencimento: date
    valor_parcela: float
    data_pagamento_efetivo: Optional[date] = None
    status: str


class ItemCompraIn(BaseModel):
    material_id: str
    qtd_comprada: float
    preco_unitario_real: float
    item_projeto_id: Optional[str] = None


class CompraIn(BaseModel):
    projeto_id: Optional[str] = None
    fornecedor_id: int
    numero_nf: Optional[str] = None
    data_compra: date = Field(default_factory=date.today)
    valor_total: float
    valor_frete: float = 0.0
    valor_desconto_geral: float = 0.0
    forma_pagamento: str = "Cartao Credito"
    quantidade_parcelas: int = 1
    foto_nf_url: Optional[str] = None
    observacoes: Optional[str] = None
    itens: Optional[List[ItemCompraIn]] = []


class CompraOut(BaseModel):
    id: str
    projeto_id: Optional[str] = None
    fornecedor_id: int
    fornecedor_nome: Optional[str] = None
    numero_nf: Optional[str] = None
    data_compra: date
    valor_total: float
    valor_frete: float
    valor_desconto_geral: float
    forma_pagamento: str
    quantidade_parcelas: int
    foto_nf_url: Optional[str] = None
    observacoes: Optional[str] = None
    parcelas: List[ParcelaOut] = []


class ItemNotaFiscalExtraido(BaseModel):
    id: Optional[str] = None
    descricao: str
    quantidade: float = 1.0
    unidade: str = "un"
    valor_unitario: float = 0.0
    valor_total: float = 0.0
    codigo_produto: Optional[str] = None
    ncm: Optional[str] = None
    categoria_sugerida: Optional[str] = "Materiais"
    item_projeto_id_sugerido: Optional[str] = None
    item_projeto_nome_sugerido: Optional[str] = None
    confianca_matching: Optional[float] = 0.0


class IngestaoNotaFiscalResponse(BaseModel):
    sucesso: bool = True
    metodo_extracao: str = "ia_multimodal"  # "xml_sefaz" | "ia_multimodal" | "fallback"
    fornecedor_nome: str
    cnpj: Optional[str] = None
    numero_nf: Optional[str] = None
    serie: Optional[str] = None
    chave_acesso: Optional[str] = None
    data_compra: str  # YYYY-MM-DD
    valor_total: float
    valor_frete: float = 0.0
    valor_desconto: float = 0.0
    forma_pagamento_sugerida: str = "cartao_credito"
    itens: List[ItemNotaFiscalExtraido] = []
    confianca_geral: float = 0.95
    observacoes: Optional[str] = None
    arquivo_nome: Optional[str] = None


class ConfirmarIngestaoNFIn(BaseModel):
    projeto_id: str
    fornecedor_nome: str
    cnpj: Optional[str] = None
    numero_nf: Optional[str] = None
    data_compra: date = Field(default_factory=date.today)
    valor_total: float
    valor_frete: float = 0.0
    valor_desconto_geral: float = 0.0
    forma_pagamento: str = "Cartao Credito"
    quantidade_parcelas: int = 1
    observacoes: Optional[str] = None
    itens: List[ItemNotaFiscalExtraido] = []


# ============================================================================
# REQUISIÇÕES DE CAMPO (N8N / WHATSAPP / MENSAGENS)
# ============================================================================

class RequisicaoMensagemIn(BaseModel):
    projeto_id: Optional[str] = None
    remetente_nome: str = "Wagner (Mestre de Obras)"
    canal: str = "WhatsApp / N8N"
    texto_mensagem: str
    audio_url: Optional[str] = None


class ItemRequisicaoOut(BaseModel):
    descricao_informal: str
    qtd_solicitada: float
    unidade_solicitada: str
    material_sugerido_id: Optional[str] = None
    material_sugerido_nome: Optional[str] = None
    fabricante_sugerido: Optional[str] = None
    loja_sugerida_id: Optional[int] = None
    loja_sugerida_nome: Optional[str] = None
    preco_referencia: Optional[float] = None
    subtotal_estimado: Optional[float] = None


class RequisicaoMensagemResponse(BaseModel):
    requisicao_id: str
    status: str
    remetente: str
    texto_original: str
    total_itens: int
    itens: List[ItemRequisicaoOut]
    mensagem_whatsapp_formatada: str


# ============================================================================
# DIMENSIONAMENTO POR IA
# ============================================================================

class DimensionarAmbienteIn(BaseModel):
    tipo_ambiente: str = "banheiro"  # banheiro, quarto, fachada, etc
    area_piso: float
    area_parede: float
    perimetro: Optional[float] = None
    pe_direito: Optional[float] = 2.70
    cenario_estilo: Optional[str] = "standard"  # standard, premium
    pontos_hidraulica: Optional[int] = 4
    pontos_eletrica: Optional[int] = 3


class ItemBOM(BaseModel):
    descricao: str
    categoria: str
    fabricante_sugerido: str
    qtd_liquida: float
    margem_perda_pct: float
    qtd_bruta_calculada: float
    unidade: str
    fator_embalagem: float
    qtd_embalagem_fechada: int
    unidade_embalagem: str
    preco_unitario_estimado: float
    subtotal_estimado: float
    loja_sugerida: str


class DimensionarAmbienteOut(BaseModel):
    ambiente: str
    area_piso: float
    area_parede: float
    cenario: str
    total_itens_calculados: int
    custo_total_estimado: float
    itens: List[ItemBOM]
