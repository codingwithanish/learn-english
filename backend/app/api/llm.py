"""
LLM management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.llm_manager import llm_manager, get_llm_service
from app.core.config import settings

router = APIRouter()


class LLMTestRequest(BaseModel):
    """Request model for testing LLM providers."""
    provider_model: str
    message: str = "Hello, how are you?"
    temperature: float = 0.7
    max_tokens: int = 50


class LLMTestResponse(BaseModel):
    """Response model for LLM test results."""
    success: bool
    content: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None
    error: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None


class LLMProviderInfo(BaseModel):
    """Information about an LLM provider."""
    name: str
    status: str
    available_models: List[str]
    error: Optional[str] = None


@router.get("/providers", response_model=List[LLMProviderInfo])
async def get_available_providers():
    """Get list of configured LLM providers and their status."""
    try:
        service = get_llm_service()
        providers_info = []
        
        for provider_name in service.get_available_providers():
            try:
                available_models = service.get_available_models(provider_name)
                providers_info.append(LLMProviderInfo(
                    name=provider_name,
                    status="available",
                    available_models=available_models
                ))
            except Exception as e:
                providers_info.append(LLMProviderInfo(
                    name=provider_name,
                    status="error",
                    available_models=[],
                    error=str(e)
                ))
        
        return providers_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get providers: {str(e)}")


@router.get("/health")
async def health_check():
    """Check health of all configured LLM providers."""
    try:
        health_status = await llm_manager.health_check()
        return {
            "status": "ok" if any(
                provider["status"] == "healthy" 
                for provider in health_status.values()
            ) else "degraded",
            "providers": health_status,
            "default_provider": llm_manager.get_default_provider_model()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.post("/test", response_model=LLMTestResponse)
async def test_llm_provider(request: LLMTestRequest):
    """Test a specific LLM provider with a sample message."""
    try:
        service = get_llm_service()
        
        messages = [{"role": "user", "content": request.message}]
        
        response = await service.chat_completion(
            messages=messages,
            provider_model=request.provider_model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return LLMTestResponse(
            success=True,
            content=response.content,
            model=response.model,
            provider=response.provider,
            usage=response.usage
        )
        
    except Exception as e:
        return LLMTestResponse(
            success=False,
            error=str(e)
        )


@router.get("/config")
async def get_current_config():
    """Get current LLM configuration settings."""
    return {
        "default_provider": settings.LLM_PROVIDER,
        "default_model": settings.LLM_MODEL,
        "temperature": settings.LLM_TEMPERATURE,
        "max_tokens": settings.LLM_MAX_TOKENS,
        "configured_providers": llm_manager.get_configured_providers()
    }


@router.post("/reload")
async def reload_llm_service():
    """Reload LLM service with updated configuration."""
    try:
        llm_manager.reload_service()
        return {"message": "LLM service reloaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reload service: {str(e)}")


@router.get("/usage-stats")
async def get_usage_stats():
    """Get LLM usage statistics (placeholder for future implementation)."""
    return {
        "message": "Usage statistics not yet implemented",
        "total_requests": 0,
        "requests_by_provider": {},
        "average_response_time": 0
    }