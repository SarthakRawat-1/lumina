from typing import List
from pydantic import BaseModel, Field


class ChapterContent(BaseModel):
    content: str = Field(..., description="The React component code (starting with () => and ending with })")
    key_takeaways: List[str] = Field(..., description="3-5 key points from this chapter")
