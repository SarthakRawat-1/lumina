from typing import TypedDict, Annotated, Optional, List
import operator

from src.models.jobs.schemas import (
    ResumeProfile,
    ManualJobInput,
    JobPreferences,
    Job,
    ScoredJob,
    CareerInsights,
)


class JobDiscoveryState(TypedDict):
    resume_profile: Optional[ResumeProfile]
    manual_input: Optional[ManualJobInput]
    preferences: Optional[JobPreferences]

    user_id: Optional[str]
    search_id: Optional[str]  

    expanded_roles: List[str]

    search_queries: List[str]
    
    raw_jobs: Annotated[List[Job], operator.add]

    normalized_jobs: List[Job]

    scored_jobs: List[ScoredJob]

    insights: Optional[CareerInsights]
 
    chat_history: List[dict]
    current_filter: Optional[str]  

    status: str  
    error: Optional[str]
