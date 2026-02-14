from typing import Optional
from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from src.db.mongodb import (
    MongoDB,
    COURSES_COLLECTION,
    CHAPTERS_COLLECTION,
    CHAT_MESSAGES_COLLECTION,
    QUESTIONS_COLLECTION,
)

def validate_object_id(id_str: str, name: str = "ID") -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid {name}")


async def get_course_or_404(course_id: str) -> dict:
    courses_col = MongoDB.get_collection(COURSES_COLLECTION)
    oid = validate_object_id(course_id, "course ID")
    
    course = await courses_col.find_one({"_id": oid})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course


async def get_course_language(course_id: str) -> str:
    courses_col = MongoDB.get_collection(COURSES_COLLECTION)
    try:
        oid = ObjectId(course_id)
        course = await courses_col.find_one({"_id": oid})
        return course.get("language", "en") if course else "en"
    except Exception:
        return "en"


async def get_chapter_or_404(chapter_id: str, course_id: Optional[str] = None) -> dict:
    chapters_col = MongoDB.get_collection(CHAPTERS_COLLECTION)
    oid = validate_object_id(chapter_id, "chapter ID")
    
    query = {"_id": oid}
    if course_id:
        query["course_id"] = course_id
    
    chapter = await chapters_col.find_one(query)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    return chapter


async def get_chapter_with_language(chapter_id: str) -> tuple[dict, str]:
    chapter = await get_chapter_or_404(chapter_id)
    course_id = chapter.get("course_id", "")
    language = await get_course_language(course_id)
    return chapter, language


async def get_message_or_404(message_id: str) -> dict:
    messages_col = MongoDB.get_collection(CHAT_MESSAGES_COLLECTION)
    oid = validate_object_id(message_id, "message ID")
    
    message = await messages_col.find_one({"_id": oid})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return message


async def get_question_or_404(question_id: str, chapter_id: Optional[str] = None) -> dict:
    questions_col = MongoDB.get_collection(QUESTIONS_COLLECTION)
    oid = validate_object_id(question_id, "question ID")
    
    query = {"_id": oid}
    if chapter_id:
        query["chapter_id"] = chapter_id
    
    question = await questions_col.find_one(query)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return question
