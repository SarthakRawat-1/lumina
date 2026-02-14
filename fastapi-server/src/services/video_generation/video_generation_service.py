from datetime import datetime
from typing import List, Optional
from bson import ObjectId

from src.db.mongodb import MongoDB
from src.agents.video_generation.video_agent import get_video_agent
from src.models.video_generation.schemas import (
    VideoBlueprint,
    VideoResponse,
    VideoListItem,
    SUPPORTED_LANGUAGES,
)


class VideoGenerationService:
    def __init__(self):
        self.agent = get_video_agent()

    async def generate_video(
        self,
        topic: str,
        language: str = "English (US)",
        duration_mode: str = "short",
        user_id: Optional[str] = None,
    ) -> dict:
        blueprint: VideoBlueprint = await self.agent.generate_video(
            topic=topic, language=language, duration_mode=duration_mode
        )

        video_doc = {
            "video_id": blueprint.video_id,
            "topic": blueprint.topic,
            "language": blueprint.language,
            "duration_mode": blueprint.duration_mode,
            "fps": blueprint.fps,
            "total_duration_frames": blueprint.total_duration_frames,
            "scenes": [scene.model_dump() for scene in blueprint.scenes],
            "user_id": user_id,
            "created_at": datetime.utcnow(),
        }

        result = await MongoDB.videos().insert_one(video_doc)
        video_doc["id"] = str(result.inserted_id)
        video_doc["total_duration_seconds"] = blueprint.total_duration_frames / 30

        return video_doc

    async def get_video(self, video_id: str) -> dict:
        video = await MongoDB.videos().find_one({"video_id": video_id})

        if not video:
            try:
                video = await MongoDB.videos().find_one({"_id": ObjectId(video_id)})
            except Exception:
                pass

        if not video:
            raise ValueError("Video not found")

        video["id"] = str(video.pop("_id"))
        video["total_duration_seconds"] = video["total_duration_frames"] / 30

        return video

    async def list_videos(
        self, skip: int = 0, limit: int = 20, user_id: Optional[str] = None
    ) -> List[dict]:
        query = {}
        if user_id:
            query["user_id"] = user_id

        cursor = (
            MongoDB.videos().find(query).sort("created_at", -1).skip(skip).limit(limit)
        )

        result = []
        async for video in cursor:
            result.append(
                {
                    "id": str(video["_id"]),
                    "video_id": video["video_id"],
                    "topic": video["topic"],
                    "language": video["language"],
                    "duration_seconds": video["total_duration_frames"] / 30,
                    "scene_count": len(video.get("scenes", [])),
                    "created_at": video["created_at"],
                }
            )

        return result

    async def delete_video(self, video_id: str) -> dict:
        result = await MongoDB.videos().delete_one({"video_id": video_id})

        if result.deleted_count == 0:
            raise ValueError("Video not found")

        return {"message": "Video deleted", "video_id": video_id}

    def get_available_languages(self) -> List[dict]:
        return [
            {"code": lang, "name": lang, "native": lang} for lang in SUPPORTED_LANGUAGES
        ]


_video_generation_service: Optional[VideoGenerationService] = None


def get_video_generation_service() -> VideoGenerationService:
    global _video_generation_service
    if _video_generation_service is None:
        _video_generation_service = VideoGenerationService()
    return _video_generation_service
