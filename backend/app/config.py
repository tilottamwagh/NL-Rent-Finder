from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/nlrentfinder"
    REDIS_URL: str = "redis://localhost:6379"

    # AI Provider
    AI_PROVIDER: str = "openai"
    AI_MODEL: str = "gpt-4o-mini"
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: Optional[str] = "http://localhost:11434"

    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHANNEL_IDS: str = ""

    # App
    SECRET_KEY: str = "change-me-in-production"
    FRONTEND_URL: str = "https://nlrentfinder.tilottamwagh.com"
    API_URL: str = "https://api.nlrentfinder.tilottamwagh.com"
    SCRAPE_INTERVAL_HOURS: int = 2
    SERVICE_FEE_EUR: int = 50
    PAYPAL_LINK: str = ""
    PAYPAL_NAME: str = ""
    LISTING_EXPIRY_DAYS: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
