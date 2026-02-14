from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from bson import ObjectId

from src.models.video_assistant.schemas import (
    AddVideoRequest,
    VideoResponse,
    QARequest,
    QAResponseModel,
    SummaryResponse,
    ChaptersResponse,
    TeachBackRequest,
    TeachBackResponseModel,
    ChatMessageRequest,
)
from src.services.video_assistant.video_assistant_service import (
    get_video_assistant_service,
)
from src.utils.time import format_time


router = APIRouter(
    prefix="/video-assistant",
    tags=["video-assistant"],
)


@router.post("/videos", response_model=VideoResponse)
async def add_video(request: AddVideoRequest):
    service = get_video_assistant_service()
    try:
        result = await service.add_video(
            url=request.url,
            title=request.title,
            language=request.language,
            user_id=request.user_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/videos/upload", response_model=VideoResponse)
async def upload_video(
    file: UploadFile = File(..., description="Video file to upload"),
    title: str = Form(..., description="Title for the video"),
    language: str = Form(default="en-US", description="Language for transcription"),
    user_id: Optional[str] = Form(default=None, description="User ID for ownership"),
):
    service = get_video_assistant_service()
    try:
        result = await service.upload_video(
            file=file, title=title, language=language, user_id=user_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, user_id: str = None):
    service = get_video_assistant_service()
    try:
        result = await service.get_video(video_id, user_id)
        return result
    except ValueError as e:
        if "Invalid video ID" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid video ID"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
            )


@router.get("/videos", response_model=List[VideoResponse])
async def list_videos(skip: int = 0, limit: int = 20, user_id: Optional[str] = None):
    service = get_video_assistant_service()
    return await service.list_videos(skip, limit, user_id)


@router.post("/videos/{video_id}/qa", response_model=QAResponseModel)
async def ask_question(video_id: str, request: QARequest):
    service = get_video_assistant_service()
    try:
        result = await service.ask_question(
            video_id=video_id,
            question=request.question,
            current_time=request.current_time,
        )
        return result
    except ValueError as e:
        if "Video not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
            )


@router.get("/videos/{video_id}/summary", response_model=SummaryResponse)
async def get_summary(video_id: str, regenerate: bool = False):
    service = get_video_assistant_service()
    try:
        result = await service.get_summary(video_id, regenerate)

        cached = result.get("cached", False)
        return SummaryResponse(
            summary=result["summary"],
            key_points=result["key_points"],
            topics=result["topics"],
            cached=cached,
        )
    except ValueError as e:
        if "Video not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
            )


@router.get("/videos/{video_id}/chapters", response_model=ChaptersResponse)
async def get_chapters(
    video_id: str, regenerate: bool = False, target_chapters: int = 8
):
    service = get_video_assistant_service()
    try:
        result = await service.get_chapters(video_id, regenerate, target_chapters)

        return ChaptersResponse(
            chapters=result["chapters"], cached=result.get("cached", False)
        )
    except ValueError as e:
        if "Video not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
            )


@router.delete("/videos/{video_id}")
async def delete_video(video_id: str, user_id: str = None):
    service = get_video_assistant_service()
    try:
        result = await service.delete_video(video_id, user_id)
        return result
    except ValueError as e:
        if "Invalid video ID" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid video ID"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
            )


@router.post("/videos/{video_id}/teach-back", response_model=TeachBackResponseModel)
async def teach_back(video_id: str, request: TeachBackRequest):
    service = get_video_assistant_service()
    try:
        result = await service.teach_back(
            video_id=video_id,
            start_time=request.start_time,
            end_time=request.end_time,
            user_id=request.user_id,
            user_explanation=request.user_explanation,
            is_initial=request.is_initial,
            session_id=request.session_id,
        )

        return TeachBackResponseModel(
            prompt=result.get("prompt"),
            evaluation=result.get("evaluation"),
            follow_up_question=result.get("follow_up_question"),
            mastery_score=result.get("mastery_score"),
            encouragement=result.get("feedback"),
            is_complete=result.get("is_complete", False),
            session_id=result.get("session_id"),
            session_progress=result.get("session_progress"),
            feedback=result.get("feedback"),
            next_concept_prompt=result.get("next_concept_prompt"),
        )
    except ValueError as e:
        if "Video not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
            )
        elif "user_explanation is required" in str(e):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        elif "Session not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session expired or not found",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
            )


@router.get("/videos/{video_id}/chat")
async def get_chat_history(video_id: str):
    service = get_video_assistant_service()
    messages = await service.get_chat_history(video_id)
    return {"messages": messages}


@router.post("/videos/{video_id}/chat")
async def save_chat_message(video_id: str, request: ChatMessageRequest):
    service = get_video_assistant_service()

    timestamps = request.timestamps or []

    result = await service.save_chat_message(
        video_id=video_id,
        role=request.role,
        content=request.content,
        timestamps=timestamps,
        note_link=request.noteLink,
    )
    return result


@router.delete("/videos/{video_id}/chat")
async def clear_chat_history(video_id: str):
    service = get_video_assistant_service()
    result = await service.clear_chat_history(video_id)
    return result
