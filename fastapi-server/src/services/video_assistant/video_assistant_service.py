import re
import os
import uuid
import logging
from datetime import datetime
from typing import Optional, List
from pathlib import Path
from bson import ObjectId

from src.db.mongodb import MongoDB
from src.agents.video_assistant.video_assistant_agent import get_video_assistant_agent
from src.agents.video_assistant.teach_back_agent import get_teach_back_agent
from src.utils.youtube import get_youtube_transcript_service, fetch_youtube_title
from src.utils.video_transcription import get_video_intelligence_service
from src.utils.youtube import extract_youtube_id
from src.utils.time import format_time
from src.utils.vector import get_vector_service

UPLOADS_DIR = Path(__file__).parent.parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

logger = logging.getLogger(__name__)


class VideoAssistantService:
    def __init__(self):
        self.agent = get_video_assistant_agent()
        self.teach_back_agent = get_teach_back_agent()
        logger.info("VideoAssistantService initialized with enhanced Teach Back Agent")

    async def add_video(
        self, url: str, title: str = None, language: str = "en", user_id: str = None
    ):
        youtube_id = extract_youtube_id(url)

        if not youtube_id:
            raise ValueError("Currently only YouTube URLs are supported")

        existing = await MongoDB.video_library().find_one({"source_id": youtube_id})
        if existing:
            segment_count = await MongoDB.video_segments().count_documents(
                {"video_id": str(existing["_id"])}
            )
            return {
                "id": str(existing["_id"]),
                "title": existing.get("title", ""),
                "source_type": existing.get("source_type", "youtube"),
                "source_id": existing.get("source_id", ""),
                "duration_seconds": existing.get("duration_seconds"),
                "language": existing.get("language", "en"),
                "segment_count": segment_count,
                "has_summary": existing.get("summary") is not None,
                "has_chapters": existing.get("chapters") is not None,
                "created_at": existing.get("created_at", datetime.utcnow()),
            }

        yt_service = get_youtube_transcript_service()
        transcript_data = await yt_service.get_transcript_with_timestamps(
            youtube_url=youtube_id, language=language
        )

        if not transcript_data.get("segments"):
            raise ValueError(
                "Could not extract transcript. Video may not have captions."
            )

        segments = transcript_data["segments"]

        title = title or f"YouTube Video: {youtube_id}"

        duration = segments[-1].get("end", 0) if segments else 0

        if title.startswith("YouTube Video:"):
            fetched_title = await fetch_youtube_title(youtube_id)
            if fetched_title:
                title = fetched_title

        video_doc = {
            "title": title,
            "source_type": "youtube",
            "source_id": youtube_id,
            "source_url": f"https://www.youtube.com/watch?v={youtube_id}",
            "duration_seconds": duration,
            "language": language,
            "summary": None,
            "chapters": None,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
        }

        result = await MongoDB.video_library().insert_one(video_doc)
        video_id = str(result.inserted_id)

        segment_docs = []
        for i, seg in enumerate(segments):
            segment_docs.append(
                {
                    "video_id": video_id,
                    "text": seg.get("text", ""),
                    "start_time": seg.get("start", 0),
                    "end_time": seg.get("end", 0),
                    "index": i,
                }
            )

        if segment_docs:
            await MongoDB.video_segments().insert_many(segment_docs)

            vector_service = get_vector_service()
            await vector_service.add_video_segments(video_id, segment_docs)

        logger.info(
            f"Added video {youtube_id} with {len(segment_docs)} segments (embedded in Chroma)"
        )

        return {
            "id": video_id,
            "title": title,
            "source_type": "youtube",
            "source_id": youtube_id,
            "duration_seconds": duration,
            "language": language,
            "segment_count": len(segment_docs),
            "has_summary": False,
            "has_chapters": False,
            "created_at": video_doc["created_at"],
        }

    async def upload_video(
        self, file, title: str, language: str = "en-US", user_id: str = None
    ):
        allowed_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
        file_ext = os.path.splitext(file.filename or "")[1].lower()

        if file_ext not in allowed_extensions:
            raise ValueError(
                f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )

        content = await file.read()
        if len(content) > 500_000_000:
            raise ValueError("File too large. Maximum size is 500MB.")

        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_ext}"
        file_path = UPLOADS_DIR / filename

        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"Saved uploaded video: {filename} ({len(content)} bytes)")

        transcription_service = get_video_intelligence_service()
        transcript_data = await transcription_service.transcribe_video_with_timestamps(
            content
        )

        if not transcript_data.get("segments"):
            logger.warning(f"Could not extract transcript from {filename}")
            segments = []
        else:
            segments = transcript_data["segments"]

        duration = 0.0
        if segments:
            for seg in segments:
                if seg.get("words"):
                    last_word = seg["words"][-1]
                    duration = max(duration, last_word.get("end", 0))

        video_doc = {
            "title": title,
            "source_type": "upload",
            "source_id": file_id,
            "source_url": f"/uploads/{filename}",
            "original_filename": file.filename,
            "file_size": len(content),
            "duration_seconds": duration,
            "language": language,
            "summary": None,
            "chapters": None,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
        }

        result = await MongoDB.video_library().insert_one(video_doc)
        video_id = str(result.inserted_id)

        segment_docs = []
        current_time = 0.0

        for i, seg in enumerate(segments):
            text = seg.get("text", "")
            words = seg.get("words", [])

            start_time = words[0].get("start", current_time) if words else current_time
            end_time = words[-1].get("end", start_time + 5) if words else start_time + 5

            segment_docs.append(
                {
                    "video_id": video_id,
                    "text": text,
                    "start_time": start_time,
                    "end_time": end_time,
                    "index": i,
                }
            )

            current_time = end_time

        if segment_docs:
            await MongoDB.video_segments().insert_many(segment_docs)

            vector_service = get_vector_service()
            await vector_service.add_video_segments(video_id, segment_docs)

        logger.info(
            f"Uploaded video {file_id} with {len(segment_docs)} segments (embedded in Chroma)"
        )

        return {
            "id": video_id,
            "title": title,
            "source_type": "upload",
            "source_id": file_id,
            "source_url": f"/uploads/{filename}",
            "duration_seconds": duration,
            "language": language,
            "segment_count": len(segment_docs),
            "has_summary": False,
            "has_chapters": False,
            "created_at": video_doc["created_at"],
        }

    async def get_video(self, video_id: str, user_id: str = None):
        try:
            query = {"_id": ObjectId(video_id)}
            if user_id:
                query["user_id"] = user_id

            video = await MongoDB.video_library().find_one(query)
        except Exception:
            raise ValueError("Invalid video ID")

        if not video:
            raise ValueError("Video not found")

        segment_count = await MongoDB.video_segments().count_documents(
            {"video_id": video_id}
        )

        return {
            "id": str(video["_id"]),
            "title": video.get("title", ""),
            "source_type": video.get("source_type", "youtube"),
            "source_id": video.get("source_id", ""),
            "source_url": video.get("source_url"),
            "duration_seconds": video.get("duration_seconds"),
            "language": video.get("language", "en"),
            "segment_count": segment_count,
            "has_summary": video.get("summary") is not None,
            "has_chapters": video.get("chapters") is not None,
            "created_at": video.get("created_at", datetime.utcnow()),
        }

    async def list_videos(self, skip: int = 0, limit: int = 20, user_id: str = None):
        query = {}
        if user_id:
            query["user_id"] = user_id

        cursor = (
            MongoDB.video_library()
            .find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        videos = []
        async for video in cursor:
            vid = str(video["_id"])
            segment_count = await MongoDB.video_segments().count_documents(
                {"video_id": vid}
            )
            videos.append(
                {
                    "id": vid,
                    "title": video.get("title", ""),
                    "source_type": video.get("source_type", "youtube"),
                    "source_id": video.get("source_id", ""),
                    "source_url": video.get("source_url"),
                    "duration_seconds": video.get("duration_seconds"),
                    "language": video.get("language", "en"),
                    "segment_count": segment_count,
                    "has_summary": video.get("summary") is not None,
                    "has_chapters": video.get("chapters") is not None,
                    "created_at": video.get("created_at", datetime.utcnow()),
                }
            )

        return videos

    async def ask_question(
        self, video_id: str, question: str, current_time: float = None, for_note: bool = False
    ):
        try:
            video = await MongoDB.video_library().find_one({"_id": ObjectId(video_id)})
        except Exception:
            raise ValueError("Invalid video ID")

        if not video:
            raise ValueError("Video not found")

        cursor = MongoDB.video_segments().find({"video_id": video_id}).sort("index", 1)
        segments = await cursor.to_list(length=None)

        if not segments:
            raise ValueError("No transcript segments found for this video")

        is_time_aware = self.agent.detect_time_aware_query(question)

        summary_keywords = [
            "summarize",
            "summary",
            "summarise",
            "overview",
            "what is this about",
            "what is the video about",
            "main points",
            "key takeaways",
            "tldr",
            "explain the video",
            "what did i learn",
            "recap",
        ]
        is_summary_request = any(
            keyword in question.lower() for keyword in summary_keywords
        )

        # Detect note requests from client
        note_keywords = [
            "note", "notes", "create a note", "add to notes", "save as note",
            "make a note", "write a note", "create note", "summarize in note",
            "document this", "write it down", "save this"
        ]
        is_note_request = for_note or any(
            keyword in question.lower() for keyword in note_keywords
        )

        # Note requests take priority - always use detailed prompt with full transcript
        if is_note_request:
            context_segments = segments
            result = await self.agent.answer_for_note(
                question=question,
                context_segments=context_segments,
                video_title=video.get("title", ""),
            )
        elif is_summary_request:
            context_segments = segments
            result = await self.agent.answer_question(
                question=question,
                context_segments=context_segments,
                video_title=video.get("title", ""),
            )
        elif is_time_aware and current_time is not None:
            result = await self.agent.answer_time_aware(
                question=question,
                segments=segments,
                current_time=current_time,
                video_title=video.get("title", ""),
            )
        else:
            vector_service = get_vector_service()
            context_segments = await vector_service.query_video_segments(
                video_id=video_id, query=question, n_results=20
            )

            if not context_segments:
                logger.info(
                    f"[ask_question] Chroma returned no results, falling back to MongoDB segments"
                )
                context_segments = segments[:30]

            result = await self.agent.answer_question(
                question=question,
                context_segments=context_segments,
                video_title=video.get("title", ""),
            )

        formatted_timestamps = []
        for ts in result.timestamps:
            seg_text = ""
            for seg in segments:
                if seg.get("start_time", 0) <= ts < seg.get("end_time", 0):
                    seg_text = seg.get("text", "")[:100]
                    break

            formatted_timestamps.append(
                {"seconds": ts, "formatted": format_time(ts), "text": seg_text}
            )

        return {
            "answer": result.answer,
            "confidence": result.confidence,
            "timestamps": formatted_timestamps,
        }

    async def get_summary(self, video_id: str, regenerate: bool = False):
        try:
            video = await MongoDB.video_library().find_one({"_id": ObjectId(video_id)})
        except Exception:
            raise ValueError("Invalid video ID")

        if not video:
            raise ValueError("Video not found")

        if video.get("summary") and not regenerate:
            cached = video["summary"]
            return {
                "summary": cached.get("summary", ""),
                "key_points": cached.get("key_points", []),
                "topics": cached.get("topics", []),
                "cached": True,
            }

        cursor = MongoDB.video_segments().find({"video_id": video_id}).sort("index", 1)
        segments = await cursor.to_list(length=None)

        if not segments:
            raise ValueError("No transcript segments found")

        full_transcript = " ".join(seg.get("text", "") for seg in segments)

        result = await self.agent.summarize(full_transcript, video.get("title", ""))

        summary_data = {
            "summary": result.summary,
            "key_points": result.key_points,
            "topics": result.topics,
        }

        await MongoDB.video_library().update_one(
            {"_id": ObjectId(video_id)}, {"$set": {"summary": summary_data}}
        )

        return {
            "summary": result.summary,
            "key_points": result.key_points,
            "topics": result.topics,
            "cached": False,
        }

    async def get_chapters(
        self, video_id: str, regenerate: bool = False, target_chapters: int = 8
    ):
        try:
            video = await MongoDB.video_library().find_one({"_id": ObjectId(video_id)})
        except Exception:
            raise ValueError("Invalid video ID")

        if not video:
            raise ValueError("Video not found")

        if video.get("chapters") and not regenerate:
            cached_chapters = video["chapters"]
            return {"chapters": cached_chapters, "cached": True}

        cursor = MongoDB.video_segments().find({"video_id": video_id}).sort("index", 1)
        segments = await cursor.to_list(length=None)

        if not segments:
            raise ValueError("No transcript segments found")

        result = await self.agent.generate_chapters(
            segments=segments,
            video_title=video.get("title", ""),
            target_chapters=target_chapters,
        )

        chapters_data = []
        for ch in result.chapters:
            chapters_data.append(
                {
                    "title": ch.title,
                    "start_time": ch.start_time,
                    "formatted_time": format_time(ch.start_time),
                    "summary": ch.summary,
                }
            )

        await MongoDB.video_library().update_one(
            {"_id": ObjectId(video_id)}, {"$set": {"chapters": chapters_data}}
        )

        return {"chapters": chapters_data, "cached": False}

    async def delete_video(self, video_id: str, user_id: str = None):
        try:
            query = {"_id": ObjectId(video_id)}
            if user_id:
                query["user_id"] = user_id

            result = await MongoDB.video_library().delete_one(query)
        except Exception:
            raise ValueError("Invalid video ID")

        if result.deleted_count == 0:
            raise ValueError("Video not found")

        await MongoDB.video_segments().delete_many({"video_id": video_id})

        vector_service = get_vector_service()
        await vector_service.delete_video_segments(video_id)

        return {"message": "Video deleted", "video_id": video_id}

    async def teach_back(
        self,
        video_id: str,
        start_time: float = 0,
        end_time: float = None,
        user_id: str = None,
        user_explanation: str = None,
        is_initial: bool = True,
        session_id: str = None,
    ):
        try:
            video = await MongoDB.video_library().find_one({"_id": ObjectId(video_id)})
        except Exception:
            raise ValueError("Invalid video ID")

        if not video:
            raise ValueError("Video not found")

        query = {"video_id": video_id}
        if end_time is not None:
            query["start_time"] = {"$gte": start_time, "$lte": end_time}
        else:
            query["start_time"] = {"$gte": start_time}

        cursor = MongoDB.video_segments().find(query).sort("index", 1)
        segments = await cursor.to_list(length=None)

        if not segments:
            cursor = (
                MongoDB.video_segments().find({"video_id": video_id}).sort("index", 1)
            )
            segments = await cursor.to_list(length=None)

        if not segments:
            raise ValueError("No transcript segments found for this video")

        video_title = video.get("title", "")

        if is_initial:
            session = await self.teach_back_agent.get_or_create_session(
                video_id=video_id,
                user_id=user_id or "anonymous",
                segments=segments,
                video_title=video_title,
                start_time=start_time,
                end_time=end_time,
            )

            prompt = await self.teach_back_agent.start_concept_learning(session)

            return {
                "prompt": prompt,
                "session_id": session["session_id"],
                "is_complete": False,
                "concepts_count": len(session["concepts"]),
                "current_concept_index": session["current_concept_index"] + 1,
            }

        if not user_explanation:
            raise ValueError("user_explanation is required when is_initial=False")

        if session_id:
            session = await self.teach_back_agent.get_session(session_id)
            if not session:
                raise ValueError("Session not found")
        else:
            session = await self.teach_back_agent.get_or_create_session(
                video_id=video_id,
                user_id=user_id or "anonymous",
                segments=segments,
                video_title=video_title,
                start_time=start_time,
                end_time=end_time,
            )

        from src.models.video_assistant.schemas import BloomLevel

        evaluation_result = await self.teach_back_agent.evaluate_explanation(
            user_explanation=user_explanation,
            session=session,
            transcript_excerpt=" ".join(seg.get("text", "") for seg in segments),
            video_title=video_title,
        )
        should_advance = evaluation_result.get("should_advance", False)

        response = {
            "evaluation": evaluation_result["evaluation"],
            "follow_up_question": evaluation_result.get("follow_up_question", ""),
            "mastery_score": evaluation_result["evaluation"].get("overall_score", 0),
            "encouragement": evaluation_result.get("feedback", ""),
            "is_complete": should_advance,
            "session_id": session_id,
            "session_progress": evaluation_result.get("session_progress", {}),
            "feedback": evaluation_result.get("feedback", ""),
        }

        if should_advance:
            next_prompt = await self.teach_back_agent.advance_to_next_concept(session)
            response["next_concept_prompt"] = next_prompt
            response["completed_concept"] = session["concepts"][
                session["current_concept_index"]
            ]
        else:
            response["next_concept_prompt"] = None

        return response

    async def save_chat_message(
        self,
        video_id: str,
        role: str,
        content: str,
        timestamps: list = None,
        note_link: str = None,
    ) -> dict:
        message_doc = {
            "video_id": video_id,
            "role": role,
            "content": content,
            "timestamps": timestamps or [],
            "note_link": note_link,
            "created_at": datetime.utcnow(),
        }

        result = await MongoDB.video_chat_history().insert_one(message_doc)
        message_doc["id"] = str(result.inserted_id)
        if "_id" in message_doc:
            del message_doc["_id"]
        return message_doc

    async def get_chat_history(self, video_id: str) -> list:
        
        cursor = (
            MongoDB.video_chat_history()
            .find({"video_id": video_id})
            .sort("created_at", 1)
        )  

        messages = []
        async for doc in cursor:
            messages.append(
                {
                    "id": str(doc["_id"]),
                    "role": doc.get("role", "user"),
                    "content": doc.get("content", ""),
                    "timestamps": doc.get("timestamps", []),
                    "noteLink": doc.get("note_link"),
                }
            )

        return messages

    async def clear_chat_history(self, video_id: str) -> dict:
        result = await MongoDB.video_chat_history().delete_many({"video_id": video_id})
        return {"deleted_count": result.deleted_count, "video_id": video_id}


_video_assistant_service: VideoAssistantService = None


def get_video_assistant_service() -> VideoAssistantService:
    global _video_assistant_service
    if _video_assistant_service is None:
        _video_assistant_service = VideoAssistantService()
    return _video_assistant_service
