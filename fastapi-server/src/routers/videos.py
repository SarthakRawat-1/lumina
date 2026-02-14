from typing import List
from fastapi import APIRouter, HTTPException, status

from src.models.video_generation.schemas import (
    GenerateVideoRequest,
    VideoResponse,
    VideoListItem,
    SUPPORTED_LANGUAGES,
)
from src.services.video_generation.video_generation_service import (
    get_video_generation_service,
)


router = APIRouter(
    prefix="/videos",
    tags=["videos"],
)


@router.post("/generate", response_model=VideoResponse)
async def generate_video(request: GenerateVideoRequest):
    valid_modes = ["short", "medium", "long"]
    if request.duration_mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid duration_mode. Must be one of: {valid_modes}",
        )

    if request.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid language. Must be one of: {SUPPORTED_LANGUAGES}",
        )

    try:
        service = get_video_generation_service()
        video_doc = await service.generate_video(
            topic=request.topic,
            language=request.language,
            duration_mode=request.duration_mode,
            user_id=request.user_id,
        )

        return VideoResponse(**video_doc)

    except Exception as e:
        print(f"Video generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video generation failed: {str(e)}",
        )


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str):
    try:
        service = get_video_generation_service()
        video = await service.get_video(video_id)
        return VideoResponse(**video)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/", response_model=List[VideoListItem])
async def list_videos(skip: int = 0, limit: int = 20, user_id: str = None):
    service = get_video_generation_service()
    videos = await service.list_videos(skip=skip, limit=limit, user_id=user_id)
    return [VideoListItem(**v) for v in videos]


@router.delete("/{video_id}")
async def delete_video(video_id: str):
    try:
        service = get_video_generation_service()
        return await service.delete_video(video_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/languages/available")
async def get_available_languages():
    service = get_video_generation_service()
    return {"languages": service.get_available_languages()}
