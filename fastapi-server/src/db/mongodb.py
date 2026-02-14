from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

from src.config.settings import settings


COURSES_COLLECTION = "courses"
CHAPTERS_COLLECTION = "chapters"
QUESTIONS_COLLECTION = "questions"
CHAT_MESSAGES_COLLECTION = "chat_messages"

ROADMAPS_COLLECTION = "roadmaps"
ROADMAP_NODE_DETAILS_COLLECTION = "roadmap_node_details"
USER_ROADMAP_PROGRESS_COLLECTION = "user_roadmap_progress"

VIDEOS_COLLECTION = "videos"

VIDEO_LIBRARY_COLLECTION = "video_library"
VIDEO_SEGMENTS_COLLECTION = "video_segments"
VIDEO_CHAT_HISTORY_COLLECTION = "video_chat_history"


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect(cls) -> None:
        cls.client = AsyncIOMotorClient(settings.mongodb_uri)
        cls.db = cls.client[settings.mongodb_db_name]

        await cls.client.admin.command("ping")
        print(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")
    
    @classmethod
    async def close(cls) -> None:
        if cls.client:
            cls.client.close()
            print("🔌 MongoDB connection closed")
    
    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        if cls.db is None:
            raise RuntimeError("Database not connected. Call MongoDB.connect() first.")
        return cls.db
    
    @classmethod
    def get_collection(cls, name: str):
        return cls.get_db()[name]
    

    @classmethod
    def courses(cls):
        return cls.get_db()[COURSES_COLLECTION]
    
    @classmethod
    def chapters(cls):
        return cls.get_db()[CHAPTERS_COLLECTION]
    
    @classmethod
    def questions(cls):
        return cls.get_db()[QUESTIONS_COLLECTION]
    
    @classmethod
    def chat_messages(cls):
        return cls.get_db()[CHAT_MESSAGES_COLLECTION]
    
    @classmethod
    def roadmaps(cls):
        return cls.get_db()[ROADMAPS_COLLECTION]
    
    @classmethod
    def roadmap_node_details(cls):
        return cls.get_db()[ROADMAP_NODE_DETAILS_COLLECTION]
    
    @classmethod
    def user_roadmap_progress(cls):
        return cls.get_db()[USER_ROADMAP_PROGRESS_COLLECTION]
    
    @classmethod
    def videos(cls):
        return cls.get_db()[VIDEOS_COLLECTION]
    
    @classmethod
    def video_library(cls):
        return cls.get_db()[VIDEO_LIBRARY_COLLECTION]
    
    @classmethod
    def video_segments(cls):
        return cls.get_db()[VIDEO_SEGMENTS_COLLECTION]
    
    @classmethod
    def video_chat_history(cls):
        return cls.get_db()[VIDEO_CHAT_HISTORY_COLLECTION]


async def get_database() -> AsyncIOMotorDatabase:
    return MongoDB.get_db()
