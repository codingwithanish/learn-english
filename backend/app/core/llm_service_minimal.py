"""
Minimal LLM Service - OpenAI only version for basic functionality.
Use this if you don't want to install all the optional provider dependencies.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from enum import Enum
import asyncio
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers (minimal version)."""
    OPENAI = "openai"


@dataclass
class LLMMessage:
    """Standard message format for LLM communication."""
    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class LLMRequest:
    """Standard request format for LLM calls."""
    messages: List[LLMMessage]
    model: str
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    stream: bool = False
    extra_params: Optional[Dict[str, Any]] = None


@dataclass
class LLMResponse:
    """Standard response format from LLM providers."""
    content: str
    model: str
    provider: str
    usage: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class LLMProviderBase(ABC):
    """Abstract base class for LLM providers."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.provider_name = self.__class__.__name__.lower().replace('provider', '')
    
    @abstractmethod
    async def chat_completion(self, request: LLMRequest) -> LLMResponse:
        """Generate a chat completion response."""
        pass
    
    @abstractmethod
    def validate_config(self) -> bool:
        """Validate provider configuration."""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """Get list of available models for this provider."""
        pass


class OpenAIProvider(LLMProviderBase):
    """OpenAI provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.base_url = config.get("base_url", "https://api.openai.com/v1")
        
        if not self.validate_config():
            raise ValueError("OpenAI configuration is invalid")
    
    def validate_config(self) -> bool:
        return bool(self.api_key)
    
    def get_available_models(self) -> List[str]:
        return [
            "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini",
            "gpt-3.5-turbo", "gpt-3.5-turbo-16k"
        ]
    
    async def chat_completion(self, request: LLMRequest) -> LLMResponse:
        try:
            try:
                import openai
            except ImportError:
                raise ImportError("OpenAI package is required. Install with: pip install openai")
            
            client = openai.AsyncOpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
            
            # Convert our standard format to OpenAI format
            messages = [
                {"role": msg.role, "content": msg.content} 
                for msg in request.messages
            ]
            
            response = await client.chat.completions.create(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                stream=request.stream
            )
            
            return LLMResponse(
                content=response.choices[0].message.content,
                model=request.model,
                provider="openai",
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                } if response.usage else None
            )
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise


class LLMFactory:
    """Factory class to create LLM provider instances (minimal version)."""
    
    _providers = {
        LLMProvider.OPENAI: OpenAIProvider,
    }
    
    @classmethod
    def create_provider(cls, provider: LLMProvider, config: Dict[str, Any]) -> LLMProviderBase:
        """Create a provider instance."""
        if provider not in cls._providers:
            raise ValueError(f"Unsupported provider: {provider}")
        
        provider_class = cls._providers[provider]
        return provider_class(config)
    
    @classmethod
    def register_provider(cls, provider: LLMProvider, provider_class: type):
        """Register a new provider class."""
        cls._providers[provider] = provider_class
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of available providers."""
        return [provider.value for provider in cls._providers.keys()]


class LLMService:
    """Main service class for LLM operations (minimal version)."""
    
    def __init__(self, provider_configs: Dict[str, Dict[str, Any]]):
        self.provider_configs = provider_configs
        self._providers: Dict[str, LLMProviderBase] = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize provider instances from configuration."""
        for provider_name, config in self.provider_configs.items():
            try:
                provider_enum = LLMProvider(provider_name)
                provider_instance = LLMFactory.create_provider(provider_enum, config)
                self._providers[provider_name] = provider_instance
                logger.info(f"Initialized {provider_name} provider")
            except Exception as e:
                logger.warning(f"Failed to initialize {provider_name} provider: {e}")
    
    def get_provider(self, provider_model: str) -> tuple[LLMProviderBase, str]:
        """
        Parse provider/model string and return provider instance and model.
        
        Args:
            provider_model: String in format 'provider/model' or 'provider'
            
        Returns:
            Tuple of (provider_instance, model_name)
        """
        if '/' in provider_model:
            provider_name, model = provider_model.split('/', 1)
        else:
            provider_name = provider_model
            model = None
        
        provider_name = provider_name.lower()
        
        if provider_name not in self._providers:
            raise ValueError(f"Provider '{provider_name}' not configured or available")
        
        provider = self._providers[provider_name]
        
        # Use default model if not specified
        if not model:
            available_models = provider.get_available_models()
            if not available_models:
                raise ValueError(f"No models available for provider '{provider_name}'")
            model = available_models[0]  # Use first available model as default
        
        return provider, model
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]] | List[LLMMessage],
        provider_model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate a chat completion using specified provider and model.
        
        Args:
            messages: List of messages in format [{"role": "user", "content": "..."}]
            provider_model: Provider and model in format 'provider/model'
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters
            
        Returns:
            LLMResponse with generated content
        """
        provider, model = self.get_provider(provider_model)
        
        # Convert dict messages to LLMMessage objects if needed
        if messages and isinstance(messages[0], dict):
            llm_messages = [
                LLMMessage(role=msg["role"], content=msg["content"])
                for msg in messages
            ]
        else:
            llm_messages = messages
        
        request = LLMRequest(
            messages=llm_messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            extra_params=kwargs if kwargs else None
        )
        
        return await provider.chat_completion(request)
    
    def get_available_providers(self) -> List[str]:
        """Get list of configured and available providers."""
        return list(self._providers.keys())
    
    def get_available_models(self, provider_name: str) -> List[str]:
        """Get available models for a specific provider."""
        if provider_name not in self._providers:
            raise ValueError(f"Provider '{provider_name}' not available")
        
        return self._providers[provider_name].get_available_models()