from pydantic import BaseModel, Field
from typing import Optional, List
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BloomLevel(str, Enum):
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"


class AddVideoRequest(BaseModel):
    url: str = Field(..., description="YouTube URL or video URL")
    title: Optional[str] = Field(
        default=None, description="Optional title (auto-detected for YouTube)"
    )
    language: str = Field(default="en", description="Preferred language for transcript")
    user_id: Optional[str] = Field(default=None, description="User ID for ownership")


class VideoResponse(BaseModel):
    id: str
    title: str
    source_type: str
    source_id: str  
    source_url: Optional[str] = None  
    duration_seconds: Optional[float] = None
    language: str
    segment_count: int
    has_summary: bool
    has_chapters: bool
    created_at: datetime


class QARequest(BaseModel):
    question: str = Field(..., description="Question to ask about the video")
    current_time: Optional[float] = Field(
        default=None, description="Current playback position in seconds"
    )


class QAResponseModel(BaseModel):
    answer: str
    confidence: str
    timestamps: List[dict]  


class SummaryResponse(BaseModel):
    summary: str
    key_points: List[str]
    topics: List[str]
    cached: bool


class ChaptersResponse(BaseModel):
    chapters: List[dict]  
    cached: bool


class TeachBackRequest(BaseModel):
    start_time: float = Field(
        default=0, description="Start time of section to evaluate"
    )
    end_time: Optional[float] = Field(
        default=None, description="End time of section (defaults to current)"
    )
    user_id: str = Field(
        default="anonymous", description="User ID for session tracking"
    )
    user_explanation: Optional[str] = Field(
        default=None, description="User's explanation of content"
    )
    is_initial: bool = Field(
        default=True, description="True for initial prompt, False for evaluation"
    )
    session_id: Optional[str] = Field(
        default=None, description="Existing session ID to continue"
    )
    bloom_level: Optional[str] = Field(
        default="understand", description="Bloom's taxonomy level for question"
    )


class ConceptEvaluation(BaseModel):
    covered: List[str] = Field(default=[], description="Concepts the user understood")
    unclear: List[str] = Field(
        default=[], description="Concepts mentioned but not clearly explained"
    )
    missed: List[str] = Field(
        default=[], description="Key concepts the user didn't mention"
    )

class TeachBackResponseModel(BaseModel):
    prompt: Optional[str] = Field(
        default=None, description="Initial prompt for user (when is_initial=True)"
    )
    evaluation: Optional[dict] = Field(
        default=None, description="Concept evaluation {covered, unclear, missed}"
    )
    follow_up_question: Optional[str] = Field(
        default=None, description="Socratic follow-up question"
    )
    mastery_score: Optional[int] = Field(
        default=None, description="Understanding score 0-100"
    )
    encouragement: Optional[str] = Field(
        default=None, description="Encouraging message"
    )
    is_complete: bool = Field(default=False, description="True if mastery >= 90%")
    session_id: Optional[str] = Field(
        default=None, description="Session ID for tracking"
    )
    session_progress: Optional[dict] = Field(
        default=None, description="Session progress info"
    )
    feedback: Optional[str] = Field(
        default=None, description="Adaptive feedback message"
    )
    next_concept_prompt: Optional[str] = Field(
        default=None, description="Next concept intro if advancing"
    )


class ChatMessageRequest(BaseModel):
    role: str
    content: str
    timestamps: Optional[List[dict]] = None
    noteLink: Optional[str] = None
