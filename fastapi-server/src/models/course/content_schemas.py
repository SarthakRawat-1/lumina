from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ContentSection(BaseModel):
    section_type: Literal["introduction", "concept", "case_study", "summary"] = Field(
        ..., description="Type of section"
    )
    title: str = Field(..., description="Section heading")
    paragraphs: List[str] = Field(..., description="List of paragraph texts")
    bullets: Optional[List[str]] = Field(default=None, description="Optional bullet points")
    tip: Optional[str] = Field(default=None, description="Optional pro tip or note")
    image_index: Optional[int] = Field(default=None, description="Index of image to show (1-based)")
    diagram_index: Optional[int] = Field(default=None, description="Index of diagram to generate (1-based, at least 1 per chapter)")
    diagram_code: Optional[str] = Field(default=None, description="React component code for interactive diagram")


class StructuredChapterContent(BaseModel):
    sections: List[ContentSection] = Field(..., description="Ordered list of content sections")
    key_takeaways: List[str] = Field(..., description="3-5 key points from this chapter")
    image_prompts: List[str] = Field(default_factory=list, description="1-3 prompts for generating educational images")


class TextChapterContent(BaseModel):
    content_md: str = Field(..., description="Markdown formatted educational content")
    key_takeaways: List[str] = Field(..., description="3-5 key points from this chapter")
    image_prompts: List[str] = Field(default_factory=list, description="1-3 prompts for generating educational images")
