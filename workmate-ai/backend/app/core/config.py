import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Resolve paths relative to this file
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_file = os.path.join(base_dir, ".env")
load_dotenv(env_file)

class Settings(BaseSettings):
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/workmate_ai")
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")
    AZURE_OPENAI_CHAT_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "gpt-4o")
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    UPLOAD_DIR: str = os.path.join(base_dir, "uploads")

    @property
    def use_mock_ai(self) -> bool:
        return not (self.AZURE_OPENAI_API_KEY and self.AZURE_OPENAI_ENDPOINT)

    @property
    def use_mock_whisper(self) -> bool:
        return not self.OPENAI_API_KEY

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
