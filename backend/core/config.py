from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./data/interview.db"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OPENROUTER_API_KEY: Optional[str] = None
    MODEL_PROVIDER: str = "ollama"
    LOCAL_MODEL: Optional[str] = None
    ENABLE_ONLINE_SEARCH: bool = False
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()