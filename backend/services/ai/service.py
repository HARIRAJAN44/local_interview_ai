from typing import Optional, List, Dict, Any
from backend.services.ai.provider import AIProvider, ProviderRegistry, GenerateRequest, StructuredGenerateRequest, EmbeddingRequest, ModelInfo
from backend.services.ai.ollama_provider import OllamaProvider
from backend.services.ai.openrouter_provider import OpenRouterProvider
import os


class AIService:
    def __init__(self):
        self._initialized = False

    async def initialize(self):
        if self._initialized:
            return

        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ollama_provider = OllamaProvider(base_url=ollama_url)
        ProviderRegistry.register("ollama", ollama_provider, is_default=True)

        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if openrouter_key:
            openrouter_provider = OpenRouterProvider(api_key=openrouter_key)
            ProviderRegistry.register("openrouter", openrouter_provider)

        self._initialized = True

    def get_provider(self, provider_name: Optional[str] = None) -> AIProvider:
        return ProviderRegistry.get(provider_name)

    def get_default_provider(self) -> AIProvider:
        return ProviderRegistry.get()

    def list_providers(self) -> List[str]:
        return ProviderRegistry.list_providers()

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, 
                       temperature: float = 0.4, provider: Optional[str] = None) -> str:
        ai_provider = self.get_provider(provider)
        request = GenerateRequest(prompt=prompt, system_prompt=system_prompt, temperature=temperature)
        response = await ai_provider.generate(request)
        return response.content

    async def structured_generate(self, prompt: str, schema: Dict[str, Any],
                                   system_prompt: Optional[str] = None,
                                   temperature: float = 0.3,
                                   provider: Optional[str] = None) -> Dict[str, Any]:
        ai_provider = self.get_provider(provider)
        request = StructuredGenerateRequest(prompt=prompt, schema=schema, system_prompt=system_prompt, temperature=temperature)
        return await ai_provider.structured_generate(request)

    async def embed(self, texts: List[str], provider: Optional[str] = None) -> List[List[float]]:
        ai_provider = self.get_provider(provider)
        request = EmbeddingRequest(texts=texts)
        response = await ai_provider.embed(request)
        return response.embeddings

    async def list_models(self, provider: Optional[str] = None) -> List[ModelInfo]:
        ai_provider = self.get_provider(provider)
        return await ai_provider.list_models()

    async def health_check(self, provider: Optional[str] = None) -> bool:
        ai_provider = self.get_provider(provider)
        return await ai_provider.health_check()

    def get_provider_name(self, provider: Optional[str] = None) -> str:
        ai_provider = self.get_provider(provider)
        return ai_provider.get_provider_name()


ai_service = AIService()