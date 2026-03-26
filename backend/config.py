"""Configuration helpers for the backend service."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""

    app_name: str
    api_prefix: str
    host: str
    port: int
    reload: bool
    cors_origins: list[str]
    openai_api_key: str | None
    openai_text_model: str
    sqlite_db_path: Path


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Load and cache environment-backed settings."""
    cors_origins = os.getenv("CORS_ORIGINS", "*")
    db_path = os.getenv("SQLITE_DB_PATH", str(BASE_DIR / "metrics.db"))

    return Settings(
        app_name=os.getenv("APP_NAME", "PromptLens Backend"),
        api_prefix=os.getenv("API_PREFIX", "/api"),
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=_parse_bool(os.getenv("RELOAD"), default=False),
        cors_origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()] or ["*"],
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_text_model=os.getenv("OPENAI_TEXT_MODEL", "gpt-4.1-mini"),
        sqlite_db_path=Path(db_path),
    )
