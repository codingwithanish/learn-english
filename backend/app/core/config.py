import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/learn_english"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-here"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    
    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "learn-english-audio"
    
    # External APIs
    OPENAI_API_KEY: str = ""
    
    # LLM Configuration
    LLM_PROVIDER: str = "openai"  # Default provider
    LLM_MODEL: str = "gpt-3.5-turbo"  # Default model
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 500
    
    # Additional LLM Provider API Keys
    GROQ_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    WATSONX_API_KEY: str = ""
    WATSONX_HOST_URL: str = ""
    WATSONX_PROJECT_ID: str = ""
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # CORS
    ALLOWED_HOSTS: str = "http://localhost:3000,http://localhost:3001"
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """Parse ALLOWED_HOSTS string into list"""
        if isinstance(self.ALLOWED_HOSTS, str):
            return [host.strip() for host in self.ALLOWED_HOSTS.split(',')]
        return self.ALLOWED_HOSTS
    
    @property
    def llm_provider_configs(self) -> dict:
        """Build LLM provider configurations from environment variables"""
        configs = {}
        
        # OpenAI configuration
        if self.OPENAI_API_KEY:
            configs["openai"] = {
                "api_key": self.OPENAI_API_KEY,
                "base_url": "https://api.openai.com/v1"
            }
        
        # Groq configuration
        if self.GROQ_API_KEY:
            configs["groq"] = {
                "api_key": self.GROQ_API_KEY
            }
        
        # Google configuration
        if self.GOOGLE_API_KEY:
            configs["google"] = {
                "api_key": self.GOOGLE_API_KEY
            }
        
        # Anthropic configuration
        if self.ANTHROPIC_API_KEY:
            configs["anthropic"] = {
                "api_key": self.ANTHROPIC_API_KEY
            }
        
        # Watsonx configuration
        if all([self.WATSONX_API_KEY, self.WATSONX_HOST_URL, self.WATSONX_PROJECT_ID]):
            configs["watsonx"] = {
                "api_key": self.WATSONX_API_KEY,
                "url": self.WATSONX_HOST_URL,
                "project_id": self.WATSONX_PROJECT_ID
            }
        
        # Ollama configuration (always available as it doesn't require API key)
        configs["ollama"] = {
            "base_url": self.OLLAMA_BASE_URL
        }
        
        return configs
    
    # Task System Configuration
    TASK_EXECUTOR: str = "background"  # background, hybrid, celery
    ENABLE_CELERY: bool = False
    HEAVY_TASKS: str = "process_speak_audio,calculate_all_ratings,sync_impressions_from_redis"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables like PYTHONPATH


settings = Settings()