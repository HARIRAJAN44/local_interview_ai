import httpx
import json
import os
from typing import List, Dict, Any, Optional, AsyncGenerator
from backend.services.ai.provider import (
    AIProvider, GenerateRequest, StructuredGenerateRequest,
    EmbeddingRequest, GenerateResponse, EmbeddingResponse, ModelInfo
)


class OpenRouterProvider(AIProvider):
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://openrouter.ai/api/v1"):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.base_url = base_url.rstrip("/")
        self.default_model = "openrouter/auto"
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
            timeout=120.0
        )

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.append({"role": "user", "content": request.prompt})

        payload = {
            "model": self.default_model,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }

        response = await self._client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()

        return GenerateResponse(
            content=data["choices"][0]["message"]["content"],
            model=data.get("model", self.default_model),
            usage=data.get("usage")
        )

    async def generate_stream(self, request: GenerateRequest) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.append({"role": "user", "content": request.prompt})

        payload = {
            "model": self.default_model,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": True,
        }

        async with self._client.stream("POST", "/chat/completions", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        if chunk["choices"][0]["delta"].get("content"):
                            yield chunk["choices"][0]["delta"]["content"]
                    except json.JSONDecodeError:
                        continue

    async def structured_generate(self, request: StructuredGenerateRequest) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")

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

        payload = {
            "model": self.default_model,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "response_format": {"type": "json_object"},
        }

        response = await self._client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()

        try:
            return json.loads(data["choices"][0]["message"]["content"])
        except json.JSONDecodeError:
            raise ValueError("Failed to parse structured output from model")

    async def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")

        model = request.model or "text-embedding-3-small"
        
        response = await self._client.post("/embeddings", json={
            "model": model,
            "input": request.texts,
        })
        response.raise_for_status()
        data = response.json()

        embeddings = [item["embedding"] for item in data["data"]]

        return EmbeddingResponse(
            embeddings=embeddings,
            model=model,
            usage=data.get("usage")
        )

    async def list_models(self) -> List[ModelInfo]:
        if not self.api_key:
            return []

        try:
            response = await self._client.get("/models")
            response.raise_for_status()
            data = response.json()

            models = []
            for m in data.get("data", []):
                models.append(ModelInfo(
                    name=m.get("id", ""),
                    context_length=m.get("context_length", 8192),
                    capabilities=["chat"] + (["tools"] if m.get("supported_parameters", {}).get("tools") else [])
                ))
            return models
        except Exception:
            return []

    async def health_check(self) -> bool:
        if not self.api_key:
            return False
        try:
            response = await self._client.get("/models")
            return response.status_code == 200
        except Exception:
            return False

    def get_provider_name(self) -> str:
        return "openrouter"

    async def get_free_models(self) -> List[ModelInfo]:
        models = await self.list_models()
        return [m for m in models if ":free" in m.name or "free" in m.name.lower()]

    async def close(self):
        await self._client.aclose()