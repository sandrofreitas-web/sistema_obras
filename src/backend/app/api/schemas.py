from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FornecedorOut(BaseModel):
    id: int
    nome: str = Field(..., alias="nome")
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
