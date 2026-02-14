from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ResumeProfile(BaseModel):
    skills: List[str] = Field(default_factory=list, description="Technical and soft skills")
    experience_years: int = Field(default=0, description="Total years of experience")
    domains: List[str] = Field(default_factory=list, description="Industry domains/areas")
    education: List[dict] = Field(default_factory=list, description="Education history")
    projects: List[dict] = Field(default_factory=list, description="Notable projects")
    raw_text: str = Field(default="", description="Original resume text")


class ManualJobInput(BaseModel):
    target_role: str = Field(..., description="Desired job role/title")
    skills: List[str] = Field(default_factory=list, description="Key skills")
    experience_years: int = Field(default=0, description="Years of experience")
    preferred_industries: List[str] = Field(default_factory=list, description="Preferred industries")
    location: Optional[str] = Field(default=None, description="Preferred location")
    remote_only: bool = Field(default=False, description="Only remote jobs")


class JobPreferences(BaseModel):
    location: Optional[str] = Field(default=None, description="Preferred location")
    remote_only: bool = Field(default=False, description="Only show remote jobs")
    hybrid_ok: bool = Field(default=True, description="Include hybrid positions")
    salary_min: Optional[int] = Field(default=None, description="Minimum salary")
    salary_max: Optional[int] = Field(default=None, description="Maximum salary")


class DiscoveredJob(BaseModel):
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(default="", description="Job location")
    description: str = Field(default="", description="Job description snippet")
    apply_url: str = Field(..., description="Application URL")
    salary_range: Optional[str] = Field(default=None, description="Salary range if available")
    posted_date: Optional[str] = Field(default=None, description="When the job was posted")
    source: str = Field(..., description="Source: serpapi, greenhouse, lever, firecrawl")


class NormalizedJob(BaseModel):
    job_id: str = Field(..., description="Unique ID: sha256(apply_url + title)")
    title: str
    company: str
    location: str = ""
    location_type: str = Field(default="onsite", description="onsite|remote|hybrid")
    description: str = ""
    apply_url: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    posted_date: Optional[str] = None
    sources_found: List[str] = Field(default_factory=list)


class EnrichedJob(BaseModel):
    job_id: str
    title: str
    company: str
    location: str = ""
    location_type: str = "onsite"
    description: str = ""
    full_description: str = Field(default="", description="Complete job description")
    requirements: List[str] = Field(default_factory=list)
    benefits: List[str] = Field(default_factory=list)
    application_deadline: Optional[str] = None
    apply_url: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None


class Job(BaseModel):
    job_id: str = Field(..., description="Unique ID: sha256(apply_url + title)")
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(default="", description="Job location")
    location_type: str = Field(default="onsite", description="onsite|remote|hybrid")
    description: str = Field(default="", description="Job description")
    apply_url: str = Field(..., description="Application URL")
    salary_min: Optional[int] = Field(default=None)
    salary_max: Optional[int] = Field(default=None)
    posted_date: Optional[str] = Field(default=None)
    sources_found: List[str] = Field(default_factory=list, description="Sources where job was found")
    raw_source_data: dict = Field(default_factory=dict)


class JobScore(BaseModel):
    job_id: str
    match_score: float = Field(..., ge=0, le=1, description="Overall match 0-1")
    component_scores: dict = Field(
        default_factory=dict,
        description="Breakdown: skills, role_fit, experience, location, recency"
    )
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    match_explanation: str = Field(default="", description="Why this job matches")


class ScoredJob(BaseModel):
    job: Job
    match_score: float = Field(..., description="Overall match score 0-1")
    component_scores: dict = Field(default_factory=dict, description="Individual score components")
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    match_explanation: str = Field(default="", description="Human-readable explanation")


class ResumeParseResult(BaseModel):
    skills: List[str] = Field(default_factory=list, description="Technical and soft skills extracted")
    experience_years: int = Field(default=0, description="Total years of professional experience")
    domains: List[str] = Field(default_factory=list, description="Industry domains/expertise areas")
    education: List[dict] = Field(default_factory=list, description="Education credentials")
    projects: List[dict] = Field(default_factory=list, description="Notable projects/achievements")
    raw_text: str = Field(default="", description="Original resume text for reference")


