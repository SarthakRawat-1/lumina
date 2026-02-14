from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from src.db.mongodb import MongoDB
from src.agents.jobs import get_resume_agent
from src.graphs.job_discovery import run_job_discovery
from src.models.jobs.schemas import (
    ResumeProfile,
    ManualJobInput,
    JobPreferences,
    ScoredJob,
    CareerInsights,
    ResumeParseResult,
    ScoredJobResponse,
    JobResultsResponse,
)


class JobDiscoveryService:
    async def parse_resume(self, file_content: bytes) -> ResumeParseResult:
        resume_agent = get_resume_agent()
        return await resume_agent.parse_resume_pdf(file_content)
    
    async def search_jobs(
        self,
        profile: Optional[dict] = None,
        manual_input: Optional[ManualJobInput] = None,
        location: Optional[str] = None,
        remote_only: bool = False,
        hybrid_ok: bool = True
    ) -> JobResultsResponse:
        resume_profile = None
        
        if profile:
            resume_profile = ResumeProfile(
                skills=profile.get("skills", []),
                experience_years=profile.get("experience_years", 0),
                domains=profile.get("domains", []),
                education=profile.get("education", []),
                projects=profile.get("projects", []),
                raw_text=""
            )

        preferences = JobPreferences(
            location=location or (manual_input.location if manual_input else None),
            remote_only=remote_only or (manual_input.remote_only if manual_input else False),
            hybrid_ok=hybrid_ok
        )

        result = await run_job_discovery(
            resume_profile=resume_profile,
            manual_input=manual_input,
            preferences=preferences
        )

        search_id = str(ObjectId())

        jobs_response = self._format_scored_jobs(result.get("scored_jobs", []))

        try:
            from src.services.jobs.job_vector_service import get_job_vector_service
            vector_service = get_job_vector_service()

            jobs_to_index = [job.model_dump() for job in jobs_response]
            await vector_service.index_jobs(search_id, jobs_to_index)
        except Exception as e:
            print(f"Failed to index jobs to Chroma: {e}")

        await self._save_search(
            search_id=search_id,
            profile=profile,
            manual_input=manual_input,
            preferences=preferences,
            scored_jobs=jobs_response,
            insights=None,  
            jobs_count=len(jobs_response)
        )
        
        return JobResultsResponse(
            search_id=search_id,
            status="complete",
            total_jobs=len(jobs_response),
            jobs=jobs_response,
            insights=None  
        )
    
    def _format_scored_jobs(self, scored_jobs: List) -> List[ScoredJobResponse]:
        jobs_response = []
        
        for scored in scored_jobs:
            job = scored.job if hasattr(scored, 'job') else scored.get("job", {})
            
            jobs_response.append(ScoredJobResponse(
                job_id=job.job_id if hasattr(job, 'job_id') else job.get("job_id", ""),
                title=job.title if hasattr(job, 'title') else job.get("title", ""),
                company=job.company if hasattr(job, 'company') else job.get("company", ""),
                location=job.location if hasattr(job, 'location') else job.get("location", ""),
                location_type=job.location_type if hasattr(job, 'location_type') else job.get("location_type", "onsite"),
                description=job.description if hasattr(job, 'description') else job.get("description", ""),
                apply_url=job.apply_url if hasattr(job, 'apply_url') else job.get("apply_url", ""),
                salary_min=job.salary_min if hasattr(job, 'salary_min') else job.get("salary_min"),
                salary_max=job.salary_max if hasattr(job, 'salary_max') else job.get("salary_max"),
                match_score=scored.match_score if hasattr(scored, 'match_score') else scored.get("match_score", 0),
                matching_skills=scored.matching_skills if hasattr(scored, 'matching_skills') else scored.get("matching_skills", []),
                missing_skills=scored.missing_skills if hasattr(scored, 'missing_skills') else scored.get("missing_skills", []),
                match_explanation=scored.match_explanation if hasattr(scored, 'match_explanation') else scored.get("match_explanation", "")
            ))
        
        return jobs_response
    
    def _format_insights(self, insights) -> Optional[dict]:
        if not insights:
            return None
        
        return {
            "skill_gaps": insights.skill_gaps if hasattr(insights, 'skill_gaps') else [],
            "learning_recommendations": insights.learning_recommendations if hasattr(insights, 'learning_recommendations') else [],
            "resume_improvements": insights.resume_improvements if hasattr(insights, 'resume_improvements') else [],
            "career_paths": insights.career_paths if hasattr(insights, 'career_paths') else [],
            "salary_insights": insights.salary_insights if hasattr(insights, 'salary_insights') else "",
            "interview_tips": insights.interview_tips if hasattr(insights, 'interview_tips') else []
        }
    
    async def _save_search(
        self,
        search_id: str,
        profile: Optional[dict],
        manual_input: Optional[ManualJobInput],
        preferences: JobPreferences,
        scored_jobs: List[ScoredJobResponse],
        insights: dict,
        jobs_count: int
    ) -> None:
        try:
            searches_col = MongoDB.get_collection("job_searches")
            await searches_col.insert_one({
                "_id": ObjectId(search_id),
                "profile": profile,
                "manual_input": manual_input.model_dump() if manual_input else None,
                "preferences": preferences.model_dump(),
                "scored_jobs": [job.model_dump() for job in (scored_jobs or [])],
                "insights": insights if insights else None,
                "jobs_count": jobs_count,
                "created_at": datetime.utcnow()
            })
        except Exception as e:
            print(f"Failed to save search to DB: {e}")
    
    async def get_job_details(self, job_id: str) -> dict:
        pipeline = [
            {"$match": {"scored_jobs.job_id": job_id}},
            {"$project": {
                "job": {
                    "$filter": {
                        "input": "$scored_jobs",
                        "as": "job",
                        "cond": {"$eq": ["$$job.job_id", job_id]}
                    }
                }
            }}
        ]
        
        cursor = MongoDB.get_collection("job_searches").aggregate(pipeline)
        result = await cursor.to_list(length=1)
        
        if not result or not result[0].get("job"):
            raise ValueError(f"Job {job_id} not found")

        return result[0]["job"][0]
    
    async def enrich_job(self, job_id: str) -> dict:
        from src.utils.llm import get_llm_service
        from src.prompts.jobs.enrichment_prompts import ENRICHMENT_SYSTEM_PROMPT, ENRICHMENT_USER_PROMPT
        from src.models.jobs.schemas import JobEnrichmentResponse

        cache_col = MongoDB.get_collection("job_enrichments")
        cached = await cache_col.find_one({"job_id": job_id})
        if cached:
            return {
                "summary": cached.get("summary", ""),
                "key_requirements": cached.get("key_requirements", []),
                "nice_to_haves": cached.get("nice_to_haves", []),
                "benefits": cached.get("benefits", []),
                "company_info": cached.get("company_info", ""),
                "matching_skills": cached.get("matching_skills", []),
                "missing_skills": cached.get("missing_skills", []),
                "match_explanation": cached.get("match_explanation", "")
            }

        job = await self.get_job_details(job_id)

        search_doc = await MongoDB.get_collection("job_searches").find_one(
            {"scored_jobs.job_id": job_id},
            {"profile": 1, "manual_input": 1}
        )
        
        profile_summary = "No specific profile provided."
        if search_doc:
            if search_doc.get("profile"):
                p = search_doc["profile"]
                skills = ", ".join(p.get("skills", []))
                exp = p.get("experience_years", 0)
                profile_summary = f"Skills: {skills}. Experience: {exp} years."
            elif search_doc.get("manual_input"):
                p = search_doc["manual_input"]
                skills = ", ".join(p.get("skills", []))
                profile_summary = f"Skills: {skills}. Role: {p.get('target_role')}."

        llm = get_llm_service()
        prompt = ENRICHMENT_USER_PROMPT.format(
            title=job.get("title", ""),
            company=job.get("company", ""),
            location=job.get("location", ""),
            description=job.get("description", "")[:3000],
            profile_summary=profile_summary
        )
        
        result = await llm.generate_structured(
            prompt=prompt,
            output_schema=JobEnrichmentResponse,
            system_prompt=ENRICHMENT_SYSTEM_PROMPT
        )

        enrichment_data = {
            "job_id": job_id,
            "summary": result.summary,
            "key_requirements": result.key_requirements,
            "nice_to_haves": result.nice_to_haves,
            "benefits": result.benefits,
            "company_info": result.company_info,
            "matching_skills": result.matching_skills,
            "missing_skills": result.missing_skills,
            "match_explanation": result.match_explanation,
            "created_at": datetime.utcnow()
        }
        await cache_col.insert_one(enrichment_data)
        
        return {
            "summary": result.summary,
            "key_requirements": result.key_requirements,
            "nice_to_haves": result.nice_to_haves,
            "benefits": result.benefits,
            "company_info": result.company_info,
            "matching_skills": result.matching_skills,
            "missing_skills": result.missing_skills,
            "match_explanation": result.match_explanation
        }

    
    async def get_insights(self, search_id: str) -> dict:
        doc = await MongoDB.get_collection("job_searches").find_one({"_id": ObjectId(search_id)})
        
        if not doc:
            raise ValueError(f"Search {search_id} not found")
            
        return doc.get("insights", {})

    async def get_search_results(self, search_id: str, skip: int = 0, limit: int = 20) -> dict:
        count_doc = await MongoDB.get_collection("job_searches").find_one(
            {"_id": ObjectId(search_id)},
            {"jobs_count": 1, "insights": 1}
        )
        
        if not count_doc:
            raise ValueError(f"Search {search_id} not found")

        doc = await MongoDB.get_collection("job_searches").find_one(
            {"_id": ObjectId(search_id)},
            {
                "scored_jobs": {"$slice": [skip, limit]},
                "jobs_count": 1
            }
        )
        
        jobs = doc.get("scored_jobs", []) if doc else []
        
        return {
            "search_id": str(doc["_id"]),
            "status": "complete",
            "total_jobs": count_doc.get("jobs_count", 0),
            "jobs": jobs,
            "insights": count_doc.get("insights")
        }

    async def list_searches(self, user_id: Optional[str] = None, limit: int = 20) -> List[dict]:
        query = {}

        cursor = MongoDB.get_collection("job_searches").find(query).sort("created_at", -1).limit(limit)
        
        results = []
        async for doc in cursor:
            title = "Job Search"
            if doc.get("manual_input"):
                title = doc["manual_input"].get("target_role", "Job Search")
            elif doc.get("profile"):
                domains = doc["profile"].get("domains", [])
                title = f"{domains[0]} Roles" if domains else "Resume Search"
                
            results.append({
                "id": str(doc["_id"]),
                "title": title,
                "jobs_count": doc.get("jobs_count", 0),
                "created_at": doc.get("created_at"),
                "location": doc.get("preferences", {}).get("location", "Remote" if doc.get("preferences", {}).get("remote_only") else "Any")
            })
            
        return results

_job_discovery_service: Optional[JobDiscoveryService] = None


def get_job_discovery_service() -> JobDiscoveryService:
    global _job_discovery_service
    if _job_discovery_service is None:
        _job_discovery_service = JobDiscoveryService()
    return _job_discovery_service
