from datetime import datetime
from fastapi import APIRouter, HTTPException, status

from src.models.roadmap.schemas import (
    GenerateRoadmapRequest, RoadmapResponse, UpdateProgressRequest, ProgressResponse,
    ChatMessageRequest, ChatMessageResponse, SuggestedQuestionsResponse
)
from src.services.roadmap.roadmap_service import get_roadmap_service
from src.services.roadmap.roadmap_chat_service import get_roadmap_chat_service

router = APIRouter(
    prefix="/roadmaps",
    tags=["roadmaps"],
)

@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap(request: GenerateRoadmapRequest):
    service = get_roadmap_service()
    try:
        result = await service.generate_roadmap(
            topic=request.topic,
            goal=request.goal,
            skill_level=request.skill_level,
            language=request.language,
            user_id=request.user_id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{roadmap_id}", response_model=RoadmapResponse)
async def get_roadmap(roadmap_id: str):
    service = get_roadmap_service()
    try:
        result = await service.get_roadmap(roadmap_id)
        return result
    except ValueError as e:
        if "Invalid roadmap ID" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid roadmap ID"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap not found"
            )


@router.get("/{roadmap_id}/nodes/{node_id}")
async def get_node_details(roadmap_id: str, node_id: str, language: str = "en"):
    service = get_roadmap_service()
    try:
        result = await service.get_node_details(roadmap_id, node_id, language)
        return result
    except ValueError as e:
        if "Invalid roadmap ID" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid roadmap ID"
            )
        elif "Roadmap not found" in str(e) or "Node not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )


@router.get("/{roadmap_id}/progress/{user_id}", response_model=ProgressResponse)
async def get_user_progress(roadmap_id: str, user_id: str):
    service = get_roadmap_service()
    result = await service.get_user_progress(roadmap_id, user_id)
    return ProgressResponse(**result)


@router.patch("/{roadmap_id}/progress/{user_id}")
async def update_user_progress(
    roadmap_id: str,
    user_id: str,
    request: UpdateProgressRequest
):
    service = get_roadmap_service()
    try:
        result = await service.update_user_progress(
            roadmap_id=roadmap_id,
            user_id=user_id,
            node_id=request.node_id,
            status=request.status
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/")
async def list_roadmaps(skip: int = 0, limit: int = 20, user_id: str = None):
    service = get_roadmap_service()
    return await service.list_roadmaps(skip, limit, user_id)


@router.post("/{roadmap_id}/chat", response_model=ChatMessageResponse)
async def send_roadmap_chat_message(roadmap_id: str, request: ChatMessageRequest):
    chat_service = get_roadmap_chat_service()
    
    try:
        result = await chat_service.send_message(
            roadmap_id=roadmap_id,
            message=request.message,
            chat_history=request.chat_history
        )
        return ChatMessageResponse(**result)
    except ValueError as e:
        if "Roadmap not found" in str(e) or "Invalid roadmap ID" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap not found"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )


@router.get("/{roadmap_id}/chat/suggestions", response_model=SuggestedQuestionsResponse)
async def get_suggested_questions(roadmap_id: str):
    roadmap_service = get_roadmap_service()
    chat_service = get_roadmap_chat_service()
    
    try:
        roadmap = await roadmap_service.get_roadmap(roadmap_id)
        questions = chat_service.get_suggested_questions(roadmap)
        return SuggestedQuestionsResponse(questions=questions)
    except ValueError as e:
        if "Roadmap not found" in str(e) or "Invalid roadmap ID" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap not found"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
