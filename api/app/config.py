"""Application configuration via Pydantic Settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration is loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── Postgres ──
    pghost: str = "db"
    pgport: int = 5432
    pguser: str = "postgres"
    pgpassword: str = "unitest_dev_password"
    pgdatabase: str = "unitest"

    # ── Redis ──
    redis_url: str = "redis://redis:6379/0"

    # ── MinIO ──
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "unitest-uploads"
    minio_use_ssl: bool = False

    # ── API ──
    secret_key: str = "unitest_dev_secret_change_me_in_production"
    api_port: int = 8000
    debug: bool = True

    # ── Sessions ──
    session_idle_timeout: int = 1800  # 30 minutes
    session_absolute_timeout: int = 28800  # 8 hours

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.pguser}:{self.pgpassword}"
            f"@{self.pghost}:{self.pgport}/{self.pgdatabase}"
        )

    @property
    def database_url_sync(self) -> str:
        """Sync URL for Alembic migrations."""
        return (
            f"postgresql://{self.pguser}:{self.pgpassword}"
            f"@{self.pghost}:{self.pgport}/{self.pgdatabase}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
