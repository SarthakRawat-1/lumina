from typing import Optional, List

import chromadb.utils.embedding_functions as embedding_functions
import numpy as np

from src.config.settings import settings
from src.utils.llm import get_llm_service
from src.utils.vector import get_vector_service
from src.models.jobs.schemas import EnrichedJob, JobScore, ScoringResult
from src.models.jobs.schemas import ResumeProfile, ManualJobInput
from src.prompts.jobs.scoring_prompts import SCORING_WEIGHTS, SCORING_SYSTEM_PROMPT, SCORING_USER_PROMPT
from src.utils.job_text import extract_years_required


class ScoringAgent:
    
    def __init__(self):
        self.llm = get_llm_service()
        self.vector_service = get_vector_service()
        self.embedding_fn = None
        if settings.google_cloud_api:
            self.embedding_fn = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
                api_key=settings.google_cloud_api,
                model_name="gemini-embedding-001"
            )
    
    async def score_jobs(
        self,
        jobs: List[EnrichedJob],
        profile: Optional[ResumeProfile] = None,
        manual_input: Optional[ManualJobInput] = None,
        target_roles: List[str] = None,
        preferred_location: Optional[str] = None,
        remote_only: bool = False
    ) -> ScoringResult:
        scored = []

        if profile:
            candidate_skills = profile.skills
            experience_years = profile.experience_years
            domains = profile.domains
        elif manual_input:
            candidate_skills = manual_input.skills
            experience_years = manual_input.experience_years
            domains = manual_input.preferred_industries
        else:
            candidate_skills = []
            experience_years = 0
            domains = []
        
        for job in jobs:
            score = await self._score_single_job(
                job=job,
                candidate_skills=candidate_skills,
                experience_years=experience_years,
                domains=domains,
                target_roles=target_roles or [],
                preferred_location=preferred_location,
                remote_only=remote_only
            )
            scored.append(score)

        scored.sort(key=lambda x: x.match_score, reverse=True)
        
        return ScoringResult(scored_jobs=scored)
    
    async def _score_single_job(
        self,
        job: EnrichedJob,
        candidate_skills: List[str],
        experience_years: int,
        domains: List[str],
        target_roles: List[str],
        preferred_location: Optional[str],
        remote_only: bool
    ) -> JobScore:
        component_scores = {}
        
        skills_score = self._calculate_skills_score(
            candidate_skills, 
            job.requirements,
            job.description
        )
        component_scores["skills"] = skills_score
        
        role_score = self._calculate_role_score(job.title, target_roles)
        component_scores["role_fit"] = role_score
        
        exp_score = self._calculate_experience_score(experience_years, job.requirements)
        component_scores["experience"] = exp_score
        
        loc_score = self._calculate_location_score(
            job.location_type,
            job.location,
            preferred_location,
            remote_only
        )
        component_scores["location"] = loc_score
        
        component_scores["recency"] = 0.7  
        
        overall_score = sum(
            component_scores[k] * SCORING_WEIGHTS[k]
            for k in SCORING_WEIGHTS
        )
        
        return JobScore(
            job_id=job.job_id,
            match_score=round(overall_score, 2),
            component_scores=component_scores,
            matching_skills=[],
            missing_skills=[],
            match_explanation=""
        )
    
    def _calculate_skills_score(
        self,
        candidate_skills: List[str],
        job_requirements: List[str],
        job_description: str
    ) -> float:
        if not candidate_skills:
            return 0.5
        
        if self.embedding_fn:
            try:
                candidate_text = f"Skills and experience: {', '.join(candidate_skills[:20])}"
                job_text = f"{' '.join(job_requirements[:10])} {job_description[:1000]}"
                
                candidate_embedding = self.embedding_fn([candidate_text])[0]
                job_embedding = self.embedding_fn([job_text])[0]
                
                dot_product = np.dot(candidate_embedding, job_embedding)
                norm_a = np.linalg.norm(candidate_embedding)
                norm_b = np.linalg.norm(job_embedding)
                
                if norm_a > 0 and norm_b > 0:
                    similarity = dot_product / (norm_a * norm_b)
                    return max(0.0, min(1.0, (similarity + 1) / 2))
                
            except Exception as e:
                print(f"Embedding error, falling back to text overlap: {e}")
        
        job_text = " ".join(job_requirements) + " " + job_description
        job_text_lower = job_text.lower()
        
        matches = 0
        for skill in candidate_skills:
            if skill.lower() in job_text_lower:
                matches += 1
        
        if len(candidate_skills) > 0:
            return min(1.0, matches / (len(candidate_skills) * 0.5))
        return 0.5
    
    def _calculate_role_score(
        self,
        job_title: str,
        target_roles: List[str]
    ) -> float:
        if not target_roles:
            return 0.7  
        
        job_title_lower = job_title.lower()
        
        for i, role in enumerate(target_roles):
            if role.lower() in job_title_lower or job_title_lower in role.lower():
                return max(0.5, 1.0 - (i * 0.1))
        
        return 0.4  
    
    def _calculate_experience_score(
        self,
        candidate_years: int,
        requirements: List[str]
    ) -> float:
        if candidate_years == 0:
            return 0.6  
        
        req_text = " ".join(requirements)
        required_years = extract_years_required(req_text)
        
        if required_years:
            if candidate_years >= required_years:
                return 1.0
            elif candidate_years >= required_years - 2:
                return 0.7
            else:
                return 0.4
        
        return 0.7  
    
    def _calculate_location_score(
        self,
        job_location_type: str,
        job_location: str,
        preferred_location: Optional[str],
        remote_only: bool
    ) -> float:
        if remote_only:
            return 1.0 if job_location_type == "remote" else 0.0
        
        if job_location_type == "remote":
            return 1.0  
        
        if preferred_location and job_location:
            if preferred_location.lower() in job_location.lower():
                return 1.0
            return 0.5
        
        return 0.7  
    
    async def _analyze_skill_match(
        self,
        candidate_skills: List[str],
        domains: List[str],
        experience_years: int,
        job: EnrichedJob
    ) -> tuple:
        matching = []
        missing = []
        explanation = ""
        
        try:
            from pydantic import BaseModel, Field
            
            class SkillAnalysis(BaseModel):
                matching_skills: List[str] = Field(default_factory=list)
                missing_skills: List[str] = Field(default_factory=list)
                explanation: str = ""
            
            prompt = SCORING_USER_PROMPT.format(
                candidate_skills=", ".join(candidate_skills[:15]),
                experience_years=experience_years,
                domains=", ".join(domains[:5]),
                job_title=job.title,
                job_company=job.company,
                job_requirements=", ".join(job.requirements[:10]),
                job_description=job.description[:500]
            )
            
            result = await self.llm.generate_structured(
                prompt=prompt,
                output_schema=SkillAnalysis,
                system_prompt=SCORING_SYSTEM_PROMPT
            )
            
            matching = result.matching_skills
            missing = result.missing_skills
            explanation = result.explanation
            
        except Exception as e:
            print(f"Scoring LLM error: {e}")
            explanation = "Match analysis unavailable"
        
        return matching, missing, explanation

_scoring_agent: Optional[ScoringAgent] = None


def get_scoring_agent() -> ScoringAgent:
    global _scoring_agent
    if _scoring_agent is None:
        _scoring_agent = ScoringAgent()
    return _scoring_agent
