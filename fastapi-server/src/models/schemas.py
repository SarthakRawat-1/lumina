from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class Language(str, Enum):
    ENGLISH = "en"
    HINDI = "hi"
    TAMIL = "ta"
    TELUGU = "te"
    BENGALI = "bn"
    MARATHI = "mr"
    GUJARATI = "gu"
    KANNADA = "kn"
    MALAYALAM = "ml"
    PUNJABI = "pa"
    ODIA = "or"


class Difficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CourseStatus(str, Enum):
    CREATING = "creating"
    READY = "ready"
    FAILED = "failed"


class QuestionType(str, Enum):
    MCQ = "mcq"
    OPEN_TEXT = "open_text"


class CourseCreate(BaseModel):
    topic: str = Field(..., min_length=3, max_length=500, description="Course topic/description")
    time_hours: int = Field(..., ge=1, le=30, description="Estimated learning hours")
    difficulty: Difficulty = Field(..., description="Difficulty level")
    language: Language = Field(default=Language.ENGLISH, description="Content language")
    document_ids: List[str] = Field(default=[], description="Optional document IDs for RAG")
    user_id: Optional[str] = Field(default=None, description="User ID for analytics tracking")
    generate_content: bool = Field(default=True, description="Whether to generate chapter content")


class NodeStatus(str, Enum):
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TopicNode(BaseModel):
    id: str = Field(..., description="Unique node ID (e.g., 'n1', 'n2')")
    title: str = Field(..., description="Topic title")
    summary: str = Field(..., description="Brief summary of this topic")
    learning_objectives: List[str] = Field(default=[], description="Learning objectives for this topic")
    time_minutes: int = Field(default=15, description="Estimated time in minutes")
    status: NodeStatus = Field(default=NodeStatus.LOCKED, description="Completion status")
    position_x: Optional[float] = Field(default=None, description="X position for graph layout")
    position_y: Optional[float] = Field(default=None, description="Y position for graph layout")


class TopicEdge(BaseModel):
    source: str = Field(..., description="Source node ID (prerequisite)")
    target: str = Field(..., description="Target node ID (requires source)")


class CourseResponse(BaseModel):
    id: str
    topic: str
    title: str
    description: str
    time_hours: int
    difficulty: Difficulty
    language: Language
    status: CourseStatus
    chapter_count: int = 0
    image_url: Optional[str] = None

    nodes: List[TopicNode] = Field(default=[], description="Topic nodes in the course graph")
    edges: List[TopicEdge] = Field(default=[], description="Prerequisite edges between nodes")
    created_at: datetime
    updated_at: Optional[datetime] = None


class CourseListResponse(BaseModel):
    courses: List[CourseResponse]
    total: int


class ChapterSection(BaseModel):
    section_type: str
    title: str
    paragraphs: List[str]
    bullets: Optional[List[str]] = None
    tip: Optional[str] = None
    image_index: Optional[int] = None
    image_url: Optional[str] = None
    diagram_index: Optional[int] = None
    diagram_code: Optional[str] = None


class ChapterSummary(BaseModel):
    id: str
    index: int
    title: str
    summary: str
    time_minutes: int
    is_completed: bool = False
    node_id: Optional[str] = None  
    sections: List[ChapterSection] = Field(default=[], description="Chapter content sections")
    images: List[str] = Field(default=[], description="List of educational image URLs")
    image_url: Optional[str] = None


class ChapterDetail(BaseModel):
    id: str
    course_id: str
    node_id: Optional[str] = None  
    index: int
    title: str
    summary: str
    content: str  
    sections: List[ChapterSection] = Field(default=[], description="Chapter content sections")
    time_minutes: int
    is_completed: bool = False
    image_url: Optional[str] = None
    images: List[str] = Field(default=[], description="List of educational image URLs")


class ChapterListResponse(BaseModel):
    chapters: List[ChapterSummary]
    total: int


class MCQOption(BaseModel):
    key: str 
    text: str


class QuestionBase(BaseModel):
    id: str
    chapter_id: str
    question_type: QuestionType
    question_text: str


class MCQQuestion(QuestionBase):
    question_type: QuestionType = QuestionType.MCQ
    options: List[MCQOption]
    correct_answer: str  # a, b, c, or d


class OpenTextQuestion(QuestionBase):
    question_type: QuestionType = QuestionType.OPEN_TEXT
    expected_answer: str


class AnswerSubmit(BaseModel):
    answer: str


class AnswerResult(BaseModel):
    is_correct: bool
    score: int = Field(..., ge=0, le=100)
    feedback: str
    correct_answer: Optional[str] = None  # Shown for MCQ


class ChatMessage(BaseModel):
    id: Optional[str] = None  # Message ID for TTS audio
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    message: str
    timestamp: datetime


class LanguageInfo(BaseModel):
    code: str
    name: str
    native_name: str


class LanguagesResponse(BaseModel):
    languages: List[LanguageInfo]
