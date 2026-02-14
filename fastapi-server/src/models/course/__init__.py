"""
Course-related Pydantic schemas

Exports all course agent models.
"""
from .flashcard_schemas import (
    FlashcardType,
    Difficulty,
    ChapterMode,
    TaskStatus,
    FlashcardConfig,
    MultipleChoiceQuestion,
    LearningCard,
    FlashcardPreview,
    TaskProgress,
    GenerationRequest,
    GenerationResponse,
    MCQList,
    LearningCardList,
)
from .slide_schemas import (
    SlideContent,
    SlideGenerationOutput,
    UnsplashPhoto,
    ImageSearchResult,
)
from .planner_schemas import TopicNodePlan, TopicEdgePlan, CoursePlan
from .explainer_schemas import ChapterContent
from .content_schemas import TextChapterContent
from .tester_schemas import MCQOptionSchema, MCQQuestionSchema, OpenTextQuestionSchema, QuizQuestions
from .grader_schemas import GradingResult
from .chat_schemas import ChatResponseSchema
from .graph_expansion_schemas import ExtractedTopic, NewEdge, GraphExpansionPlan
from .quiz_schemas import QuestionsResponse
from .material_schemas import MaterialUploadResponse, GraphExpansionPreview, YouTubeRequest

__all__ = [
    # Flashcard schemas
    "FlashcardType",
    "Difficulty",
    "ChapterMode",
    "TaskStatus",
    "FlashcardConfig",
    "MultipleChoiceQuestion",
    "LearningCard",
    "FlashcardPreview",
    "TaskProgress",
    "GenerationRequest",
    "GenerationResponse",
    "MCQList",
    "LearningCardList",
    # Slide schemas
    "SlideContent",
    "SlideGenerationOutput",
    # Image schemas
    "UnsplashPhoto",
    "ImageSearchResult",
    # Planner schemas
    "TopicNodePlan",
    "TopicEdgePlan",
    "CoursePlan",
    # Explainer schemas (legacy)
    "ChapterContent",
    # Content Writer schemas
    "TextChapterContent",
    # Tester schemas
    "MCQOptionSchema",
    "MCQQuestionSchema",
    "OpenTextQuestionSchema",
    "QuizQuestions",
    # Grader schemas
    "GradingResult",
    # Chat schemas
    "ChatResponseSchema",
    # Graph expansion schemas
    "ExtractedTopic",
    "NewEdge",
    "GraphExpansionPlan",
    # Quiz router schemas
    "QuestionsResponse",
    # Material router schemas
    "MaterialUploadResponse",
    "GraphExpansionPreview",
    "YouTubeRequest",
]



