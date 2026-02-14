from pydantic import BaseModel, Field


class GradingResult(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Score from 0-100")
    is_correct: bool = Field(..., description="Whether the answer is considered correct (score >= 70)")
    feedback: str = Field(..., description="Constructive feedback for the student")
    key_points_covered: list[str] = Field(..., description="Key points the student included")
    key_points_missing: list[str] = Field(..., description="Key points the student missed")
