from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, AsyncGenerator
from pydantic import BaseModel
import json


class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    temperature: float = 0.4
    max_tokens: Optional[int] = None
    stream: bool = False


class StructuredGenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    response_schema: Dict[str, Any]
    temperature: float = 0.3
    max_tokens: Optional[int] = None


class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = None


class GenerateResponse(BaseModel):
    content: str
    model: str
    usage: Optional[Dict[str, int]] = None


class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    usage: Optional[Dict[str, int]] = None


class ModelInfo(BaseModel):
    name: str
    size: Optional[str] = None
    parameters: Optional[str] = None
    quantization: Optional[str] = None
    context_length: Optional[int] = None
    capabilities: List[str] = []


class AIProvider(ABC):
    @abstractmethod
    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        pass

    @abstractmethod
    async def generate_stream(self, request: GenerateRequest) -> AsyncGenerator[str, None]:
        pass

    @abstractmethod
    async def structured_generate(self, request: StructuredGenerateRequest) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        pass

    @abstractmethod
    async def list_models(self) -> List[ModelInfo]:
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        pass


class ProviderRegistry:
    _providers: Dict[str, AIProvider] = {}
    _default_provider: Optional[str] = None

    @classmethod
    def register(cls, name: str, provider: AIProvider, is_default: bool = False):
        cls._providers[name] = provider
        if is_default or cls._default_provider is None:
            cls._default_provider = name

    @classmethod
    def get(cls, name: Optional[str] = None) -> AIProvider:
        if name is None:
            name = cls._default_provider
        if name not in cls._providers:
            raise ValueError(f"Provider '{name}' not registered")
        return cls._providers[name]

    @classmethod
    def list_providers(cls) -> List[str]:
        return list(cls._providers.keys())

    @classmethod
    def get_default(cls) -> Optional[str]:
        return cls._default_provider