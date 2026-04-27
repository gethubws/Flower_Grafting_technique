"""AI Gateway Configuration"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # SD Forge
    sd_base_url: str = "http://10.16.52.202:7860"
    use_real_sd: bool = False  # Phase 1: False = use placeholder

    # Redis (for BullMQ bridge)
    redis_url: str = "redis://localhost:6379"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "flowerlang"
    minio_secret_key: str = "flowerlang123"
    minio_bucket: str = "flowers"
    minio_secure: bool = False

    # Server
    port: int = 8000

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
