from typing import Optional, List
from pydantic import BaseModel


class MaterialUploadResponse(BaseModel):
    success: bool
    message: str
    new_nodes_count: int = 0
    new_edges_count: int = 0
    expansion_summary: Optional[str] = None


class GraphExpansionPreview(BaseModel):
    new_topics: list
    new_edges: list
    summary: str


class YouTubeRequest(BaseModel):
    youtube_url: str
    auto_expand: bool = True
