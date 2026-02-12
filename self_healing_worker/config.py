from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Worker Configuration
    WORKER_ID: str = "worker-01"
    CHECK_INTERVAL_SECONDS: int = 15
    LOG_LEVEL: str = "INFO"

    # Redis Configuration
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None

    # Backend Configuration
    BACKEND_URL: str = "http://backend:8001"
    
    # Database Configuration (Optional)
    DATABASE_URL: Optional[str] = None  # e.g., postgresql://user:pass@db:5432/kalashi

    # MCP Configuration
    MCP_HEALTH_ENDPOINT: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
