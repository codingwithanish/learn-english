# LLM Integration Guide

## Overview

The Learn English backend now supports multiple LLM providers through a flexible, configurable architecture. This allows you to switch between different AI providers based on your needs, costs, and availability.

## Supported Providers

- **OpenAI**: GPT-4, GPT-3.5-turbo, and other OpenAI models
- **Ollama**: Local LLM hosting with models like Llama3, Mistral, etc.
- **Groq**: Fast inference with Mixtral, Llama2, and Gemma models
- **Google**: Gemini models (Pro, Flash, etc.)
- **Anthropic**: Claude models (Sonnet, Opus, Haiku)
- **IBM Watsonx**: Enterprise AI models

## Environment Configuration

### Basic Configuration

Add these environment variables to your `.env` file:

```bash
# Default LLM Settings
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500

# Provider API Keys (add only the ones you want to use)
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
GOOGLE_API_KEY=your-google-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# IBM Watsonx (enterprise)
WATSONX_API_KEY=your-watsonx-api-key
WATSONX_HOST_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=your-project-id

# Ollama (local hosting)
OLLAMA_BASE_URL=http://localhost:11434
```

### Provider-Specific Setup

#### OpenAI
1. Get API key from https://platform.openai.com/
2. Set `OPENAI_API_KEY` in environment

#### Ollama (Local)
1. Install Ollama: https://ollama.ai/
2. Pull models: `ollama pull llama3`
3. Set `OLLAMA_BASE_URL` (default: http://localhost:11434)

#### Groq
1. Get API key from https://console.groq.com/
2. Set `GROQ_API_KEY` in environment

#### Google Gemini
1. Get API key from https://makersuite.google.com/
2. Set `GOOGLE_API_KEY` in environment

#### Anthropic Claude
1. Get API key from https://console.anthropic.com/
2. Set `ANTHROPIC_API_KEY` in environment

## Usage Examples

### Basic Usage (using default provider)

```python
from app.core.llm_manager import make_llm_call

# Simple chat completion
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Explain the word 'serendipity'"}
]

response = await make_llm_call(messages)
print(response.content)  # AI response
print(response.provider)  # Provider used
print(response.model)    # Model used
```

### Using Specific Providers

```python
from app.core.llm_manager import make_llm_call

# Use specific provider/model
response = await make_llm_call(
    messages=messages,
    provider_model="groq/mixtral-8x7b-32768",
    temperature=0.5,
    max_tokens=200
)

# Use Ollama local model
response = await make_llm_call(
    messages=messages,
    provider_model="ollama/llama3",
    temperature=0.7
)

# Use Google Gemini
response = await make_llm_call(
    messages=messages,
    provider_model="google/gemini-1.5-pro"
)
```

### Updated NLP Service Usage

```python
from app.services.nlp_service import NLPService

# Use default provider
query_type = await NLPService.detect_query_type("Hello world")

# Use specific provider
query_type = await NLPService.detect_query_type(
    "Hello world", 
    provider_model="groq/mixtral-8x7b-32768"
)

# Process text with specific provider
result = await NLPService.process_text_query(
    query="serendipity",
    query_type=ResourceType.VOCABULARY,
    provider_model="anthropic/claude-3-sonnet-20240229"
)

# Evaluate speech with specific provider
evaluation = await NLPService.evaluate_speech(
    transcript="Hello, my name is John...",
    reference_topic="Introduction",
    provider_model="openai/gpt-4"
)
```

## API Endpoints for LLM Management

### Check Available Providers

```bash
GET /api/llm/providers
```

Response:
```json
[
  {
    "name": "openai",
    "status": "available",
    "available_models": ["gpt-4", "gpt-3.5-turbo"],
    "error": null
  },
  {
    "name": "ollama",
    "status": "available", 
    "available_models": ["llama3", "mistral"],
    "error": null
  }
]
```

### Health Check

```bash
GET /api/llm/health
```

Response:
```json
{
  "status": "ok",
  "providers": {
    "openai": {
      "status": "healthy",
      "model": "gpt-3.5-turbo",
      "provider": "openai"
    },
    "ollama": {
      "status": "unhealthy",
      "error": "Connection refused"
    }
  },
  "default_provider": "openai/gpt-3.5-turbo"
}
```

### Test Provider

```bash
POST /api/llm/test
```

Request:
```json
{
  "provider_model": "groq/mixtral-8x7b-32768",
  "message": "What is machine learning?",
  "temperature": 0.7,
  "max_tokens": 100
}
```

Response:
```json
{
  "success": true,
  "content": "Machine learning is a subset of artificial intelligence...",
  "model": "mixtral-8x7b-32768",
  "provider": "groq",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 87,
    "total_tokens": 102
  }
}
```

### Get Current Configuration

```bash
GET /api/llm/config
```

Response:
```json
{
  "default_provider": "openai",
  "default_model": "gpt-3.5-turbo", 
  "temperature": 0.7,
  "max_tokens": 500,
  "configured_providers": ["openai", "ollama", "groq"]
}
```

## Provider Comparison

| Provider | Speed | Cost | Quality | Use Case |
|----------|-------|------|---------|----------|
| OpenAI | Medium | High | Excellent | Production, high quality |
| Groq | Very Fast | Medium | Good | Real-time applications |
| Ollama | Fast | Free | Good | Development, privacy |
| Google | Medium | Low | Good | Cost-effective production |
| Anthropic | Medium | High | Excellent | Safety-critical applications |
| Watsonx | Medium | High | Good | Enterprise compliance |

## Error Handling

The system includes robust error handling:

1. **Provider Fallback**: If one provider fails, you can manually specify another
2. **Graceful Degradation**: Failed providers are marked as unhealthy but don't crash the app
3. **Detailed Error Logging**: All errors are logged with context
4. **Health Monitoring**: Regular health checks for all providers

## Migration from Old Code

### Before (Direct OpenAI)
```python
import openai

response = await openai.ChatCompletion.acreate(
    model="gpt-3.5-turbo",
    messages=messages
)
```

### After (Generic LLM)
```python
from app.core.llm_manager import make_llm_call

response = await make_llm_call(
    messages=messages,
    provider_model="openai/gpt-3.5-turbo"  # or any other provider
)
```

## Best Practices

1. **Use Environment Variables**: Configure providers via environment variables
2. **Handle Errors Gracefully**: Always wrap LLM calls in try-catch blocks
3. **Monitor Usage**: Track which providers are being used and their performance
4. **Cost Management**: Use cheaper providers for development, premium for production
5. **Test Regularly**: Use health check endpoints to monitor provider status
6. **Fallback Strategy**: Have backup providers configured

## Development vs Production

### Development
```bash
LLM_PROVIDER=ollama
LLM_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434
```

### Production
```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=your-production-key
```

## Adding New Providers

To add a new LLM provider:

1. Create a new provider class in `llm_service.py` inheriting from `LLMProviderBase`
2. Implement required methods: `chat_completion`, `validate_config`, `get_available_models`
3. Register the provider in `LLMFactory._providers`
4. Add configuration in `config.py`
5. Update documentation

Example:
```python
class MyCustomProvider(LLMProviderBase):
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        # Provider initialization
    
    async def chat_completion(self, request: LLMRequest) -> LLMResponse:
        # Implementation
        pass
    
    def validate_config(self) -> bool:
        # Validation logic
        return True
    
    def get_available_models(self) -> List[str]:
        return ["model1", "model2"]

# Register the provider
LLMFactory.register_provider(LLMProvider.CUSTOM, MyCustomProvider)
```