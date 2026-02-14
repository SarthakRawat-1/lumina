from datetime import datetime
from typing import List, Optional

from bson import ObjectId

from src.models.schemas import ChapterSummary, ChapterDetail
from src.db.mongodb import MongoDB
from src.db.helpers import get_course_or_404, get_chapter_or_404, get_course_language


class ChapterService:
    async def list_chapters(self, course_id: str) -> List[ChapterSummary]:
        await get_course_or_404(course_id)

        cursor = MongoDB.chapters().find({"course_id": course_id}).sort("index", 1)
        
        chapter_list = []
        async for chapter in cursor:
            chapter_list.append(ChapterSummary(
                id=str(chapter["_id"]),
                index=chapter.get("index", 0),
                title=chapter.get("title", ""),
                summary=chapter.get("summary", ""),
                time_minutes=chapter.get("time_minutes", 10),
                is_completed=chapter.get("is_completed", False),
                node_id=chapter.get("node_id"),
                sections=chapter.get("sections", []),
                images=chapter.get("images", []),
                image_url=chapter.get("image_url"),
            ))
        
        return chapter_list
    
    async def get_chapter(self, course_id: str, chapter_id: str) -> ChapterDetail:
        chapter = await get_chapter_or_404(chapter_id, course_id)
        
        return ChapterDetail(
            id=str(chapter["_id"]),
            course_id=chapter.get("course_id", ""),
            node_id=chapter.get("node_id"),
            index=chapter.get("index", 0),
            title=chapter.get("title", ""),
            summary=chapter.get("summary", ""),
            content=chapter.get("content", ""),
            sections=chapter.get("sections", []),
            time_minutes=chapter.get("time_minutes", 10),
            is_completed=chapter.get("is_completed", False),
            image_url=chapter.get("image_url"),
            images=chapter.get("images", []),
        )
    
    async def mark_complete(self, course_id: str, chapter_id: str) -> bool:
        result = await MongoDB.chapters().update_one(
            {"_id": ObjectId(chapter_id), "course_id": course_id},
            {"$set": {"is_completed": True, "completed_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return False

        try:
            chapter = await MongoDB.chapters().find_one({"_id": ObjectId(chapter_id)})
            node_id = chapter.get("node_id")
            
            if node_id:
                course_col = MongoDB.courses()
                course = await course_col.find_one({"_id": ObjectId(course_id)})
                
                if course:
                    nodes = course.get("nodes", [])
                    edges = course.get("edges", [])
                    updated = False

                    for node in nodes:
                        if node["id"] == node_id:
                            node["status"] = "completed"
                            updated = True
                            break
                    
                    if updated:
                        dependent_node_ids = [e["target"] for e in edges if e["source"] == node_id]
                        
                        for node in nodes:
                            if node["id"] in dependent_node_ids and node["status"] == "locked":
                                node["status"] = "unlocked"

                        await course_col.update_one(
                            {"_id": ObjectId(course_id)},
                            {"$set": {"nodes": nodes}}
                        )
                        
        except Exception as e:
            print(f"Failed to update graph status: {e}")
            
        return True
    
    async def mark_incomplete(self, course_id: str, chapter_id: str) -> bool:
        result = await MongoDB.chapters().update_one(
            {"_id": ObjectId(chapter_id), "course_id": course_id},
            {"$set": {"is_completed": False}, "$unset": {"completed_at": ""}}
        )
        return result.matched_count > 0
    
    async def get_audio(
        self,
        course_id: str,
        chapter_id: str,
        rate: float = 1.0
    ) -> Optional[bytes]:
        from src.utils.tts import get_tts_service

        chapter = await get_chapter_or_404(chapter_id, course_id)

        language = await get_course_language(course_id)

        content = chapter.get("content", "")
        title = chapter.get("title", "")
        summary = chapter.get("summary", "")

        if not content and "sections" in chapter:
            sections = chapter["sections"]
            content_parts = []

            for section in sections:
                if isinstance(section, dict):
                    if section.get("title"):
                        content_parts.append(section["title"])

                    for paragraph in (section.get("paragraphs") or []):
                        content_parts.append(paragraph)

                    for bullet in (section.get("bullets") or []):
                        content_parts.append(bullet)

                    if section.get("text"):
                        content_parts.append(section["text"])

                    if section.get("body"):
                        content_parts.append(section["body"])

                    if section.get("tip"):
                        content_parts.append(f"Tip: {section['tip']}")

            content = " ".join(content_parts)

        # Fallback to summary if no content
        if not content and summary:
            content = summary

        if not content:
            print(f"[Audio] No content found for chapter {chapter_id}. Keys: {list(chapter.keys())}")
            return None

        tts_service = get_tts_service()
        full_text = f"{title}. {content}"

        audio = await tts_service.synthesize_long_content(
            content=full_text,
            language=language,
            speaking_rate=max(0.5, min(2.0, rate))
        )

        return audio

    async def stream_audio(
        self,
        course_id: str,
        chapter_id: str,
        rate: float = 1.0
    ):
        """Async generator that yields audio chunks for streaming playback."""
        from src.utils.tts import get_tts_service

        chapter = await get_chapter_or_404(chapter_id, course_id)
        language = await get_course_language(course_id)

        content = chapter.get("content", "")
        title = chapter.get("title", "")
        summary = chapter.get("summary", "")

        if not content and "sections" in chapter:
            sections = chapter["sections"]
            content_parts = []
            for section in sections:
                if isinstance(section, dict):
                    if section.get("title"):
                        content_parts.append(section["title"])
                    for paragraph in (section.get("paragraphs") or []):
                        content_parts.append(paragraph)
                    for bullet in (section.get("bullets") or []):
                        content_parts.append(bullet)
                    if section.get("text"):
                        content_parts.append(section["text"])
                    if section.get("body"):
                        content_parts.append(section["body"])
                    if section.get("tip"):
                        content_parts.append(f"Tip: {section['tip']}")
            content = " ".join(content_parts)

        if not content and summary:
            content = summary

        if not content:
            return

        tts_service = get_tts_service()
        full_text = f"{title}. {content}"

        async for audio_chunk in tts_service.stream_long_content(
            content=full_text,
            language=language,
            speaking_rate=max(0.5, min(2.0, rate))
        ):
            yield audio_chunk


_chapter_service = None


def get_chapter_service() -> ChapterService:
    global _chapter_service
    if _chapter_service is None:
        _chapter_service = ChapterService()
    return _chapter_service
