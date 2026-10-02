from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend.services.ai.service import ai_service
from backend.core.config import settings

router = APIRouter()


class AISettingsResponse(BaseModel):
    provider: str
    available_providers: List[str]
    models: List[dict]
    current_model: Optional[str]
    temperature: float
    context_length: int


class AISettingsUpdate(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    context_length: Optional[int] = None


@router.get("/ai", response_model=AISettingsResponse)
async def get_ai_settings():
    providers = ai_service.list_providers()
    default_provider = ai_service.get_default_provider().get_provider_name()
    
    models = await ai_service.list_models(default_provider)
    
    return AISettingsResponse(
        provider=default_provider,
        available_providers=providers,
        models=[m.model_dump() for m in models],
        current_model=settings.LOCAL_MODEL,
        temperature=0.4,
        context_length=8192,
    )


@router.post("/ai/test")
async def test_ai_connection(provider: str = None):
    healthy = await ai_service.health_check(provider)
    provider_name = provider or ai_service.get_default_provider().get_provider_name()
    return {"provider": provider_name, "healthy": healthy}


@router.get("/ollama/models")
async def list_ollama_models():
    models = await ai_service.list_models("ollama")
    return {"models": [m.model_dump() for m in models]}


@router.post("/ollama/pull")
async def pull_ollama_model(model_name: str):
    from backend.services.ai.ollama_provider import OllamaProvider
    provider = OllamaProvider()
    progress = []
    async for p in provider.pull_model(model_name):
        progress.append(p)
    return {"model": model_name, "progress": progress[-1] if progress else {}}


@router.get("/system/info")
async def get_system_info():
    import platform
    import psutil
    
    ram = psutil.virtual_memory()
    ram_gb = round(ram.total / (1024**3), 1)
    
    gpu_info = "Not detected"
    try:
        import GPUtil
        gpus = GPUtil.getGPUs()
        if gpus:
            gpu = gpus[0]
            gpu_info = f"{gpu.name} ({gpu.memoryTotal}MB VRAM)"
    except:
        pass
    
    ollama_available = await ai_service.health_check("ollama")
    
    recommended = "7B-14B quantized"
    if ram_gb >= 32:
        recommended = "14B-32B quantized"
    elif ram_gb >= 64:
        recommended = "32B-70B quantized"
    
    return {
        "platform": platform.system(),
        "platform_version": platform.version(),
        "python_version": platform.python_version(),
        "ram_gb": ram_gb,
        "ram_available_gb": round(ram.available / (1024**3), 1),
        "cpu_count": psutil.cpu_count(),
        "gpu": gpu_info,
        "ollama_available": ollama_available,
        "recommended_model_size": recommended,
    }


@router.get("/openrouter/models")
async def list_openrouter_models():
    models = await ai_service.list_models("openrouter")
    return {"models": [m.model_dump() for m in models]}


@router.get("/openrouter/free")
async def list_free_models():
    from backend.services.ai.openrouter_provider import OpenRouterProvider
    provider = OpenRouterProvider()
    models = await provider.get_free_models()
    return {"models": [m.model_dump() for m in models]}


@router.post("/ollama/test-generation")
async def test_ollama_generation(model: str = None, prompt: str = "Say hello in one sentence."):
    """Test actual text generation with Ollama model"""
    from backend.services.ai.ollama_provider import OllamaProvider
    provider = OllamaProvider()
    
    # Check health first
    healthy = await provider.health_check()
    if not healthy:
        raise HTTPException(status_code=503, detail="Ollama not available")
    
    # Get available models
    models = await provider.list_models()
    if not models:
        raise HTTPException(status_code=404, detail="No models installed")
    
    # Use specified model or first available
    target_model = model or models[0].name
    
    # Test generation
    try:
        from backend.services.ai.provider import GenerateRequest
        request = GenerateRequest(prompt=prompt, temperature=0.3)
        response = await provider.generate(request)
        return {
            "model": target_model,
            "prompt": prompt,
            "response": response.content,
            "usage": response.usage,
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")