from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    postgres_url: str = "sqlite+aiosqlite:///./agriva.db"

    # API Keys
    groq_api_key: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
