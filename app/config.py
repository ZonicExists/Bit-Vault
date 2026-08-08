import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PORT: int = 4000
    HOST: str = "127.0.0.1"
    NODE_ENV: str = "development"

    DB_PATH: str = "./data/vault.sqlite"
    STORAGE_DIR: str = "./data/uploads"
    VAULT_FILE_PATH: str = "./data/storage.vault"

    PBKDF2_ITERATIONS: int = 100000
    KEY_LENGTH_BYTES: int = 32
    SALT_LENGTH_BYTES: int = 16
    IV_LENGTH_BYTES: int = 12
    AUTH_TAG_LENGTH_BYTES: int = 16

    AUTO_LOCK_DEFAULT_MINUTES: int = 15
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
