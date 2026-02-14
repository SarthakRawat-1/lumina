from typing import Any, Type, TypeVar, Optional, Literal
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel

from src.config.settings import settings


T = TypeVar("T", bound=BaseModel)

LLMProvider = Literal["groq", "gemini"]


class LLMService:
    def __init__(
        self, 
        provider: LLMProvider = "groq",
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ):
        self.provider = provider
        self.temperature = temperature
        self.max_tokens = max_tokens
        
        if provider == "groq":
            self.model_name = model or settings.groq_model
            if not settings.groq_api_key:
                raise ValueError("GROQ_API_KEY environment variable is required")
            self.llm = ChatGroq(
                api_key=settings.groq_api_key,
                model=self.model_name,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )
        elif provider == "gemini":
            self.model_name = model or settings.gemini_model
            if not settings.google_cloud_api:
                raise ValueError("GOOGLE_CLOUD_API environment variable is required")
            self.llm = ChatGoogleGenerativeAI(
                api_key=settings.google_cloud_api,
                model=self.model_name,
                temperature=self.temperature,
                max_output_tokens=self.max_tokens,
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: str = None
    ) -> str:
        messages = []
        
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        
        messages.append(HumanMessage(content=prompt))
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    async def generate_structured(
        self,
        prompt: str,
        output_schema: Type[T],
        system_prompt: str = None,
        max_retries: int = 3
    ) -> T:
        import asyncio

        structured_llm = self.llm.with_structured_output(output_schema)
        
        messages = []
        
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        
        messages.append(HumanMessage(content=prompt))
        
        last_error = None
        for attempt in range(max_retries):
            try:
                response = await structured_llm.ainvoke(messages)
                return response
            except Exception as e:
                error_msg = str(e)
                last_error = e
                
                if "tool_use_failed" in error_msg or "did not match schema" in error_msg:
                    print(f"[LLM] Structured output attempt {attempt + 1}/{max_retries} failed: tool validation error")
                    if attempt < max_retries - 1:
                        clarification = "\n\nIMPORTANT: Ensure all JSON objects have the correct keys. For MCQ options, use 'key' and 'text' fields only."
                        if clarification not in messages[-1].content:
                            messages[-1] = HumanMessage(content=messages[-1].content + clarification)
                        await asyncio.sleep(0.5 * (2 ** attempt))
                        continue
                raise
        
        raise last_error
    
    async def generate_json(
        self,
        prompt: str,
        system_prompt: str = None
    ) -> dict:
        parser = JsonOutputParser()
        
        format_instructions = parser.get_format_instructions()
        full_system = f"{system_prompt}\n\n{format_instructions}" if system_prompt else format_instructions
        
        messages = [
            SystemMessage(content=full_system),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        return parser.parse(response.content)
    
    def get_model_info(self) -> dict:
        return {
            "model": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "provider": self.provider
        }

_llm_services: dict[str, LLMService] = {}


def get_llm_service(provider: LLMProvider = "groq", model: str = None) -> LLMService:
    global _llm_services

    cache_key = f"{provider}:{model or 'default'}"
    if cache_key not in _llm_services:
        _llm_services[cache_key] = LLMService(provider=provider, model=model)
    return _llm_services[cache_key]

