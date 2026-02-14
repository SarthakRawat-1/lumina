from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from bson import ObjectId

from src.models.schemas import (
    CourseCreate, 
    CourseResponse, 
    CourseListResponse,
    CourseStatus,
    Difficulty,
    Language,
    TopicNode,
    TopicEdge,
    NodeStatus
)
from src.graphs.course import get_course_service
from src.utils.analytics import get_analytics_service
from src.db.mongodb import MongoDB
from src.db.helpers import get_course_or_404


router = APIRouter()


def _convert_course_to_response(course: dict) -> CourseResponse:
    nodes = []
    for node_data in course.get("nodes", []):
        nodes.append(TopicNode(
            id=node_data.get("id", ""),
            title=node_data.get("title", ""),
            summary=node_data.get("summary", ""),
            learning_objectives=node_data.get("learning_objectives", []),
            time_minutes=node_data.get("time_minutes", 15),
            status=NodeStatus(node_data.get("status", "locked"))
        ))
    
    edges = []
    for edge_data in course.get("edges", []):
        edges.append(TopicEdge(
            source=edge_data.get("source", ""),
            target=edge_data.get("target", "")
        ))
    
    return CourseResponse(
        id=str(course["_id"]),
        topic=course.get("topic", ""),
        title=course.get("title", ""),
        description=course.get("description", ""),
        time_hours=course.get("time_hours", 1),
        difficulty=Difficulty(course.get("difficulty", "beginner")),
        language=Language(course.get("language", "en")),
        status=CourseStatus(course.get("status", "creating")),
        chapter_count=course.get("chapter_count", 0),
        image_url=course.get("image_url"),
        nodes=nodes,
        edges=edges,
        created_at=course.get("created_at", datetime.utcnow()),
        updated_at=course.get("updated_at"),
    )


@router.post("/courses", response_model=CourseResponse)
async def create_course(
    course: CourseCreate,
    background_tasks: BackgroundTasks
):
    course_service = get_course_service()
    analytics = get_analytics_service()

    course_doc = {
        "topic": course.topic,
        "title": f"Creating: {course.topic[:50]}...",
        "description": "Course is being generated...",
        "time_hours": course.time_hours,
        "difficulty": course.difficulty.value,
        "language": course.language.value,
        "status": CourseStatus.CREATING.value,
        "chapter_count": 0,
        "user_id": course.user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await MongoDB.courses().insert_one(course_doc)
    course_id = str(result.inserted_id)
    user_id = course.user_id
    topic = course.topic
    
    async def generate_course():
        try:
            await course_service.create_course(
                course_id=course_id,
                topic=course.topic,
                time_hours=course.time_hours,
                difficulty=course.difficulty.value,
                language=course.language.value,
                document_ids=course.document_ids,
                generate_content=course.generate_content
            )
            if user_id:
                await analytics.track_course_created(user_id, course_id, topic)
        except Exception as e:
            print(f"Course generation failed: {e}")
            await MongoDB.courses().update_one(
                {"_id": ObjectId(course_id)},
                {
                    "$set": {
                        "status": CourseStatus.FAILED.value,
                        "error_message": str(e),
                        "updated_at": datetime.utcnow(),
                    }
                }
            )
    
    background_tasks.add_task(generate_course)
    
    return CourseResponse(
        id=course_id,
        topic=course.topic,
        title=course_doc["title"],
        description=course_doc["description"],
        time_hours=course.time_hours,
        difficulty=course.difficulty,
        language=course.language,
        status=CourseStatus.CREATING,
        chapter_count=0,
        created_at=course_doc["created_at"]
    )


@router.get("/courses", response_model=CourseListResponse)
async def list_courses(skip: int = 0, limit: int = 20, user_id: str = None):
    course_service = get_course_service()
    courses, total = await course_service.list_courses(skip, limit, user_id)
    
    course_list = [_convert_course_to_response(c) for c in courses]
    return CourseListResponse(courses=course_list, total=total)


@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    course = await get_course_or_404(course_id)
    return _convert_course_to_response(course)


@router.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    course_service = get_course_service()
    
    try:
        deleted = await course_service.delete_course(course_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {"message": "Course deleted successfully", "id": course_id}
