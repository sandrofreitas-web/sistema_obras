from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema de Obras"
    VERSION: str = "1.2.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql+psycopg2://obras_user:obras_secure_pass_2026@db:5432/obras_db"
    
    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"
    GEMINI_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
