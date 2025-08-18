"""
LLM Manager - Singleton instance for managing LLM service across the application.
"""

from typing import Optional
from .llm_service import LLMService
from .config import settings
import logging

logger = logging.getLogger(__name__)


class LLMManager:
    """Singleton manager for LLM service instance."""
    
    _instance: Optional['LLMManager'] = None
    _llm_service: Optional[LLMService] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def llm_service(self) -> LLMService:
        """Get or create LLM service instance."""
        if self._llm_service is None:
            self._llm_service = self._create_llm_service()
        return self._llm_service
    
    def _create_llm_service(self) -> LLMService:
        """Create LLM service with current configuration."""
        try:
            provider_configs = settings.llm_provider_configs
            
            if not provider_configs:
                logger.warning("No LLM providers configured")
                # Fallback configuration for testing
                provider_configs = {
                    "ollama": {"base_url": "http://localhost:11434"}
                }
            
            logger.info(f"Initializing LLM service with providers: {list(provider_configs.keys())}")
            return LLMService(provider_configs)
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            # Return a service with minimal configuration
            return LLMService({
                "ollama": {"base_url": "http://localhost:11434"}
            })
    
    def reload_service(self) -> None:
        """Reload LLM service with updated configuration."""
        logger.info("Reloading LLM service")
        self._llm_service = self._create_llm_service()
    
    def get_default_provider_model(self) -> str:
        """Get the default provider and model from settings."""
        provider = settings.LLM_PROVIDER
        model = settings.LLM_MODEL
        return f"{provider}/{model}"
    
    def get_configured_providers(self) -> list[str]:
        """Get list of configured providers."""
        return list(settings.llm_provider_configs.keys())
    
    async def health_check(self) -> dict:
        """Check health of configured LLM providers."""
        health_status = {}
        
        for provider_name in self.get_configured_providers():
            try:
                # Simple test message
                messages = [{"role": "user", "content": "Hello"}]
                response = await self.llm_service.chat_completion(
                    messages=messages,
                    provider_model=f"{provider_name}/",  # Use default model
                    max_tokens=10
                )
                health_status[provider_name] = {
                    "status": "healthy",
                    "model": response.model,
                    "provider": response.provider
                }
            except Exception as e:
                health_status[provider_name] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
        
        return health_status


# Global LLM manager instance
llm_manager = LLMManager()


def get_llm_service() -> LLMService:
    """Get the global LLM service instance."""
    return llm_manager.llm_service


def get_default_provider_model() -> str:
    """Get default provider/model configuration."""
    return llm_manager.get_default_provider_model()


async def make_llm_call(
    messages: list,
    provider_model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    **kwargs
):
    """
    Convenience function to make LLM calls with default settings.
    
    Args:
        messages: List of messages
        provider_model: Provider/model string, uses default if None
        temperature: Temperature setting, uses default if None
        max_tokens: Max tokens setting, uses default if None
        **kwargs: Additional parameters
    
    Returns:
        LLMResponse object
    """
    service = get_llm_service()
    
    # Use defaults from settings if not provided
    if provider_model is None:
        provider_model = get_default_provider_model()
    
    if temperature is None:
        temperature = settings.LLM_TEMPERATURE
    
    if max_tokens is None:
        max_tokens = settings.LLM_MAX_TOKENS
    
    return await service.chat_completion(
        messages=messages,
        provider_model=provider_model,
        temperature=temperature,
        max_tokens=max_tokens,
        **kwargs
    )