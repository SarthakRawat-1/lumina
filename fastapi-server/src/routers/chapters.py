from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from src.models.schemas import ChapterDetail, ChapterListResponse
from src.services.course.chapter_service import get_chapter_service

router = APIRouter()

@router.get("/courses/{course_id}/chapters", response_model=ChapterListResponse)
async def list_chapters(course_id: str):
    chapter_service = get_chapter_service()
    chapters = await chapter_service.list_chapters(course_id)
    return ChapterListResponse(chapters=chapters, total=len(chapters))


@router.get("/courses/{course_id}/chapters/{chapter_id}", response_model=ChapterDetail)
async def get_chapter(course_id: str, chapter_id: str):
    chapter_service = get_chapter_service()
    return await chapter_service.get_chapter(course_id, chapter_id)


@router.patch("/courses/{course_id}/chapters/{chapter_id}/complete")
async def mark_chapter_complete(course_id: str, chapter_id: str):
    chapter_service = get_chapter_service()
    
    try:
        success = await chapter_service.mark_complete(course_id, chapter_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chapter ID")
    
    if not success:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    return {"message": "Chapter marked as complete", "chapter_id": chapter_id}


@router.patch("/courses/{course_id}/chapters/{chapter_id}/incomplete")
async def mark_chapter_incomplete(course_id: str, chapter_id: str):
    chapter_service = get_chapter_service()
    
    try:
        success = await chapter_service.mark_incomplete(course_id, chapter_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chapter ID")
    
    if not success:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    return {"message": "Chapter marked as incomplete", "chapter_id": chapter_id}


@router.get("/courses/{course_id}/chapters/{chapter_id}/audio")
async def get_chapter_audio_stream(course_id: str, chapter_id: str, rate: float = 1.0):
    from src.utils.tts import get_tts_service

    tts_service = get_tts_service()
    if not tts_service.is_available():
        error_msg = tts_service.get_init_error() or "TTS service not configured"
        raise HTTPException(
            status_code=503, 
            detail=f"Text-to-Speech service unavailable: {error_msg}. Please configure GOOGLE_APPLICATION_CREDENTIALS."
        )
    
    chapter_service = get_chapter_service()

    return StreamingResponse(
        chapter_service.stream_audio(course_id, chapter_id, rate),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="chapter_{chapter_id}.mp3"',
            "Cache-Control": "no-cache"
        }
    )
