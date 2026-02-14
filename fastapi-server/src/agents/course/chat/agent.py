from typing import List

from src.utils.llm import get_llm_service
from src.models.course import ChatResponseSchema
from src.prompts.course import CHAT_SYSTEM_PROMPT


class ChatAgent:
    def __init__(self):
        self.llm = get_llm_service()
    
    async def respond(
        self,
        message: str,
        chapter_title: str,
        chapter_summary: str,
        chapter_content: str,
        chat_history: List[dict] = None,
        context: str = None
    ) -> ChatResponseSchema:
        max_content_length = 2000
        if len(chapter_content) > max_content_length:
            chapter_content = chapter_content[:max_content_length] + "..."
        
        system_prompt = CHAT_SYSTEM_PROMPT.format(
            chapter_title=chapter_title,
            chapter_summary=chapter_summary,
            chapter_content=chapter_content
        )

        prompt_parts = []

        if chat_history:
            prompt_parts.append("Previous conversation:")
            for msg in chat_history[-5:]:  
                role = "Student" if msg.get("role") == "user" else "Tutor"
                prompt_parts.append(f"{role}: {msg.get('content', '')}")
            prompt_parts.append("")

        if context:
            prompt_parts.append(f"Additional reference material:\n{context}\n")

        prompt_parts.append(f"Student: {message}")
        prompt_parts.append("\nProvide a helpful response:")
        
        prompt = "\n".join(prompt_parts)

        response = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=ChatResponseSchema,
            system_prompt=system_prompt
        )
        
        return response


_chat_agent = None


def get_chat_agent() -> ChatAgent:
    global _chat_agent
    if _chat_agent is None:
        _chat_agent = ChatAgent()
    return _chat_agent
