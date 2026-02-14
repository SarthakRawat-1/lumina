from io import BytesIO
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.models.schemas import ChatRequest, ChatResponse
from src.services.course.chat_service import get_chat_service
from src.db.helpers import get_chapter_or_404, get_course_language, get_message_or_404


router = APIRouter()

@router.post("/chapters/{chapter_id}/chat", response_model=ChatResponse)
async def send_chat_message(chapter_id: str, request: ChatRequest):
    chat_service = get_chat_service()
    return await chat_service.send_message(chapter_id, request.message)


@router.get("/chapters/{chapter_id}/chat/{message_id}/audio")
async def get_chat_audio(chapter_id: str, message_id: str, rate: float = 1.0):
    message = await get_message_or_404(message_id)

    chapter = await get_chapter_or_404(chapter_id)
    course_id = chapter.get("course_id", "")
    language = await get_course_language(course_id)

    from src.utils.tts import get_tts_service
    tts_service = get_tts_service()

    content = message.get("content", "")
    audio_content = await tts_service.synthesize_chapter(
        content=content,
        language=language,
        speaking_rate=rate
    )
    
    return StreamingResponse(
        BytesIO(audio_content),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=chat_audio.mp3"}
    )


@router.get("/chapters/{chapter_id}/chat/history")
async def get_chat_history(chapter_id: str, limit: int = 50):
    chat_service = get_chat_service()
    messages = await chat_service.get_history(chapter_id, limit)
    return {"messages": messages, "total": len(messages)}


@router.delete("/chapters/{chapter_id}/chat/history")
async def clear_chat_history(chapter_id: str):
    chat_service = get_chat_service()
    deleted_count = await chat_service.clear_history(chapter_id)
    return {"message": "Chat history cleared", "deleted_count": deleted_count}
