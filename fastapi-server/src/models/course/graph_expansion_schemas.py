from typing import List
from pydantic import BaseModel, Field


class ExtractedTopic(BaseModel):
    id: str = Field(..., description="Unique ID for this new node (e.g., 'new_n1')")
    title: str = Field(..., description="Topic title (1-5 words)")
    summary: str = Field(..., description="Brief summary of this topic")
    learning_objectives: List[str] = Field(..., description="3-5 learning points")
    time_minutes: int = Field(default=15, description="Estimated time in minutes")
    connects_to: List[str] = Field(..., description="IDs of existing nodes this topic relates to")


class NewEdge(BaseModel):
    source: str = Field(..., description="Source node ID (prerequisite)")
    target: str = Field(..., description="Target node ID (requires source)")


class GraphExpansionPlan(BaseModel):
    new_topics: List[ExtractedTopic] = Field(..., description="New topics to add")
    new_edges: List[NewEdge] = Field(..., description="New prerequisite edges")
    summary: str = Field(..., description="Summary of what was found in the material")
