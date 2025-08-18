"""
Generic LLM Service with pluggable providers.
This module provides a unified interface for different LLM providers.

If optional provider dependencies are not installed, it will fall back to OpenAI-only mode.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union
from enum import Enum
import asyncio
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

# Check if we should use minimal mode (OpenAI only)
_USE_MINIMAL_MODE = False

def _check_optional_dependencies():
    """Check if optional dependencies are available."""
    global _USE_MINIMAL_MODE
    
    optional_deps = ['groq', 'google.generativeai', 'anthropic', 'ibm_watsonx_ai', 'aiohttp']
    missing_deps = []
    
    for dep in optional_deps:
        try:
            __import__(dep)
        except ImportError:
            missing_deps.append(dep)
    
    if missing_deps:
        logger.info(f"Optional LLM dependencies not found: {missing_deps}")
        logger.info("Using minimal mode with OpenAI support only")
        _USE_MINIMAL_MODE = True
        return False
    
    return True

# Check dependencies on module load
_check_optional_dependencies()


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    OLLAMA = "ollama"
    GROQ = "groq"
    GOOGLE = "google"
    ANTHROPIC = "anthropic"
    WATSONX = "watsonx"


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


class OllamaProvider(LLMProviderBase):
    """Ollama provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.base_url = config.get("base_url", "http://localhost:11434")
    
    def validate_config(self) -> bool:
        return True  # Ollama doesn't require API key
    
    def get_available_models(self) -> List[str]:
        return [
            "llama3", "llama3:70b", "llama2", "codellama",
            "mistral", "mixtral", "phi3", "gemma"
        ]
    
    async def chat_completion(self, request: LLMRequest) -> LLMResponse:
        try:
            try:
                import aiohttp
            except ImportError:
                raise ImportError("aiohttp package is required. Install with: pip install aiohttp")
            
            messages = [
                {"role": msg.role, "content": msg.content}
                for msg in request.messages
            ]
            
            payload = {
                "model": request.model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": request.temperature,
                    "num_predict": request.max_tokens
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                ) as response:
                    if response.status != 200:
                        raise Exception(f"Ollama API error: {response.status}")
                    
                    result = await response.json()
                    
                    return LLMResponse(
                        content=result["message"]["content"],
                        model=request.model,
                        provider="ollama",
                        metadata={"eval_count": result.get("eval_count")}
                    )
                    
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            raise


class GroqProvider(LLMProviderBase):
    """Groq provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        
        if not self.validate_config():
            raise ValueError("Groq configuration is invalid")
    
    def validate_config(self) -> bool:
        return bool(self.api_key)
    
    def get_available_models(self) -> List[str]:
        return [
            "mixtral-8x7b-32768", "llama2-70b-4096", "gemma-7b-it"
        ]
    
    async def chat_completion(self, request: LLMRequest) -> LLMResponse:
        try:
            try:
                from groq import AsyncGroq
            except ImportError:
                raise ImportError("Groq package is required. Install with: pip install groq")
            
            client = AsyncGroq(api_key=self.api_key)
            
            messages = [
                {"role": msg.role, "content": msg.content}
                for msg in request.messages
            ]
            
            response = await client.chat.completions.create(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )
            
            return LLMResponse(
                content=response.choices[0].message.content,
                model=request.model,
                provider="groq",
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                } if response.usage else None
            )
            
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise


class GoogleProvider(LLMProviderBase):
    """Google Gemini provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        
        if not self.validate_config():
            raise ValueError("Google configuration is invalid")
    
    def validate_config(self) -> bool:
        return bool(self.api_key)
    
    def get_available_models(self) -> List[str]:
        return [
            "gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"
        ]
    
    async def chat_completion(self, request: LLMRequest) -> LLMResponse:
        try:
            try:
                import google.generativeai as genai
            except ImportError:
                raise ImportError("Google Generative AI package is required. Install with: pip install google-generativeai")
            
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(request.model)
            
            # Convert messages to Google format
            chat_history = []
            user_message = ""
            
            for msg in request.messages:
                if msg.role == "system":
                    # Gemini doesn't have system role, prepend to user message
                    user_message = f"{msg.content}\n\n"
                elif msg.role == "user":
                    user_message += msg.content
                elif msg.role == "assistant":
                    chat_history.append({
                        "role": "model",
                        "parts": [msg.content]
                    })
            
            if chat_history:
                chat = model.start_chat(history=chat_history)
                response = await chat.send_message_async(
                    user_message,
                    generation_config=genai.types.GenerationConfig(
                        temperature=request.temperature,
                        max_output_tokens=request.max_tokens
                    )
                )
            else:
                response = await model.generate_content_async(
                    user_message,
                    generation_config=genai.types.GenerationConfig(
                        temperature=request.temperature,
                        max_output_tokens=request.max_tokens
                    )
                )
            
            return LLMResponse(
                content=response.text,
                model=request.model,
                provider="google"
            )
            
        except Exception as e:
            logger.error(f"Google API error: {e}")
            raise


