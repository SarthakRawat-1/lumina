from typing import List
from pydantic import BaseModel, Field


class TopicNodePlan(BaseModel):
    id: str = Field(..., description="Unique node ID (n1, n2, n3, etc.)")
    title: str = Field(..., description="Short topic title (1-5 words)")
    summary: str = Field(..., description="Brief summary of what this topic covers")
    learning_objectives: List[str] = Field(..., description="3-6 specific learning points")
    time_minutes: int = Field(..., description="Estimated time in minutes")


class TopicEdgePlan(BaseModel):
    source: str = Field(..., description="Source node ID (prerequisite)")
    target: str = Field(..., description="Target node ID (requires source)")


class CoursePlan(BaseModel):
    title: str = Field(..., description="Course title")
    description: str = Field(..., description="Course description (2-3 sentences)")
    root_node_id: str = Field(..., description="ID of the root/starting node")
    nodes: List[TopicNodePlan] = Field(..., description="List of topic nodes")
    edges: List[TopicEdgePlan] = Field(..., description="Prerequisite edges between nodes")
    total_time_hours: int = Field(..., description="Total course time in hours")
