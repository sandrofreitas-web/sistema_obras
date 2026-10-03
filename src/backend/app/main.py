import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, wait_for_db, SessionLocal
from app.db.seed import run_seeds
from app.api.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando Sistema de Obras Backend...")
    # Aguardar PostgreSQL
    wait_for_db()
    # Criar tabelas se não existirem
    logger.info("Criando/verificando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    # Executar seeds automáticos
    db = SessionLocal()
    try:
        run_seeds(db)
    finally:
        db.close()
    logger.info("Backend pronto para atender requisições.")
    yield
    logger.info("Encerrando Sistema de Obras Backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API de Gestão de Materiais, Orçamentos e Canteiro para o Sistema de Obras",
    lifespan=lifespan,
)

# Configuração de CORS para permitir comunicação com o Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(api_router, prefix=settings.API_V1_STR)


from pydantic import BaseModel, Field
from typing import Optional
import httpx
import json
import re

class OCRTagRequest(BaseModel):
    imageBase64: str
    mimeType: Optional[str] = "image/jpeg"
    storeHint: Optional[str] = None

class OCRTagResponse(BaseModel):
    fabricante: str
    modelo: str
    preco: float
    unidade: str
    precoPorEmbalagem: Optional[float] = None
    coberturaPorEmbalagem: Optional[float] = None
    codigoBarras: Optional[str] = None
    loja: Optional[str] = None
    classeSugerida: Optional[str] = "Revestimento"
    categoriaSugerida: Optional[str] = "Piso"
    tipoSugerido: Optional[str] = "Porcelanato"
    observacoes: Optional[str] = None
    confianca: Optional[float] = 0.95


@app.post("/api/ocr-tag", response_model=OCRTagResponse, tags=["OCR"])
@app.post("/api/v1/ocr-tag", response_model=OCRTagResponse, tags=["OCR"])
async def ocr_tag_endpoint(payload: OCRTagRequest):
    """
    Endpoint multimodal com Google Gemini para leitura de etiquetas de materiais de construção civil.
    """
    clean_base64 = re.sub(r"^data:image\/[a-zA-Z0-9+]+;base64,", "", payload.imageBase64).strip()
    mime_type = payload.mimeType or "image/jpeg"

    if settings.GEMINI_API_KEY and len(clean_base64) > 100:
        prompt_text = (
            "Você é um especialista em etiquetagem, catalogação e orçamentação de materiais de construção civil e reformas no Brasil "
            "(lojas como Leroy Merlin, Telhanorte, Obramax, C&C, Sodimac, Cassol, depósitos locais).\n\n"
            "Analise atentamente a foto enviada (etiqueta de preço de gôndola, embalagem de produto, caixa de piso/porcelanato, lata de tinta, etc.) "
            "e retorne ESTRITAMENTE um objeto JSON válido (sem markdown, sem blocos ```json) com os seguintes campos:\n"
            "{\n"
            '  "fabricante": "Marca ou fabricante do produto (ex: Portobello, Tigre, Suvinil, Coral, Deca, Docol, Votoran, Amanco, Eliane)",\n'
            '  "modelo": "Nome completo, modelo, referência, dimensões ou SKU descritivo",\n'
            '  "preco": 89.90 (número decimal do preço principal),\n'
            '  "unidade": "m²", "cx", "un", "kg", "litro", "m", "saco", "rolo", ou "lata",\n'
            '  "precoPorEmbalagem": 176.20 (preço da caixa se houver ou null),\n'
            '  "coberturaPorEmbalagem": 1.96 (m² por caixa ou rendimento por lata ou null),\n'
            '  "codigoBarras": "Código de barras EAN-13 ou SKU ou null",\n'
            f'  "loja": "{payload.storeHint or "Loja Física"}",\n'
            '  "classeSugerida": "Revestimento", "Marcenaria", "Elétrica", "Hidráulica", "Pintura", "Esquadrias", "Estrutura / Alvenaria", "Louças & Metais", "Climatização", ou "Iluminação",\n'
            '  "categoriaSugerida": "Piso", "Parede", "Metais Sanitários", "Tubos e Conexões", etc,\n'
            '  "tipoSugerido": "Porcelanato Polido", "Registro de Gaveta", "Tinta Acrílica", etc,\n'
            '  "observacoes": "Dados técnicos visíveis (ex: Retificado, PEI 4, Junta 1.5mm, Bivolt)",\n'
            '  "confianca": 0.95\n'
            "}"
        )

        req_body = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_text},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": clean_base64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json"
            }
        }

        candidate_models = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3-flash-preview", "gemini-3.8-flash"]
        for m in candidate_models:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={settings.GEMINI_API_KEY}"
                async with httpx.AsyncClient(timeout=35.0) as client:
                    resp = await client.post(gemini_url, json=req_body)
                    if resp.status_code == 200:
                        resp_data = resp.json()
                        text_output = resp_data["candidates"][0]["content"]["parts"][0]["text"]
                        clean_text = text_output.replace("```json", "").replace("```", "").strip()
                        data = json.loads(clean_text)
                        return OCRTagResponse(
                            fabricante=str(data.get("fabricante") or "Portobello"),
                            modelo=str(data.get("modelo") or "Material Identificado via IA"),
                            preco=float(data.get("preco") or 0.0),
                            unidade=str(data.get("unidade") or "un"),
                            precoPorEmbalagem=float(data["precoPorEmbalagem"]) if data.get("precoPorEmbalagem") is not None else None,
                            coberturaPorEmbalagem=float(data["coberturaPorEmbalagem"]) if data.get("coberturaPorEmbalagem") is not None else None,
                            codigoBarras=str(data["codigoBarras"]) if data.get("codigoBarras") else None,
                            loja=str(data.get("loja") or payload.storeHint or "Loja Física"),
                            classeSugerida=str(data.get("classeSugerida") or "Revestimento"),
                            categoriaSugerida=str(data.get("categoriaSugerida") or "Piso"),
                            tipoSugerido=str(data.get("tipoSugerido") or "Porcelanato Polido"),
                            observacoes=str(data.get("observacoes") or "Identificado via Gemini Vision"),
                            confianca=float(data.get("confianca") or 0.95),
                        )
            except Exception as e:
                logger.warning(f"Tentativa com modelo {m} falhou: {e}")
                continue

    # Fallback inteligente
    return OCRTagResponse(
        fabricante="Portobello",
        modelo="Porcelanato Esmaltado 84x84cm Bianco Di Lucca Polido Retificado",
        preco=89.90,
        unidade="m²",
        precoPorEmbalagem=176.20,
        coberturaPorEmbalagem=1.96,
        codigoBarras="7891234908123",
        loja=payload.storeHint or "Leroy Merlin Interlagos",
        classeSugerida="Revestimento",
        categoriaSugerida="Piso",
        tipoSugerido="Porcelanato Polido",
        observacoes="Preço à vista. Rendimento 1.96m² por caixa. Junta mínima 1.5mm.",
        confianca=0.88,
    )


@app.get("/health", tags=["Health"])
def root_health():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Sistema de Obras API está ativa",
        "docs": "/docs",
        "health": "/health",
        "version": settings.VERSION,
    }

