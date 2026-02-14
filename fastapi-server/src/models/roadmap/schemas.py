from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GenerateRoadmapRequest(BaseModel):
    topic: str = Field(..., description="Main topic for the roadmap")
    goal: Optional[str] = Field(default=None, description="Specific learning goal")
    skill_level: str = Field(default="beginner", description="Current skill level")
    language: str = Field(default="en", description="Target language code")
    user_id: Optional[str] = Field(default=None, description="User ID for ownership")


class RoadmapResponse(BaseModel):
    id: str
    topic: str
    title: str
    description: str
    nodes: list
    edges: list
    language: str
    created_at: datetime


class UpdateProgressRequest(BaseModel):
    node_id: str = Field(..., description="Node to update")
    status: str = Field(..., description="New status: pending, in_progress, completed, skipped")


class ProgressResponse(BaseModel):
    roadmap_id: str
    user_id: str
    status: dict


class RoadmapResource(BaseModel):
    title: str = Field(..., description="Resource title")
    url: str = Field(..., description="Resource URL")
    type: str = Field(default="article", description="Resource type: article, video, docs, tutorial")


class RoadmapNode(BaseModel):
    id: str = Field(..., description="Unique node identifier (e.g., 'node_1', 'node_2')")
    label: str = Field(..., description="Short display label (1-4 words)")
    type: str = Field(default="topic", description="Node type: main, topic, subtopic")
    parent_id: Optional[str] = Field(default=None, description="Parent node ID (null for root nodes)")


class RoadmapEdge(BaseModel):
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")


class RoadmapStructure(BaseModel):
    title: str = Field(..., description="Roadmap title")
    description: str = Field(..., description="Brief roadmap description")
    nodes: List[RoadmapNode] = Field(..., description="All nodes in the roadmap")
    edges: List[RoadmapEdge] = Field(..., description="Connections between nodes")


class NodeDetails(BaseModel):
    title: str = Field(..., description="Full title of the topic")
    description: str = Field(..., description="Detailed explanation (2-3 paragraphs)")
    key_concepts: List[str] = Field(..., description="3-5 key concepts to learn")
    resources: List[RoadmapResource] = Field(..., description="3-5 learning resources")
    estimated_time: str = Field(..., description="Estimated learning time (e.g., '2-3 hours')")


class ChatMessageRequest(BaseModel):
    message: str = Field(..., description="User's message to the AI tutor")
    chat_history: Optional[List[dict]] = Field(default=None, description="Previous chat messages")


class ChatMessageResponse(BaseModel):
    message: str = Field(..., description="AI tutor's response")
    timestamp: str = Field(..., description="Response timestamp")


class SuggestedQuestionsResponse(BaseModel):
    questions: List[str] = Field(..., description="List of suggested questions")