class AnthropicProvider(LLMProviderBase):
    """Anthropic Claude provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        
        if not self.validate_config():
            raise ValueError("Anthropic configuration is invalid")
    
    def validate_config(self) -> bool:
        return bool(self.api_key)
    
    def get_available_models(self) -> List[str]:
        return [
            "claude-3-5-sonnet-20241022", "claude-3-opus-20240229",
            "claude-3-sonnet-20240229", "claude-3-haiku-20240307"
        ]
    
    async def chat_completion(self, request: LLMRequest) -> LLMResponse:
        try:
            try:
                import anthropic
            except ImportError:
                raise ImportError("Anthropic package is required. Install with: pip install anthropic")
            
            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            
            # Convert messages to Anthropic format
            system_message = ""
            messages = []
            
            for msg in request.messages:
                if msg.role == "system":
                    system_message = msg.content
                else:
                    messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
            
            response = await client.messages.create(
                model=request.model,
                system=system_message if system_message else None,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens or 1024
            )
            
            return LLMResponse(
                content=response.content[0].text,
                model=request.model,
                provider="anthropic",
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            )
            
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise


class WatsonxProvider(LLMProviderBase):
    """IBM Watsonx provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.url = config.get("url")
        self.project_id = config.get("project_id")
        
        if not self.validate_config():
            raise ValueError("Watsonx configuration is invalid")
    
    def validate_config(self) -> bool:
        return all([self.api_key, self.url, self.project_id])
    
    def get_available_models(self) -> List[str]:
        return [
            "ibm/granite-13b-instruct-v2", "meta-llama/llama-2-70b-chat",
            "mistralai/mixtral-8x7b-instruct-v01"
        ]
    
    async def chat_completion(self, request: LLMRequest) -> LLMResponse:
        try:
            try:
                from ibm_watsonx_ai.foundation_models import ModelInference
                from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
                from ibm_watsonx_ai.credentials import Credentials
            except ImportError:
                raise ImportError("IBM Watsonx AI package is required. Install with: pip install ibm-watsonx-ai")
            
            credentials = Credentials(
                url=self.url,
                api_key=self.api_key
            )
            
            # Convert messages to prompt format
            prompt = ""
            for msg in request.messages:
                if msg.role == "system":
                    prompt += f"System: {msg.content}\n\n"
                elif msg.role == "user":
                    prompt += f"User: {msg.content}\n\n"
                elif msg.role == "assistant":
                    prompt += f"Assistant: {msg.content}\n\n"
            
            prompt += "Assistant:"
            
            model = ModelInference(
                model_id=request.model,
                credentials=credentials,
                project_id=self.project_id,
                params={
                    GenParams.TEMPERATURE: request.temperature,
                    GenParams.MAX_NEW_TOKENS: request.max_tokens or 200,
                    GenParams.DECODING_METHOD: "greedy"
                }
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                model.generate_text,
                prompt
            )
            
            return LLMResponse(
                content=response,
                model=request.model,
                provider="watsonx"
            )
            
        except Exception as e:
            logger.error(f"Watsonx API error: {e}")
            raise


class LLMFactory:
    """Factory class to create LLM provider instances."""
    
    _providers = {
        LLMProvider.OPENAI: OpenAIProvider,
    }
    
    @classmethod
    def _register_available_providers(cls):
        """Register providers that have their dependencies available."""
        
        # Always available
        cls._providers[LLMProvider.OPENAI] = OpenAIProvider
        
        if _USE_MINIMAL_MODE:
            logger.info("Running in minimal mode - only OpenAI provider available")
            return
        
        # Check and register optional providers
        provider_checks = [
            (LLMProvider.OLLAMA, OllamaProvider, []),  # No external deps needed
            (LLMProvider.GROQ, GroqProvider, ['groq']),
            (LLMProvider.GOOGLE, GoogleProvider, ['google.generativeai']),
            (LLMProvider.ANTHROPIC, AnthropicProvider, ['anthropic']),
            (LLMProvider.WATSONX, WatsonxProvider, ['ibm_watsonx_ai'])
        ]
        
        for provider_enum, provider_class, deps in provider_checks:
            try:
                # Check dependencies
                for dep in deps:
                    __import__(dep)
                
                # If we get here, dependencies are available
                cls._providers[provider_enum] = provider_class
                logger.debug(f"Registered {provider_enum.value} provider")
                
            except ImportError as e:
                logger.debug(f"Skipping {provider_enum.value} provider: missing dependency - {e}")
                continue
    
    @classmethod
    def create_provider(cls, provider: LLMProvider, config: Dict[str, Any]) -> LLMProviderBase:
        """Create a provider instance."""
        # Ensure providers are registered
        if not hasattr(cls, '_registered'):
            cls._register_available_providers()
            cls._registered = True
        
        if provider not in cls._providers:
            available = list(cls._providers.keys())
            raise ValueError(f"Provider {provider} not available. Available providers: {available}")
        
        provider_class = cls._providers[provider]
        return provider_class(config)
    
    @classmethod
    def register_provider(cls, provider: LLMProvider, provider_class: type):
        """Register a new provider class."""
        cls._providers[provider] = provider_class
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of available providers."""
        # Ensure providers are registered
        if not hasattr(cls, '_registered'):
            cls._register_available_providers()
            cls._registered = True
        
        return [provider.value for provider in cls._providers.keys()]


class LLMService:
    """Main service class for LLM operations."""
    
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