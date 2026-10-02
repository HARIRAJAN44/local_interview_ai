import httpx
import json
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from backend.services.ai.provider import (
    AIProvider, GenerateRequest, StructuredGenerateRequest,
    EmbeddingRequest, GenerateResponse, EmbeddingResponse, ModelInfo
)
import ollama


class OllamaProvider(AIProvider):
    def __init__(self, base_url: str = "http://localhost:11434", default_model: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.client = ollama.AsyncClient(host=base_url)
        self._http_client = httpx.AsyncClient(base_url=base_url, timeout=60.0)

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        model = self.default_model
        if not model:
            models = await self.list_models()
            if models:
                model = models[0].name
            else:
                raise ValueError("No models available")

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.append({"role": "user", "content": request.prompt})

        response = await self.client.chat(
            model=model,
            messages=messages,
            options={
                "temperature": request.temperature,
                "num_predict": request.max_tokens or -1,
            }
        )

        return GenerateResponse(
            content=response["message"]["content"],
            model=model,
            usage={
                "prompt_tokens": response.get("prompt_eval_count", 0),
                "completion_tokens": response.get("eval_count", 0),
            }
        )

    async def generate_stream(self, request: GenerateRequest) -> AsyncGenerator[str, None]:
        model = self.default_model
        if not model:
            models = await self.list_models()
            if models:
                model = models[0].name
            else:
                raise ValueError("No models available")

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.append({"role": "user", "content": request.prompt})

        async for chunk in await self.client.chat(
            model=model,
            messages=messages,
            options={
                "temperature": request.temperature,
                "num_predict": request.max_tokens or -1,
            },
            stream=True
        ):
            if "message" in chunk and "content" in chunk["message"]:
                yield chunk["message"]["content"]

    async def structured_generate(self, request: StructuredGenerateRequest) -> Dict[str, Any]:
        model = self.default_model
        if not model:
            models = await self.list_models()
            if models:
                model = models[0].name
            else:
                raise ValueError("No models available")

        schema_prompt = f"""
        You must respond with a valid JSON object that matches this schema:
        {json.dumps(request.response_schema, indent=2)}
        
        Prompt: {request.prompt}
        
        Respond ONLY with the JSON object, no additional text.
        """

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.append({"role": "user", "content": schema_prompt})

        response = await self.client.chat(
            model=model,
            messages=messages,
            options={
                "temperature": request.temperature,
                "num_predict": request.max_tokens or -1,
            },
            format=request.response_schema
        )

        try:
            return json.loads(response["message"]["content"])
        except json.JSONDecodeError:
            raise ValueError("Failed to parse structured output from model")

    async def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        model = request.model or self.default_model
        if not model:
            models = await self.list_models()
            if models:
                model = models[0].name
            else:
                raise ValueError("No models available")

        embeddings = []
        for text in request.texts:
            response = await self.client.embeddings(model=model, prompt=text)
            embeddings.append(response["embedding"])

        return EmbeddingResponse(
            embeddings=embeddings,
            model=model,
            usage={"total_tokens": sum(len(t.split()) for t in request.texts)}
        )

    async def list_models(self) -> List[ModelInfo]:
        try:
            response = await self.client.list()
            models = []
            for m in response.get("models", []):
                models.append(ModelInfo(
                    name=m.get("name", ""),
                    size=m.get("size", ""),
                    parameters=m.get("details", {}).get("parameter_size", ""),
                    quantization=m.get("details", {}).get("quantization_level", ""),
                    context_length=m.get("details", {}).get("context_length", 8192),
                    capabilities=["chat", "embeddings"]
                ))
            return models
        except Exception:
            return []

    async def health_check(self) -> bool:
        try:
            await self.client.list()
            return True
        except Exception:
            return False

    def get_provider_name(self) -> str:
        return "ollama"

    async def pull_model(self, model_name: str) -> AsyncGenerator[Dict[str, Any], None]:
        async for progress in self.client.pull(model=model_name, stream=True):
            yield progress

    async def delete_model(self, model_name: str) -> bool:
        try:
            await self.client.delete(model=model_name)
            return True
        except Exception:
            return False