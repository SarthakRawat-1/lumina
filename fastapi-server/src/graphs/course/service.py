from datetime import datetime
from typing import Optional
from bson import ObjectId

from src.utils.vector import get_vector_service
from src.db.mongodb import MongoDB, COURSES_COLLECTION, CHAPTERS_COLLECTION, QUESTIONS_COLLECTION


class CourseService:
    def __init__(self):
        self.vector_service = get_vector_service()
    
    async def create_course(
        self,
        course_id: str,
        topic: str,
        time_hours: int,
        difficulty: str,
        language: str,
        document_ids: list[str] = None,
        generate_content: bool = True
    ) -> str:
        from src.graphs.course.graph import course_graph

        context = None
        if document_ids:
            context = await self.vector_service.get_context_for_topic(
                topic=topic,
                course_id="temp"
            )

        result = await course_graph.ainvoke({
            "topic": topic,
            "time_hours": time_hours,
            "difficulty": difficulty,
            "language": language,
            "generate_content": generate_content,
            "context": context,
            "course_plan": None,
            "chapters": [],
            "current_node_index": 0, 
            "status": "starting",
            "error": None,
            "course_id": course_id
        })
        
        if result.get("error"):
            raise Exception(result["error"])
        
        return result["course_id"]
    
    async def get_course(self, course_id: str) -> Optional[dict]:
        courses = MongoDB.get_collection(COURSES_COLLECTION)
        course = await courses.find_one({"_id": ObjectId(course_id)})
        
        if course:
            course["id"] = str(course.pop("_id"))
        
        return course
    
    async def list_courses(
        self,
        skip: int = 0,
        limit: int = 20,
        user_id: str = None
    ) -> tuple[list[dict], int]:
        courses = MongoDB.get_collection(COURSES_COLLECTION)
        
        query = {}
        if user_id:
            query["user_id"] = user_id
        
        total = await courses.count_documents(query)
        cursor = courses.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        result = []
        async for course in cursor:
            result.append(course)
        
        return result, total

    
    async def delete_course(self, course_id: str) -> bool:
        courses = MongoDB.get_collection(COURSES_COLLECTION)
        chapters_col = MongoDB.get_collection(CHAPTERS_COLLECTION)
        questions_col = MongoDB.get_collection(QUESTIONS_COLLECTION)

        chapters = await chapters_col.find({"course_id": course_id}).to_list(100)
        for chapter in chapters:
            await questions_col.delete_many({"chapter_id": str(chapter["_id"])})

        await chapters_col.delete_many({"course_id": course_id})

        result = await courses.delete_one({"_id": ObjectId(course_id)})

        await self.vector_service.delete_by_course(course_id)
        
        return result.deleted_count > 0


_course_service = None


def get_course_service() -> CourseService:
    global _course_service
    if _course_service is None:
        _course_service = CourseService()
    return _course_service
