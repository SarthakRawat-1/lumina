from datetime import datetime
from typing import List, Optional

from src.models.schemas import ChatResponse, ChatMessage
from src.agents.course.chat import get_chat_agent
from src.utils.translation import get_translation_service
from src.db.mongodb import MongoDB
from src.db.helpers import get_chapter_or_404, get_course_language


class ChatService:
    async def get_rag_context(self, course_id: str, query: str) -> str:
        try:
            from src.utils.vector import get_vector_service
            vector_service = get_vector_service()
            
            context = await vector_service.get_context_for_topic(
                topic=query,
                course_id=course_id
            )
            return context if context else ""
        except Exception:
            return ""
    
    
    async def send_message(
        self,
        chapter_id: str,
        message: str
    ) -> ChatResponse:
        messages_col = MongoDB.chat_messages()

        chapter = await get_chapter_or_404(chapter_id)

        course_id = chapter.get("course_id", "")
        language = await get_course_language(course_id)

        rag_context = await self.get_rag_context(course_id, message)

        enhanced_content = chapter.get("content", "")

        if not enhanced_content and "sections" in chapter:
            sections = chapter.get("sections", [])
            content_parts = []
            for section in sections:
                if section.get("title"):
                    content_parts.append(f"## {section['title']}")
                if section.get("paragraphs"):
                    content_parts.extend(section["paragraphs"])
                if section.get("bullets"):
                    content_parts.extend([f"- {b}" for b in section["bullets"]])
                if section.get("tip"):
                    content_parts.append(f"Tip: {section['tip']}")
            enhanced_content = "\n\n".join(content_parts)

        if rag_context:
            enhanced_content = f"{enhanced_content}\n\nRelated Course Context:\n{rag_context}"

        cursor = messages_col.find(
            {"chapter_id": chapter_id}
        ).sort("timestamp", -1).limit(10)
        
        chat_history = []
        async for msg in cursor:
            chat_history.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        chat_history.reverse()

        chat_agent = get_chat_agent()
        
        response = await chat_agent.respond(
            message=message,
            chapter_title=chapter.get("title", ""),
            chapter_summary=chapter.get("summary", ""),
            chapter_content=enhanced_content,
            chat_history=chat_history
        )

        response_text = response.response
        if language != "en":
            translator = get_translation_service()
            response_text = await translator.translate(response_text, language)

        now = datetime.utcnow()
        await messages_col.insert_one({
            "chapter_id": chapter_id,
            "role": "user",
            "content": message,
            "timestamp": now
        })

        await messages_col.insert_one({
            "chapter_id": chapter_id,
            "role": "assistant",
            "content": response_text,
            "timestamp": now
        })
        
        return ChatResponse(message=response_text, timestamp=now)
    
    async def get_history(
        self,
        chapter_id: str,
        limit: int = 50
    ) -> List[ChatMessage]:
        messages_col = MongoDB.chat_messages()

        await get_chapter_or_404(chapter_id)

        cursor = messages_col.find(
            {"chapter_id": chapter_id}
        ).sort("timestamp", 1).limit(limit)
        
        messages = []
        async for msg in cursor:
            messages.append(ChatMessage(
                id=str(msg["_id"]),
                role=msg.get("role", "user"),
                content=msg.get("content", ""),
                timestamp=msg.get("timestamp", datetime.utcnow())
            ))
        
        return messages
    
    async def clear_history(self, chapter_id: str) -> int:
        messages_col = MongoDB.chat_messages()
        result = await messages_col.delete_many({"chapter_id": chapter_id})
        return result.deleted_count


_chat_service = None


def get_chat_service() -> ChatService:
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
