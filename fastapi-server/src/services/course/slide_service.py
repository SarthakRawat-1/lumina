from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from src.db.mongodb import MongoDB
from src.db.helpers import get_chapter_or_404, get_course_language
from src.utils.translation import get_translation_service
from src.agents.course.slides import get_slide_agent
from src.models.course import SlideContent


async def get_slide_images(key_concepts: List[str]) -> dict:
    return {}


async def get_cached_chapter_slides(chapter_id: str) -> Optional[SlideContent]:
    chapters = MongoDB.chapters()
    try:
        chapter = await chapters.find_one({"_id": ObjectId(chapter_id)})
        if chapter and chapter.get("cached_slides"):
            cached = chapter["cached_slides"]
            return SlideContent(
                slides_html=cached["slides_html"],
                slide_count=cached["slide_count"],
                key_concepts=cached.get("key_concepts", [])
            )
    except Exception:
        pass
    return None


async def cache_chapter_slides(chapter_id: str, slides: SlideContent) -> None:
    chapters = MongoDB.chapters()
    try:
        await chapters.update_one(
            {"_id": ObjectId(chapter_id)},
            {"$set": {
                "cached_slides": {
                    "slides_html": slides.slides_html,
                    "slide_count": slides.slide_count,
                    "key_concepts": slides.key_concepts,
                    "generated_at": datetime.utcnow()
                }
            }}
        )
    except Exception:
        pass


async def get_cached_course_slides(course_id: str) -> Optional[SlideContent]:
    courses = MongoDB.courses()
    try:
        course = await courses.find_one({"_id": ObjectId(course_id)})
        if course and course.get("cached_slides"):
            cached = course["cached_slides"]
            return SlideContent(
                slides_html=cached["slides_html"],
                slide_count=cached["slide_count"],
                key_concepts=cached.get("key_concepts", [])
            )
    except Exception:
        pass
    return None


async def cache_course_slides(course_id: str, slides: SlideContent) -> None:
    courses = MongoDB.courses()
    try:
        await courses.update_one(
            {"_id": ObjectId(course_id)},
            {"$set": {
                "cached_slides": {
                    "slides_html": slides.slides_html,
                    "slide_count": slides.slide_count,
                    "key_concepts": slides.key_concepts,
                    "generated_at": datetime.utcnow()
                }
            }}
        )
    except Exception:
        pass


async def generate_chapter_slides(
    chapter_id: str,
    num_slides: int = 15,
    include_images: bool = True,
    force_regenerate: bool = False
) -> SlideContent:
    if not force_regenerate:
        cached = await get_cached_chapter_slides(chapter_id)
        if cached:
            return cached

    chapter = await get_chapter_or_404(chapter_id)

    course_id = chapter.get("course_id", "")
    language = await get_course_language(course_id)

    agent = get_slide_agent()
    
    learning_objectives = chapter.get("learning_objectives", [])
    if not learning_objectives:
        learning_objectives = chapter.get("key_takeaways", ["Understand the topic"])

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

    result = await agent.generate_slides(
        title=chapter.get("title", ""),
        summary=chapter.get("summary", ""),
        learning_objectives=learning_objectives,
        difficulty="intermediate",
        num_slides=num_slides,
        context=chapter_content
    )
    
    slides_html = result.slides_html
    key_concepts = result.key_concepts

    concept_images = None
    if include_images and key_concepts:
        concept_images = await get_slide_images(key_concepts)

    if language != "en":
        translator = get_translation_service()
        slides_html = await translator.translate_html(slides_html, language)
        key_concepts = await translator.translate_batch(key_concepts, language)
    
    slides = SlideContent(
        slides_html=slides_html,
        slide_count=result.slide_count,
        key_concepts=key_concepts
    )

    await cache_chapter_slides(chapter_id, slides)
    
    return slides


async def generate_course_slides(
    course_id: str,
    num_slides: int = 30,
    include_images: bool = True,
    force_regenerate: bool = False
) -> SlideContent:
    if not force_regenerate:
        cached = await get_cached_course_slides(course_id)
        if cached:
            return cached

    courses = MongoDB.courses()
    try:
        course = await courses.find_one({"_id": ObjectId(course_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    language = course.get("language", "en")
    course_title = course.get("title", "Course")
    course_description = course.get("description", "")

    chapters_col = MongoDB.chapters()
    cursor = chapters_col.find({"course_id": course_id}).sort("index", 1)

    all_objectives = []
    combined_content = []
    
    async for chapter in cursor:
        chapter_title = chapter.get("title", "")
        chapter_content = chapter.get("content", "")
        objectives = chapter.get("learning_objectives", []) or chapter.get("key_takeaways", [])
        
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

        if chapter_content:
            combined_content.append(f"# {chapter_title}\n\n{chapter_content}")
        all_objectives.extend(objectives)
    
    if not combined_content:
        raise HTTPException(status_code=400, detail="Course has no chapter content to generate slides from")
    
    full_content = "\n\n---\n\n".join(combined_content)

    agent = get_slide_agent()
    
    result = await agent.generate_slides(
        title=course_title,
        summary=course_description,
        learning_objectives=all_objectives[:10],
        difficulty=course.get("difficulty", "intermediate"),
        num_slides=num_slides,
        context=full_content
    )
    
    slides_html = result.slides_html
    key_concepts = result.key_concepts
 
    concept_images = None
    if include_images and key_concepts:
        concept_images = await get_slide_images(key_concepts)

    if language != "en":
        translator = get_translation_service()
        slides_html = await translator.translate_html(slides_html, language)
        key_concepts = await translator.translate_batch(key_concepts, language)
    
    slides = SlideContent(
        slides_html=slides_html,
        slide_count=result.slide_count,
        key_concepts=key_concepts
    )

    await cache_course_slides(course_id, slides)
    
    return slides

