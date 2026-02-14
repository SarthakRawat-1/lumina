from typing import TypedDict, Annotated, Optional, List
import operator
from pydantic import BaseModel


class TopicNodePlan(BaseModel):
    id: str
    title: str
    summary: str
    learning_objectives: List[str]
    time_minutes: int


class TopicEdgePlan(BaseModel):
    source: str
    target: str


class CoursePlan(BaseModel):
    title: str
    description: str
    root_node_id: str
    nodes: List[TopicNodePlan]
    edges: List[TopicEdgePlan]
    total_time_hours: int


class GeneratedChapter(TypedDict):
    node_id: str
    index: int
    title: str
    summary: str
    content: str
    key_takeaways: List[str]


class CourseGenerationState(TypedDict):
    topic: str
    time_hours: int
    difficulty: str
    language: str
    context: Optional[str]
    generate_content: bool  

    course_plan: Optional[CoursePlan]

    chapters: Annotated[List[GeneratedChapter], operator.add]
    current_node_index: int  

    status: str  
    error: Optional[str]

    course_id: Optional[str]

