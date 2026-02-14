import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from bson import ObjectId

from src.db.mongodb import MongoDB
from src.services.course.material_service import get_material_service
from src.models.course import (
    MaterialUploadResponse,
    GraphExpansionPreview,
    YouTubeRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/courses/{course_id}/materials/upload", response_model=MaterialUploadResponse)
async def upload_material(
    course_id: str,
    file: UploadFile = File(...),
    auto_expand: bool = Form(default=True)
):
    courses = MongoDB.courses()
    material_service = get_material_service()

    try:
        course = await courses.find_one({"_id": ObjectId(course_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    content = await file.read()
    extracted_text, error = await material_service.extract_content_from_file(
        file.filename, content
    )
    
    if error:
        raise HTTPException(status_code=422, detail=error)

    expansion_plan, course = await material_service.get_expansion_plan(
        course_id, extracted_text
    )

    if not expansion_plan.new_topics:
        return MaterialUploadResponse(
            success=True,
            message="Material analyzed but no new topics identified. Content may already be covered.",
            new_nodes_count=0,
            new_edges_count=0,
            expansion_summary=expansion_plan.summary
        )
    
    if not auto_expand:
        return MaterialUploadResponse(
            success=True,
            message="Preview generated. Set auto_expand=true to apply changes.",
            new_nodes_count=len(expansion_plan.new_topics),
            new_edges_count=len(expansion_plan.new_edges),
            expansion_summary=expansion_plan.summary
        )

    return await material_service.apply_expansion(
        course_id, expansion_plan, course, extracted_text
    )


@router.post("/courses/{course_id}/materials/preview", response_model=GraphExpansionPreview)
async def preview_material_expansion(
    course_id: str,
    file: UploadFile = File(...)
):
    courses = MongoDB.courses()
    material_service = get_material_service()

    try:
        course = await courses.find_one({"_id": ObjectId(course_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    content = await file.read()
    extracted_text, error = await material_service.extract_content_from_file(
        file.filename, content
    )
    
    if error:
        raise HTTPException(status_code=422, detail=error)

    expansion_plan, _ = await material_service.get_expansion_plan(course_id, extracted_text)
    
    return GraphExpansionPreview(
        new_topics=[
            {
                "id": t.id,
                "title": t.title,
                "summary": t.summary,
                "connects_to": t.connects_to
            }
            for t in expansion_plan.new_topics
        ],
        new_edges=[
            {"source": e.source, "target": e.target}
            for e in expansion_plan.new_edges
        ],
        summary=expansion_plan.summary
    )


@router.post("/courses/{course_id}/materials/youtube", response_model=MaterialUploadResponse)
async def process_youtube_url(
    course_id: str,
    request: YouTubeRequest
):
    courses = MongoDB.courses()
    material_service = get_material_service()

    try:
        course = await courses.find_one({"_id": ObjectId(course_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    extracted_text = await material_service.get_youtube_transcript(request.youtube_url)
    
    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail="Failed to get transcript. Video may not have captions or be unavailable."
        )

    expansion_plan, course = await material_service.get_expansion_plan(
        course_id, extracted_text
    )
    
    if not expansion_plan.new_topics:
        return MaterialUploadResponse(
            success=True,
            message="Video analyzed but no new topics identified. Content may already be covered.",
            new_nodes_count=0,
            new_edges_count=0,
            expansion_summary=expansion_plan.summary
        )
    
    if not request.auto_expand:
        return MaterialUploadResponse(
            success=True,
            message="Preview generated. Set auto_expand=true to apply changes.",
            new_nodes_count=len(expansion_plan.new_topics),
            new_edges_count=len(expansion_plan.new_edges),
            expansion_summary=expansion_plan.summary
        )

    return await material_service.apply_expansion(
        course_id, expansion_plan, course, extracted_text
    )
