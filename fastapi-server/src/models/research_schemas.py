from typing import List
from pydantic import BaseModel, Field


class ResearchResource(BaseModel):
    title: str
    url: str
    snippet: str = ""


class ResearchResult(BaseModel):
    topic: str
    summary: str = Field(default="", description="Brief summary of findings")
    key_facts: List[str] = Field(default_factory=list, description="Verified facts")
    resources: List[ResearchResource] = Field(default_factory=list, description="Relevant resources")
    current_trends: List[str] = Field(default_factory=list, description="Current trends/tools")
    raw_content: str = Field(default="", description="Raw search results for context")
