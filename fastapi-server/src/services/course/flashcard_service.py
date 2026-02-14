from bson import ObjectId
from fastapi import HTTPException

from src.db.mongodb import MongoDB
from src.db.helpers import get_chapter_or_404, get_course_language
from src.utils.translation import get_translation_service
from src.agents.course.flashcard import get_flashcard_agent
from src.models.course import FlashcardConfig, FlashcardType, Difficulty, ChapterMode


async def generate_chapter_flashcards(
    chapter_id: str,
    flashcard_type: str = "testing",
    difficulty: str = "intermediate"
) -> str:
    chapter = await get_chapter_or_404(chapter_id)

    course_id = chapter.get("course_id", "")
    language = await get_course_language(course_id)

    chapter_content = chapter.get("content", "")
    chapter_title = chapter.get("title", "Untitled Chapter")
    
    if not chapter_content and "sections" in chapter:
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
                content_parts.append(f"TIP: {section['tip']}")
        chapter_content = "\n\n".join(content_parts)
    
    if not chapter_content:
        raise HTTPException(status_code=400, detail="Chapter has no content to generate flashcards from")

    if language != "en":
        translator = get_translation_service()
        chapter_content = await translator.translate(chapter_content, language)
        chapter_title = await translator.translate(chapter_title, language)
    
    agent = get_flashcard_agent()
    
    config = FlashcardConfig(
        title=chapter_title,
        type=FlashcardType(flashcard_type),
        difficulty=Difficulty(difficulty),
        chapter_mode=ChapterMode.AUTO,
        slides_per_chapter=10
    )
    
    apkg_path = await agent.generate_from_text(
        text=chapter_content,
        title=chapter_title,
        config=config
    )
    
    return apkg_path


async def generate_course_flashcards(
    course_id: str,
    flashcard_type: str = "testing",
    difficulty: str = "intermediate"
) -> str:
    courses = MongoDB.courses()
    try:
        course = await courses.find_one({"_id": ObjectId(course_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    language = course.get("language", "en")
    course_title = course.get("title", "Course")

    chapters = MongoDB.chapters()
    cursor = chapters.find({"course_id": course_id}).sort("index", 1)
    
    chapter_list = []
    async for chapter in cursor:
        chapter_list.append(chapter)
    
    if not chapter_list:
        raise HTTPException(status_code=400, detail="Course has no chapters to generate flashcards from")

    agent = get_flashcard_agent()

    all_questions = []
    all_cards = []

    for chapter in chapter_list:
        chapter_title = chapter.get("title", "")
        chapter_content = chapter.get("content", "")

        if not chapter_content and "sections" in chapter:
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
                    content_parts.append(f"TIP: {section['tip']}")
            chapter_content = "\n\n".join(content_parts)
        
        if not chapter_content:
            continue

        if language != "en":
            translator = get_translation_service()
            chapter_content = await translator.translate(chapter_content, language)
            chapter_title = await translator.translate(chapter_title, language)
            
        if flashcard_type == "testing":
            questions = await agent.generate_mcq_questions(
                text=chapter_content,
                difficulty=difficulty,
                num_questions=3
            )
            all_questions.extend(questions)
        else:
            mock_chapter_list = [{"title": chapter_title, "text": chapter_content}]
            cards = await agent.generate_learning_cards(
                chapters=mock_chapter_list,
                cards_per_chapter=5
            )
            all_cards.extend(cards)
            
    if not all_questions and not all_cards:
        raise HTTPException(status_code=500, detail="Failed to generate any flashcards")

    if flashcard_type == "testing":
        apkg_path = agent.anki_generator.create_testing_deck(
            questions=all_questions,
            title=course_title,
            source_name=f"Course: {course_title}"
        )
    else:
        apkg_path = agent.anki_generator.create_learning_deck(
            cards=all_cards,
            title=course_title,
            source_name=f"Course: {course_title}"
        )
    
    return apkg_path
