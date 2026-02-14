from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    google_cloud_api: str = ""

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    gemini_model: str = "gemini-2.0-flash"

    tavily_api_key: str = ""

    google_application_credentials: str = ""
    gcp_project_id: str = ""
    gcp_bucket_name: str = ""
    imagen_model: str = "imagen-4.0-generate-001"

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "lumina"

    chroma_api_key: str = ""
    chroma_tenant: str = ""
    chroma_database: str = ""
    chroma_collection: str = "lumina_documents"

    serpapi_key: str = "" 
    firecrawl_api_key: str = ""  

    jobspy_enabled: bool = True
    jobspy_sites: str = "linkedin,indeed,naukri"
    jobspy_proxies: str = ""
    jobspy_results_wanted: int = 20
    jobspy_hours_old: int = 168
    jobspy_country_indeed: str = "India"

    unsplash_access_key: str = ""

    # LiveKit & Simli
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_url: str = ""
    
    beyond_presence_api_key: str = ""
    beyond_presence_face_id: str = ""

    # Google Cloud & GCP Bucket
    
    debug: bool = False

    express_url: str = "http://localhost:3002"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
