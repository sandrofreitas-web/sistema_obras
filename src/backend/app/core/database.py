import time
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def wait_for_db(max_retries=10, delay=2):
    for i in range(max_retries):
        try:
            with engine.connect() as conn:
                logger.info("Conexão com PostgreSQL estabelecida com sucesso.")
                return True
        except Exception as e:
            logger.warning(f"Aguardando banco de dados... ({i+1}/{max_retries}): {e}")
            time.sleep(delay)
    raise RuntimeError("Não foi possível conectar ao PostgreSQL após múltiplas tentativas.")
