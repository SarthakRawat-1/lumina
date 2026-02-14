import httpx
from typing import Optional, Any
from src.config.settings import settings


class AnalyticsService:
    def __init__(self):
        self.express_url = getattr(settings, 'express_url', 'http://localhost:3002')
        self.track_endpoint = f"{self.express_url}/api/analytics/track"
    
    async def track(
        self,
        user_id: str,
        event_type: str,
        metadata: Optional[dict[str, Any]] = None
    ) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    self.track_endpoint,
                    json={
                        "userId": user_id,
                        "eventType": event_type,
                        "metadata": metadata or {},
                    }
                )
                return response.status_code == 201
        except Exception as e:
            print(f"Analytics tracking failed: {e}")
            return False
    
    async def track_course_created(self, user_id: str, course_id: str, title: str) -> bool:
        return await self.track(user_id, "course_created", {
            "courseId": course_id,
            "title": title,
        })
    
    async def track_chapter_completed(self, user_id: str, course_id: str, chapter_id: str) -> bool:
        return await self.track(user_id, "chapter_completed", {
            "courseId": course_id,
            "chapterId": chapter_id,
        })
    
    async def track_course_completed(self, user_id: str, course_id: str) -> bool:
        return await self.track(user_id, "course_completed", {
            "courseId": course_id,
        })
    
    async def track_roadmap_created(self, user_id: str, roadmap_id: str, topic: str) -> bool:
        return await self.track(user_id, "roadmap_created", {
            "roadmapId": roadmap_id,
            "topic": topic,
        })
    
    async def track_roadmap_node_completed(self, user_id: str, roadmap_id: str, node_id: str) -> bool:
        return await self.track(user_id, "roadmap_node_completed", {
            "roadmapId": roadmap_id,
            "nodeId": node_id,
        })
    
    async def track_video_created(self, user_id: str, video_id: str, topic: str) -> bool:
        return await self.track(user_id, "video_created", {
            "videoId": video_id,
            "topic": topic,
        })
    
    async def track_quiz_completed(self, user_id: str, score: int, total: int, topic: str) -> bool:
        return await self.track(user_id, "quiz_completed", {
            "score": score,
            "totalQuestions": total,
            "topic": topic,
        })
    
    async def track_slides_created(self, user_id: str, title: str) -> bool:
        return await self.track(user_id, "slides_created", {
            "title": title,
        })

_analytics_service: Optional[AnalyticsService] = None

def get_analytics_service() -> AnalyticsService:
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AnalyticsService()
    return _analytics_service
