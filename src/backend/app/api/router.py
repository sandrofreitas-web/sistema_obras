from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

from app.api.endpoints.suprimentos import router as suprimentos_router
from app.api.endpoints.projetos import router as projetos_router
from app.api.endpoints.plantas import router as plantas_router
from app.api.endpoints.financeiro import router as financeiro_router
from app.api.endpoints.ia import router as ia_router
from app.api.endpoints.webhooks import router as webhooks_router
from app.api.endpoints.impressoes import router as impressoes_router

api_router = APIRouter()


@api_router.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    return {
        "status": "healthy",
        "service": "Sistema de Obras API v2.0",
        "database": "connected",
        "arquitetura": "Modular (Suprimentos, Projetos, Plantas, Financeiro, IA, Webhooks, Impressões)",
    }


# Inclusão dos roteadores modulares especializados (com e sem prefixo para compatibilidade total)
api_router.include_router(suprimentos_router, tags=["Suprimentos & Catálogo"])
api_router.include_router(suprimentos_router, prefix="/suprimentos", tags=["Suprimentos & Catálogo"])

api_router.include_router(projetos_router, tags=["Projetos & Canteiro"])

api_router.include_router(plantas_router, tags=["Plantas & Versionamento"])
api_router.include_router(plantas_router, prefix="/plantas", tags=["Plantas & Versionamento"])

api_router.include_router(financeiro_router, tags=["Financeiro & Compras Reais"])
api_router.include_router(financeiro_router, prefix="/financeiro", tags=["Financeiro & Compras Reais"])

api_router.include_router(ia_router, tags=["Inteligência Artificial & Dimensionamento"])
api_router.include_router(ia_router, prefix="/ia", tags=["Inteligência Artificial & Dimensionamento"])

api_router.include_router(webhooks_router, tags=["Webhooks & N8N / WhatsApp"])
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["Webhooks & N8N / WhatsApp"])

api_router.include_router(impressoes_router, tags=["Impressões & Balcão A4"])
api_router.include_router(impressoes_router, prefix="/impressoes", tags=["Impressões & Balcão A4"])

