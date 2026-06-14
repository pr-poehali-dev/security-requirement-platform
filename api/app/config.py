from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    DB_TYPE: Literal["postgresql", "sqlite"] = "sqlite"
    DATABASE_URL: str = "sqlite:///./secarch.db"

    # S3 / MinIO
    S3_ENDPOINT: str = "http://minio:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "secarch"
    S3_PUBLIC_URL: str = "http://localhost:9000/secarch"

    # Auth
    SECRET_KEY: str = "dev-secret-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8

    # App
    APP_TITLE: str = "SecureArch API"
    APP_VERSION: str = "1.0.0"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
