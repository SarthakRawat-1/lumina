from typing import List
from pydantic import BaseModel, Field


class ChatResponseSchema(BaseModel):
    response: str = Field(..., description="AI response to the user's message")
    follow_up_questions: List[str] = Field(
        default=[],
        description="Optional suggested follow-up questions"
    )