class RoleExpansionResult(BaseModel):
    primary_roles: List[str] = Field(..., description="1-3 primary job roles that best match the profile")
    expanded_roles: List[str] = Field(..., description="5-10 semantically related role titles")


class SearchQueryResult(BaseModel):
    queries: List[str] = Field(..., description="Human-like search queries for job discovery")


class DiscoveryResult(BaseModel):
    jobs: List[DiscoveredJob] = Field(default_factory=list)
    source: str = Field(..., description="Discovery source used")
    query_used: str = Field(default="", description="Search query that found these jobs")


class NormalizationResult(BaseModel):
    jobs: List[NormalizedJob] = Field(default_factory=list)
    duplicates_removed: int = Field(default=0)
    total_before: int = Field(default=0)
    total_after: int = Field(default=0)


class EnrichmentResult(BaseModel):
    jobs: List[EnrichedJob] = Field(default_factory=list)
    enriched_count: int = Field(default=0)


class ScoringResult(BaseModel):
    scored_jobs: List[JobScore] = Field(default_factory=list)


class LearningRecommendation(BaseModel):
    skill: str
    resource: str
    platform: str = ""
    estimated_time: str = ""


class CareerInsights(BaseModel):
    skill_gaps: List[str] = Field(default_factory=list)
    learning_recommendations: List[dict] = Field(default_factory=list)
    resume_improvements: List[str] = Field(default_factory=list)
    career_paths: List[str] = Field(default_factory=list)
    salary_insights: str = Field(default="")
    interview_tips: List[str] = Field(default_factory=list)


class CareerInsightsResult(BaseModel):
    skill_gaps: List[str] = Field(default_factory=list, description="Skills frequently requested but missing")
    learning_recommendations: List[LearningRecommendation] = Field(default_factory=list)
    resume_improvements: List[str] = Field(default_factory=list)
    career_paths: List[str] = Field(default_factory=list)
    salary_insights: str = Field(default="")
    interview_tips: List[str] = Field(default_factory=list)


class ResumeParseResponse(BaseModel):
    success: bool
    profile: Optional[dict] = None
    skills_count: int = 0
    experience_years: int = 0
    message: str = ""


class JobSearchRequest(BaseModel):
    profile: Optional[dict] = Field(default=None, description="Parsed resume profile")
    manual_input: Optional[ManualJobInput] = None
    location: Optional[str] = None
    remote_only: bool = False
    hybrid_ok: bool = True


class ScoredJobResponse(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    location_type: str
    description: str
    apply_url: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    match_score: float
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    match_explanation: str = ""


class JobResultsResponse(BaseModel):
    search_id: str
    status: str
    total_jobs: int
    jobs: List[ScoredJobResponse]
    insights: Optional[dict] = None


class JobEnrichmentResponse(BaseModel):
    summary: str = Field(description="2-3 sentence summary of the role")
    key_requirements: List[str] = Field(default_factory=list, description="Must-have skills")
    nice_to_haves: List[str] = Field(default_factory=list, description="Preferred but not required")
    benefits: List[str] = Field(default_factory=list, description="Perks and benefits")
    company_info: str = Field(default="", description="Brief about the company")
    matching_skills: List[str] = Field(default_factory=list, description="Skills candidate has")
    missing_skills: List[str] = Field(default_factory=list, description="Skills candidate needs")
    match_explanation: str = Field(default="", description="Why this fits/doesn't fit")


class ChatRefinementRequest(BaseModel):
    search_id: str
    message: str


class ChatRefinementResponse(BaseModel):
    applied_filter: str
    jobs_after_filter: int
    response_message: str


class RoleExpansion(BaseModel):
    primary_roles: List[str] = Field(default_factory=list)
    expanded_roles: List[str] = Field(default_factory=list)


class SearchQueries(BaseModel):
    queries: List[str] = Field(default_factory=list)
