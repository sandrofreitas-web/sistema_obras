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
