from pydantic import BaseModel, Field
from typing import List
from dataclasses import dataclass


class SlideContent(BaseModel):
    slides_html: str = Field(..., description="The Reveal.js section elements HTML")
    slide_count: int = Field(..., description="Number of slides generated")
    key_concepts: List[str] = Field(default_factory=list, description="Key concepts covered in the slides")


class SlideGenerationOutput(BaseModel):
    slides_html: str = Field(..., description="Reveal.js section elements HTML")
    key_concepts: List[str] = Field(default_factory=list, description="Key concepts covered")


@dataclass
class UnsplashPhoto:
    id: str
    description: str
    urls: dict  # Contains 'raw', 'full', 'regular', 'small', 'thumb'
    width: int
    height: int


class ImageSearchResult(BaseModel):
    url: str = Field(..., description="URL of the image")
    thumbnail_url: str = Field(..., description="Thumbnail URL")
    description: str = Field(default="", description="Image description")
    photographer: str = Field(default="", description="Photographer name")
    unsplash_link: str = Field(default="", description="Link to Unsplash page")

