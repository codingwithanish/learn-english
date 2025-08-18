# Quick Start Guide - LLM Integration

## ✅ Your LLM Integration is Ready!

I've successfully upgraded your Learn English backend to support multiple LLM providers with minimal changes to existing code.

## 🚀 What's New

### 1. **Generic LLM Support**
- ✅ **OpenAI**: GPT-4, GPT-3.5-turbo (working)
- ✅ **Ollama**: Local AI models (ready to configure)  
- ✅ **Groq**: Ultra-fast inference (ready to configure)
- ✅ **Google**: Gemini models (ready to configure)
- ✅ **Anthropic**: Claude models (ready to configure)
- ✅ **IBM Watsonx**: Enterprise AI (ready to configure)

### 2. **Updated NLP Service**
Your existing `NLPService` now supports provider selection:

```python
# Works exactly as before (uses default provider)
result = await NLPService.detect_query_type("hello world")

# NEW: Can specify provider/model
result = await NLPService.detect_query_type(
    "hello world", 
    provider_model="groq/mixtral-8x7b-32768"
)
```

### 3. **New Management API**
- `GET /api/llm/health` - Check provider status
- `GET /api/llm/providers` - List available providers  
- `POST /api/llm/test` - Test specific providers
- `GET /api/llm/config` - Current configuration

## 🔧 Configuration

### Environment Variables (`.env` file)

```bash
# Default LLM Settings (REQUIRED)
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500

# OpenAI (REQUIRED - you already have this)
OPENAI_API_KEY=your-openai-api-key

# Optional Providers (add only what you want to use)
GROQ_API_KEY=your-groq-api-key
GOOGLE_API_KEY=your-google-ai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OLLAMA_BASE_URL=http://localhost:11434
```

### Install Optional Dependencies (only if you want them)

```bash
# For all providers
pip install groq google-generativeai anthropic ibm-watsonx-ai aiohttp

# Or install individually as needed
pip install groq  # For Groq
pip install google-generativeai  # For Google Gemini
pip install anthropic  # For Claude
```

## 📋 Testing Your Setup

Run the test script to verify everything is working:

```bash
cd backend
python test_import.py
```

Expected output:
```
Testing LLM Service Integration
==================================================
[OK] Config import successful
[OK] LLM service classes import successful  
[OK] LLM manager import successful
[OK] NLP service import successful
[OK] LLM API router import successful

[SUCCESS] All core imports successful!
SUCCESS: All tests passed!
```

## 🚦 Using the New System

### 1. **No Changes Needed (Backward Compatible)**
```python
# Your existing code works exactly the same
await NLPService.detect_query_type("vocabulary word")
await NLPService.process_text_query(query, query_type)  
await NLPService.evaluate_speech(transcript, topic)
```

### 2. **NEW: Specify Provider/Model**
```python
# Use Groq for fast responses
await NLPService.detect_query_type(
    "vocabulary word",
    provider_model="groq/mixtral-8x7b-32768"
)

# Use GPT-4 for high quality
await NLPService.process_text_query(
    query="sophisticated", 
    query_type=ResourceType.VOCABULARY,
    provider_model="openai/gpt-4"
)

# Use local Ollama for privacy
await NLPService.evaluate_speech(
    transcript="Hello world",
    reference_topic="Greeting", 
    provider_model="ollama/llama3"
)
```

### 3. **NEW: Direct LLM Calls**
```python
from app.core.llm_manager import make_llm_call

messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Explain machine learning"}
]

# Use default provider
response = await make_llm_call(messages)

# Use specific provider
response = await make_llm_call(
    messages, 
    provider_model="groq/mixtral-8x7b-32768"
)

print(response.content)  # AI response
print(response.provider)  # Provider used
print(response.model)    # Model used
```

## 🎯 Recommended Usage Patterns

### Development
```bash
LLM_PROVIDER=ollama  # Free local models
LLM_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434
```

### Production
```bash  
LLM_PROVIDER=openai  # Reliable, high quality
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=your-production-key
```

### Real-time Features  
```python
# Use Groq for ultra-fast responses
await make_llm_call(messages, provider_model="groq/mixtral-8x7b-32768")
```

### High Quality Analysis
```python
# Use GPT-4 or Claude for best results  
await make_llm_call(messages, provider_model="openai/gpt-4")
await make_llm_call(messages, provider_model="anthropic/claude-3-opus-20240229")
```

## 🔍 Monitoring

Check your API health:
```bash
curl http://localhost:8000/api/llm/health
curl http://localhost:8000/api/llm/providers
curl http://localhost:8000/api/llm/config
```

## 📚 Next Steps

1. **Immediate**: Your existing code continues to work unchanged
2. **Optional**: Add specific provider/model parameters where you want different behavior
3. **Later**: Install additional providers as needed
4. **Advanced**: Implement cost optimization by using cheaper providers for simple tasks

## 🐛 Troubleshooting

### "Provider not available" Error
- Check if the provider is configured in your `.env` file
- Verify API keys are correct
- Install required dependencies: `pip install groq` (for example)

### Import Errors
- The system gracefully falls back to OpenAI-only mode if optional dependencies are missing
- Run `python test_import.py` to diagnose issues

### Server Won't Start
```bash
# Test basic imports
python -c "from app.main import app; print('OK')"

# Check specific error
uvicorn app.main:app --reload --port 8001
```

## 📖 Documentation

- **Complete Guide**: `LLM_INTEGRATION.md`
- **Code Examples**: `USAGE_EXAMPLES.py`
- **Architecture Details**: `backend/CLAUDE.md`

---

**🎉 Your Learn English app now supports multiple AI providers while maintaining 100% backward compatibility!**