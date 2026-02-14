import logging
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

from src.utils.llm import get_llm_service
from src.prompts.video_assistant.video_assistant_prompts import (
    VIDEO_SUMMARY_PROMPT,
    QA_PROMPT,
    TIME_AWARE_QA_PROMPT,
    CHAPTER_GENERATION_PROMPT,
    TIME_AWARE_KEYWORDS,
    NOTE_CREATION_PROMPT,
)


logger = logging.getLogger(__name__)


class VideoSummary(BaseModel):
    summary: str = Field(default="Summary not available.")
    key_points: List[str] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)


class QAResponse(BaseModel):
    answer: str = Field(default="I couldn't find an answer in the transcript.")
    confidence: str = Field(default="low")
    timestamps: List[float] = Field(default_factory=list)


class Chapter(BaseModel):
    title: str = Field(default="Chapter")
    start_time: float = Field(default=0.0)
    summary: str = Field(default="")


class ChaptersResponse(BaseModel):
    chapters: List[Chapter] = Field(default_factory=list)


class VideoAssistantAgent:
    def __init__(self):
        self.llm = get_llm_service()
        logger.info("Video Assistant Agent initialized")

    async def summarize(self, transcript: str, title: str = "") -> VideoSummary:
        prompt = VIDEO_SUMMARY_PROMPT.format(
            title=title or "Educational Video", transcript=transcript[:15000]
        )

        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=VideoSummary,
            system_prompt="You are an educational content analyst. Extract key information from video transcripts.",
        )

        return result

    async def answer_question(
        self, question: str, context_segments: List[dict], video_title: str = ""
    ) -> QAResponse:
        context_text = ""
        timestamps = []

        for seg in context_segments:
            start = seg.get("start_time", 0)
            text = seg.get("text", "")
            context_text += f"[{self._format_time(start)}] {text}\n"
            timestamps.append(start)

        prompt = QA_PROMPT.format(
            question=question,
            context_text=context_text,
            video_title=video_title or "Educational Video",
        )

        try:
            result = await self.llm.generate_structured(
                prompt=prompt,
                output_schema=QAResponse,
                system_prompt="You are an AI tutor helping students understand video content. Answer based on the provided transcript excerpts.",
            )
            if not result.timestamps:
                result.timestamps = timestamps[:3]
            else:
                result.timestamps = timestamps[:3]
            return result
        except Exception as e:
            logger.error(f"Error in answer_question: {e}")
            return QAResponse(
                answer=f"I encountered an issue processing your question. Please try rephrasing it. Error: {str(e)[:100]}",
                confidence="low",
                timestamps=timestamps[:3],
            )

    async def answer_time_aware(
        self,
        question: str,
        segments: List[dict],
        current_time: float,
        video_title: str = "",
    ) -> QAResponse:
        context_segments = self._get_time_window_segments(segments, current_time)

        context_text = ""
        for seg in context_segments:
            start = seg.get("start_time", 0)
            text = seg.get("text", "")
            context_text += f"[{self._format_time(start)}] {text}\n"

        time_str = self._format_time(current_time)

        prompt = TIME_AWARE_QA_PROMPT.format(
            time_str=time_str,
            question=question,
            context_text=context_text,
            video_title=video_title,
        )

        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=QAResponse,
            system_prompt="You are an AI tutor helping students understand video content. Answer based on the provided transcript excerpts.",
        )

        result.timestamps = [seg.get("start_time", 0) for seg in context_segments[:3]]

        return result

    async def answer_for_note(
        self, question: str, context_segments: List[dict], video_title: str = ""
    ) -> QAResponse:
        """Generate a detailed response suitable for note creation."""
        context_text = ""
        timestamps = []

        for seg in context_segments:
            start = seg.get("start_time", 0)
            text = seg.get("text", "")
            context_text += f"[{self._format_time(start)}] {text}\n"
            timestamps.append(start)

        prompt = NOTE_CREATION_PROMPT.format(
            question=question,
            context_text=context_text,
            video_title=video_title or "Educational Video",
        )

        try:
            result = await self.llm.generate_structured(
                prompt=prompt,
                output_schema=QAResponse,
                system_prompt="You are an AI tutor creating comprehensive study notes. Be thorough and educational.",
            )
            if not result.timestamps:
                result.timestamps = timestamps[:3]
            else:
                result.timestamps = timestamps[:3]
            return result
        except Exception as e:
            logger.error(f"Error in answer_for_note: {e}")
            return QAResponse(
                answer=f"I encountered an issue creating notes. Please try again. Error: {str(e)[:100]}",
                confidence="low",
                timestamps=timestamps[:3],
            )

    async def generate_chapters(
        self, segments: List[dict], video_title: str = "", target_chapters: int = 8
    ) -> ChaptersResponse:
        chunk_size = max(1, len(segments) // target_chapters)
        chunks = []

        for i in range(0, len(segments), chunk_size):
            chunk_segments = segments[i : i + chunk_size]
            if chunk_segments:
                chunks.append(
                    {
                        "start_time": chunk_segments[0].get("start_time", 0),
                        "text": " ".join(s.get("text", "") for s in chunk_segments),
                    }
                )

        chunk_text = ""
        for i, chunk in enumerate(chunks):
            start = self._format_time(chunk["start_time"])
            chunk_text += f"\n[{start}] Section {i + 1}:\n{chunk['text'][:500]}...\n"

        prompt = CHAPTER_GENERATION_PROMPT.format(
            video_title=video_title or "Educational Video",
            chunk_text=chunk_text,
            target_chapters=target_chapters,
        )

        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=ChaptersResponse,
            system_prompt="You are an educational content organizer.",
        )

        return result

    def detect_time_aware_query(self, question: str) -> bool:
        question_lower = question.lower()
        return any(keyword in question_lower for keyword in TIME_AWARE_KEYWORDS)

    def _get_time_window_segments(
        self,
        segments: List[dict],
        current_time: float,
        window_seconds: int = 30,
        max_segments: int = 10,
    ) -> List[dict]:
        in_window = [
            s
            for s in segments
            if abs(s.get("start_time", 0) - current_time) <= window_seconds
        ]

        in_window.sort(key=lambda s: abs(s.get("start_time", 0) - current_time))

        if in_window:
            return in_window[:max_segments]

        if segments:
            closest = min(
                segments, key=lambda s: abs(s.get("start_time", 0) - current_time)
            )
            return [closest]

        return []

    def _format_time(self, seconds: float) -> str:
        seconds = int(seconds)
        if seconds >= 3600:
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            secs = seconds % 60
            return f"{hours}:{minutes:02d}:{secs:02d}"
        else:
            minutes = seconds // 60
            secs = seconds % 60
            return f"{minutes}:{secs:02d}"


_video_assistant_agent: Optional[VideoAssistantAgent] = None


def get_video_assistant_agent() -> VideoAssistantAgent:
    global _video_assistant_agent
    if _video_assistant_agent is None:
        _video_assistant_agent = VideoAssistantAgent()
    return _video_assistant_agent
