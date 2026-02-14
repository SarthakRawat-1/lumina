"""
Flashcards Router - API endpoints for Anki flashcard generation

Course-linked only: Generates flashcards from chapter or course content.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from src.services.course import generate_chapter_flashcards, generate_course_flashcards


router = APIRouter()


@router.post("/chapters/{chapter_id}/flashcards")
async def chapter_flashcards(
    chapter_id: str,
    flashcard_type: str = "testing",
    difficulty: str = "intermediate"
):
    """
    Generate Anki flashcard deck from a single chapter.
    
    Automatically translates to course language if not English.
    """
    try:
        apkg_path = await generate_chapter_flashcards(
            chapter_id=chapter_id,
            flashcard_type=flashcard_type,
            difficulty=difficulty
        )
        
        return FileResponse(
            apkg_path,
            media_type='application/octet-stream',
            filename=f"chapter_{chapter_id}_flashcards.apkg"
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/courses/{course_id}/flashcards")
async def course_flashcards(
    course_id: str,
    flashcard_type: str = "testing",
    difficulty: str = "intermediate"
):
    """
    Generate Anki flashcard deck from all chapters in a course.
    
    Combines all chapter content into a single deck.
    """
    try:
        apkg_path = await generate_course_flashcards(
            course_id=course_id,
            flashcard_type=flashcard_type,
            difficulty=difficulty
        )
        
        return FileResponse(
            apkg_path,
            media_type='application/octet-stream',
            filename=f"course_{course_id}_flashcards.apkg"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
