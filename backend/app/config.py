import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """
    Application settings loaded from environment variables and dotenv file.
    """
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GCP_PROJECT: str = os.getenv("GCP_PROJECT", "")
    GCP_LOCATION: str = os.getenv("GCP_LOCATION", "us-central1")
    USE_VERTEX: bool = os.getenv("USE_VERTEX", "false").lower() == "true"
    
    # Absolute path to upload folder
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        "uploads"
    )

settings = Settings()

# Auto-create uploads directory if it does not exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
