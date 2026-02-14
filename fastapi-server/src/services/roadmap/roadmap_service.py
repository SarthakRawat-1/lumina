from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from src.db.mongodb import MongoDB
from src.agents.roadmap.roadmap_agent import get_roadmap_agent
from src.utils.translation import get_translation_service
from src.utils.analytics import get_analytics_service


class RoadmapService:
    def __init__(self):
        self.agent = get_roadmap_agent()
        self.translator = get_translation_service()

    async def generate_roadmap(
        self,
        topic: str,
        goal: str = None,
        skill_level: str = "beginner",
        language: str = "en",
        user_id: str = None
    ):
        cache_key = f"{topic.lower().strip()}_{language}"
        existing = await MongoDB.roadmaps().find_one({"cache_key": cache_key})

        if existing:
            existing["id"] = str(existing.pop("_id"))
            return existing

        roadmap = await self.agent.generate_roadmap(
            topic=topic,
            goal=goal,
            skill_level=skill_level
        )

        title = roadmap.title
        description = roadmap.description
        nodes = [node.model_dump() for node in roadmap.nodes]

        if language != "en":
            title = await self.translator.translate(title, language)
            description = await self.translator.translate(description, language)
            for node in nodes:
                node["label"] = await self.translator.translate(node["label"], language)

        roadmap_doc = {
            "cache_key": cache_key,
            "topic": topic,
            "title": title,
            "description": description,
            "nodes": nodes,
            "edges": [edge.model_dump() for edge in roadmap.edges],
            "language": language,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
        }

        result = await MongoDB.roadmaps().insert_one(roadmap_doc)
        roadmap_doc["id"] = str(result.inserted_id)
        if "_id" in roadmap_doc:
            del roadmap_doc["_id"]
        del roadmap_doc["cache_key"]

        if user_id:
            analytics = get_analytics_service()
            await analytics.track_roadmap_created(user_id, roadmap_doc["id"], topic)

        return roadmap_doc

    async def get_roadmap(self, roadmap_id: str):
        try:
            roadmap = await MongoDB.roadmaps().find_one({"_id": ObjectId(roadmap_id)})
        except Exception:
            raise ValueError("Invalid roadmap ID")

        if not roadmap:
            raise ValueError("Roadmap not found")

        roadmap["id"] = str(roadmap.pop("_id"))
        if "cache_key" in roadmap:
            del roadmap["cache_key"]

        return roadmap

    async def get_node_details(self, roadmap_id: str, node_id: str, language: str = "en"):
        cache_key = f"{roadmap_id}_{node_id}_{language}"
        existing = await MongoDB.roadmap_node_details().find_one({"cache_key": cache_key})

        if existing:
            existing["id"] = str(existing.pop("_id"))
            del existing["cache_key"]
            return existing

        try:
            roadmap = await MongoDB.roadmaps().find_one({"_id": ObjectId(roadmap_id)})
        except Exception:
            raise ValueError("Invalid roadmap ID")

        if not roadmap:
            raise ValueError("Roadmap not found")

        node = next((n for n in roadmap["nodes"] if n["id"] == node_id), None)
        if not node:
            raise ValueError("Node not found")

        details = await self.agent.generate_node_details(
            node_label=node["label"],
            roadmap_context=roadmap["topic"]
        )

        details_dict = details.model_dump()
        if language != "en":
            details_dict["title"] = await self.translator.translate(details_dict["title"], language)
            details_dict["description"] = await self.translator.translate(details_dict["description"], language)
            details_dict["estimated_time"] = await self.translator.translate(details_dict["estimated_time"], language)
            for i, concept in enumerate(details_dict["key_concepts"]):
                details_dict["key_concepts"][i] = await self.translator.translate(concept, language)
            for resource in details_dict["resources"]:
                resource["title"] = await self.translator.translate(resource["title"], language)

        details_doc = {
            "cache_key": cache_key,
            "roadmap_id": roadmap_id,
            "node_id": node_id,
            "language": language,
            **details_dict,
            "created_at": datetime.utcnow(),
        }

        result = await MongoDB.roadmap_node_details().insert_one(details_doc)
        details_doc["id"] = str(result.inserted_id)
        if "_id" in details_doc:
            del details_doc["_id"]
        del details_doc["cache_key"]

        return details_doc

    async def get_user_progress(self, roadmap_id: str, user_id: str):
        progress = await MongoDB.user_roadmap_progress().find_one({
            "roadmap_id": roadmap_id,
            "user_id": user_id
        })

        if not progress:
            return {
                "roadmap_id": roadmap_id,
                "user_id": user_id,
                "status": {}
            }

        return {
            "roadmap_id": roadmap_id,
            "user_id": user_id,
            "status": progress.get("status", {})
        }

    async def update_user_progress(
        self,
        roadmap_id: str,
        user_id: str,
        node_id: str,
        status: str
    ):
        
        valid_statuses = ["pending", "in_progress", "completed", "skipped"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")

        await MongoDB.user_roadmap_progress().update_one(
            {"roadmap_id": roadmap_id, "user_id": user_id},
            {
                "$set": {
                    f"status.{node_id}": status,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "roadmap_id": roadmap_id,
                    "user_id": user_id,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        return {
            "message": "Progress updated",
            "node_id": node_id,
            "status": status
        }

    async def list_roadmaps(self, skip: int = 0, limit: int = 20, user_id: str = None):
        query = {}
        if user_id:
            query["user_id"] = user_id

        cursor = MongoDB.roadmaps().find(query).sort("created_at", -1).skip(skip).limit(limit)

        result = []
        async for roadmap in cursor:
            result.append({
                "id": str(roadmap["_id"]),
                "topic": roadmap["topic"],
                "title": roadmap["title"],
                "description": roadmap["description"],
                "language": roadmap["language"],
                "node_count": len(roadmap.get("nodes", [])),
                "created_at": roadmap["created_at"]
            })

        return result


_roadmap_service = None


def get_roadmap_service() -> RoadmapService:
    global _roadmap_service
    if _roadmap_service is None:
        _roadmap_service = RoadmapService()
    return _roadmap_service
