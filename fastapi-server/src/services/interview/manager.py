from datetime import datetime
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from src.db.mongodb import get_database

class InterviewManager:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.interviews

    async def create_interview(self, user_id: str, industry: str, role: str, resume_text: str = None) -> str:
        interview_doc = {
            "user_id": user_id,
            "industry": industry,
            "role": role,
            "resume_text": resume_text,
            "status": "pending",
            "evaluations": [],
            "violations": [],
            "started_at": datetime.utcnow()
        }
        result = await self.collection.insert_one(interview_doc)
        return str(result.inserted_id)

    async def add_evaluation(self, interview_id: str, category: str, score: int, notes: str = None):
        from bson import ObjectId
        evaluation = {
            "category": category,
            "score": score,
            "notes": notes,
            "timestamp": datetime.utcnow()
        }
        await self.collection.update_one(
            {"_id": ObjectId(interview_id)},
            {"$push": {"evaluations": evaluation}}
        )

    async def add_violation(self, interview_id: str, type: str, description: str):
        from bson import ObjectId
        violation = {
            "type": type,
            "description": description,
            "timestamp": datetime.utcnow()
        }
        await self.collection.update_one(
            {"_id": ObjectId(interview_id)},
            {"$push": {"violations": violation}}
        )

    async def complete_interview(self, interview_id: str, report: dict, recording_url: str = None):
        from bson import ObjectId
        update_data = {
            "status": "completed",
            "ended_at": datetime.utcnow(),
            "report": report
        }
        if recording_url:
            update_data["recording_url"] = recording_url

        await self.collection.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": update_data}
        )

    async def get_user_interviews(self, user_id: str) -> list[dict]:
        cursor = self.collection.find({"user_id": user_id}).sort("started_at", -1)
        interviews = await cursor.to_list(length=100)
        
        results = []
        for interview in interviews:
            interview["id"] = str(interview["_id"])
            del interview["_id"]
            
            # Extract overall_score from report for frontend display
            report = interview.get("report")
            if report and isinstance(report, dict):
                interview["overall_score"] = report.get("overall_score")
            
            results.append(interview)
            
        return results
    
    async def get_interview(self, interview_id: str) -> Optional[dict]:
        from bson import ObjectId
        try:
             return await self.collection.find_one({"_id": ObjectId(interview_id)})
        except:
            return None

_interview_manager = None

async def get_interview_manager() -> InterviewManager:
    global _interview_manager
    if not _interview_manager:
        db = await get_database()
        _interview_manager = InterviewManager(db)
    return _interview_manager
