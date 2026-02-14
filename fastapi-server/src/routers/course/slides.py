"""
Slides Router - API endpoints for Reveal.js slide generation

Course-linked only: Generates slides from chapter or course content.
Slides are cached after first generation.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.services.course import generate_chapter_slides, generate_course_slides


router = APIRouter()


class SlideGenerateResponse(BaseModel):
    """Response with generated slides"""
    slides_html: str
    slide_count: int
    key_concepts: list[str]
    title: str
    concept_images: Optional[dict] = None


@router.post("/chapters/{chapter_id}/slides", response_model=SlideGenerateResponse)
async def chapter_slides(
    chapter_id: str,
    num_slides: int = 15,
    include_images: bool = True,
    force_regenerate: bool = False
):
    """
    Generate Reveal.js slides from a single chapter.
    
    Slides are cached after first generation. Use force_regenerate=True to refresh.
    """
    try:
        result = await generate_chapter_slides(
            chapter_id=chapter_id,
            num_slides=num_slides,
            include_images=include_images,
            force_regenerate=force_regenerate
        )
        
        return SlideGenerateResponse(
            slides_html=result.slides_html,
            slide_count=result.slide_count,
            key_concepts=result.key_concepts,
            title=f"Chapter {chapter_id}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/courses/{course_id}/slides", response_model=SlideGenerateResponse)
async def course_slides(
    course_id: str,
    num_slides: int = 30,
    include_images: bool = True,
    force_regenerate: bool = False
):
    """
    Generate Reveal.js slides from all chapters in a course.
    
    Slides are cached after first generation. Use force_regenerate=True to refresh.
    """
    try:
        result = await generate_course_slides(
            course_id=course_id,
            num_slides=num_slides,
            include_images=include_images,
            force_regenerate=force_regenerate
        )
        
        return SlideGenerateResponse(
            slides_html=result.slides_html,
            slide_count=result.slide_count,
            key_concepts=result.key_concepts,
            title=f"Course {course_id}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

