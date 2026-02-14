"""
Video Generation Schemas - Pydantic models and constants for TTV feature

Contains all data models, voice configuration, and language constants
for the Text-to-Video generation feature.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# =============================================================================
# Voice Configuration Map
# Using Chirp 3 HD (newest, best quality) for all supported languages
# Reference: https://cloud.google.com/text-to-speech/docs/voices
# =============================================================================

VOICE_MAP = {
    # Chirp 3 HD voices
    # English
    "English (US)": {"code": "en-US", "name": "en-US-Chirp3-HD-Charon"},
    "English (India)": {"code": "en-IN", "name": "en-IN-Chirp3-HD-Charon"},
    # Global Languages
    "French": {"code": "fr-FR", "name": "fr-FR-Chirp3-HD-Charon"},
    "German": {"code": "de-DE", "name": "de-DE-Chirp3-HD-Charon"},
    "Spanish": {"code": "es-ES", "name": "es-ES-Chirp3-HD-Charon"},
    "Portuguese": {"code": "pt-BR", "name": "pt-BR-Chirp3-HD-Charon"},
    "Italian": {"code": "it-IT", "name": "it-IT-Chirp3-HD-Charon"},
    # Indian Languages
    "Hindi": {"code": "hi-IN", "name": "hi-IN-Chirp3-HD-Charon"},
    "Hinglish": {"code": "hi-IN", "name": "hi-IN-Chirp3-HD-Charon"},
    "Bengali": {"code": "bn-IN", "name": "bn-IN-Chirp3-HD-Charon"},
    "Gujarati": {"code": "gu-IN", "name": "gu-IN-Chirp3-HD-Charon"},
    "Tamil": {"code": "ta-IN", "name": "ta-IN-Chirp3-HD-Charon"},
    "Telugu": {"code": "te-IN", "name": "te-IN-Chirp3-HD-Charon"},
    "Marathi": {"code": "mr-IN", "name": "mr-IN-Chirp3-HD-Charon"},
    "Kannada": {"code": "kn-IN", "name": "kn-IN-Chirp3-HD-Charon"},
    "Malayalam": {"code": "ml-IN", "name": "ml-IN-Chirp3-HD-Charon"},
    "Punjabi": {"code": "pa-IN", "name": "pa-IN-Chirp3-HD-Charon"},
    "Urdu": {"code": "ur-IN", "name": "ur-IN-Chirp3-HD-Charon"},
}

# Supported languages list (derived from VOICE_MAP for single source of truth)
SUPPORTED_LANGUAGES = list(VOICE_MAP.keys())


# =============================================================================
# Script Generation Models (used internally by agent)
# =============================================================================

class SceneScript(BaseModel):
    """A single scene in the video script"""
    text: str = Field(..., description="Narration text for this scene")
    visual_prompt: str = Field(..., description="Image generation prompt (always English)")


class GeneratedScript(BaseModel):
    """Complete script from Gemini"""
    scenes: List[SceneScript]


# =============================================================================
# Video Asset Models (output from agent)
# =============================================================================

class VideoScene(BaseModel):
    """A processed scene with all assets"""
    index: int
    caption: str
    image_url: str
    audio_url: str
    duration_frames: int


class VideoBlueprint(BaseModel):
    """Complete video blueprint for Remotion Player"""
    video_id: str
    topic: str
    language: str
    duration_mode: str
    fps: int = 30
    total_duration_frames: int
    scenes: List[VideoScene]


# =============================================================================
# API Request/Response Models (used by router)
# =============================================================================

class GenerateVideoRequest(BaseModel):
    """Request to generate a new video"""
    topic: str = Field(..., description="Topic for the video", min_length=3, max_length=500)
    language: str = Field(
        default="English (US)",
        description="Language for narration",
        examples=["English (US)", "Hindi", "Tamil", "Hinglish"]
    )
    duration_mode: str = Field(
        default="short",
        description="Video length: short (1min), medium (2min), long (3min)"
    )
    user_id: Optional[str] = Field(default=None, description="User ID for ownership")


class VideoResponse(BaseModel):
    """Response containing video blueprint"""
    id: str
    video_id: str
    topic: str
    language: str
    duration_mode: str
    fps: int
    total_duration_frames: int
    total_duration_seconds: float
    scenes: list
    created_at: datetime


class VideoListItem(BaseModel):
    """Compact video info for listing"""
    id: str
    video_id: str
    topic: str
    language: str
    duration_seconds: float
    scene_count: int
    created_at: datetime
