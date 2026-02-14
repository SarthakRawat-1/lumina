from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class Evaluation(BaseModel):
    category: str
    score: int
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class BehavioralFlag(BaseModel):
    type: str 
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class InterviewReport(BaseModel):
    overall_score: int
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class Interview(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    industry: str
    role: str
    resume_text: Optional[str] = None
    status: str = "pending" 
    recording_url: Optional[str] = None
    evaluations: List[Evaluation] = []
    violations: List[BehavioralFlag] = []
    report: Optional[InterviewReport] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None

class InterviewResumeParseResponse(BaseModel):
    success: bool
    extracted_text: Optional[str] = None
    message: str
