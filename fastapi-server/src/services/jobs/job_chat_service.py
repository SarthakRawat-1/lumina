from datetime import datetime
from typing import List, Dict, Any, Optional
from bson import ObjectId

from src.utils.llm import LLMService, get_llm_service
from src.db.mongodb import MongoDB

class JobChatService:
    def __init__(self):
        self.llm = get_llm_service(provider="groq", model="llama-3.3-70b-versatile")
        
    async def _get_search_context(self, search_id: str, query: str) -> Optional[Dict]:
        doc = await MongoDB.get_collection("job_searches").find_one(
            {"_id": ObjectId(search_id)},
            {
                "insights": 1, 
                "manual_input": 1, 
                "profile": 1,
                "preferences": 1,
            }
        )
        
        if not doc:
            return None

        if not doc.get("insights"):
            doc["insights"] = await self._generate_insights_on_demand(search_id, doc)

        try:
            from src.services.jobs.job_vector_service import get_job_vector_service
            vector_service = get_job_vector_service()

            relevant_job_ids = await vector_service.search_jobs(
                search_id=search_id,
                query=query,
                n_results=10  
            )
 
            if relevant_job_ids:
                all_jobs_doc = await MongoDB.get_collection("job_searches").find_one(
                    {"_id": ObjectId(search_id)},
                    {"scored_jobs": 1}
                )
                all_jobs = all_jobs_doc.get("scored_jobs", []) if all_jobs_doc else []

                relevant_jobs = [
                    job for job in all_jobs 
                    if job.get("job_id") in relevant_job_ids
                ]
                doc["scored_jobs"] = relevant_jobs
            else:
                top_jobs_doc = await MongoDB.get_collection("job_searches").find_one(
                    {"_id": ObjectId(search_id)},
                    {"scored_jobs": {"$slice": 10}}
                )
                doc["scored_jobs"] = top_jobs_doc.get("scored_jobs", []) if top_jobs_doc else []
                
        except Exception as e:
            print(f"Chroma search failed, using MongoDB fallback: {e}")
            top_jobs_doc = await MongoDB.get_collection("job_searches").find_one(
                {"_id": ObjectId(search_id)},
                {"scored_jobs": {"$slice": 10}}
            )
            doc["scored_jobs"] = top_jobs_doc.get("scored_jobs", []) if top_jobs_doc else []
        
        return doc

    async def _generate_insights_on_demand(self, search_id: str, search_doc: Dict) -> Dict:
        print(f"Generating insights on-demand for search {search_id[:8]}...")
        
        from src.agents.jobs import get_insights_agent
        from src.models.jobs.schemas import JobScore

        jobs_doc = await MongoDB.get_collection("job_searches").find_one(
            {"_id": ObjectId(search_id)},
            {"scored_jobs": 1, "profile": 1, "manual_input": 1}
        )
        
        if not jobs_doc or not jobs_doc.get("scored_jobs"):
            return {}

        profile = jobs_doc.get("profile") or {}
        manual = jobs_doc.get("manual_input") or {}
        skills = profile.get("skills", []) or manual.get("skills", [])
        experience = profile.get("experience_years", 0) or manual.get("experience_years", 0)
        domains = profile.get("domains", []) or manual.get("preferred_industries", [])

        scored_jobs = jobs_doc.get("scored_jobs", [])
        job_scores = [
            JobScore(
                job_id=job.get("job_id", ""),
                match_score=job.get("match_score", 0),
                component_scores=job.get("component_scores", {}),
                matching_skills=job.get("matching_skills", []),
                missing_skills=job.get("missing_skills", []),
                match_explanation=job.get("match_explanation", "")
            )
            for job in scored_jobs[:20]
        ]

        insights_agent = get_insights_agent()
        result = await insights_agent.generate_insights(
            scored_jobs=job_scores,
            candidate_skills=skills,
            experience_years=experience,
            domains=domains
        )

        insights_dict = {
            "skill_gaps": result.skill_gaps,
            "learning_recommendations": [
                {"skill": lr.skill, "resource": lr.resource, "platform": lr.platform, "time": lr.estimated_time}
                for lr in result.learning_recommendations
            ],
            "resume_improvements": result.resume_improvements,
            "career_paths": result.career_paths,
            "salary_insights": result.salary_insights,
            "interview_tips": result.interview_tips
        }

        await MongoDB.get_collection("job_searches").update_one(
            {"_id": ObjectId(search_id)},
            {"$set": {"insights": insights_dict}}
        )
        
        print(f"Insights generated and cached for search {search_id[:8]}")
        return insights_dict

    def _build_context_string(self, search_data: Dict) -> str:
        context_parts = []

        manual = search_data.get("manual_input")
        profile = search_data.get("profile")
        pref = search_data.get("preferences", {})
        
        target = "Unknown Role"
        if manual: target = manual.get("target_role")
        elif profile and profile.get("domains"): target = profile["domains"][0]
        
        context_parts.append(f"## User Goal: Looking for '{target}' jobs")
        context_parts.append(f"Location Pref: {pref.get('location', 'Any')} (Remote: {pref.get('remote_only')})")
        context_parts.append("")

        insights = search_data.get("insights", {})
        if insights:
            gaps = insights.get("skill_gaps", [])
            if gaps:
                context_parts.append(f"## Key Skill Gaps: {', '.join(gaps[:5])}")
            salary = insights.get("salary_insights", "")
            if salary:
                context_parts.append(f"## Market Info: {salary}")
            context_parts.append("")

        context_parts.append("## Relevant Job Matches:")
        jobs = search_data.get("scored_jobs", [])
        
        for i, job in enumerate(jobs, 1):
            title = job.get("title", "Unknown")
            company = job.get("company", "Unknown")
            loc = job.get("location", "Unknown")
            is_remote = "Remote" if job.get("location_type") == "remote" else ""
            salary_min = job.get("salary_min")
            salary_max = job.get("salary_max")
            
            salary_str = ""
            if salary_min and salary_max:
                salary_str = f"| ${int(salary_min/1000)}k-${int(salary_max/1000)}k"
            elif salary_min:
                salary_str = f"| ${int(salary_min/1000)}k+"
                
            match_score = int(job.get("match_score", 0) * 100)
            why_match = job.get("match_explanation", "Good fit based on skills.")[:150]

            job_line = f"{i}. {title} @ {company} ({match_score}% Match) {is_remote} {salary_str}"
            context_parts.append(job_line)
            context_parts.append(f"   Analysis: {why_match}...")
            
        return "\n".join(context_parts)

    def _get_system_prompt(self, context: str) -> str:
        return f"""You are an expert Career Advisor AI analyzing job search results.

{context}

Your Goal: Help the user decide which jobs to apply for or how to improve their search.

Guidelines:
1. Answer based ONLY on the provided job list (filtered for relevance to their question).
2. Be concise. Do not list full descriptions.
3. If asked about "startups", infer from company names/descriptions.
4. If asked about "salary", use the provided salary ranges.
5. If the user asks for a filter (e.g., "Show me remote jobs"), list the numbers of the jobs that match.

Keep response under 200 words unless detailed analysis is requested.
"""

    async def send_message(
        self,
        search_id: str,
        message: str,
        chat_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        search_data = await self._get_search_context(search_id, message)
        if not search_data:
            return {"message": "Context not found. Please try a new search."}

        context_str = self._build_context_string(search_data)
        system_prompt = self._get_system_prompt(context_str)

        messages = ""
        if chat_history:
            for msg in chat_history[-6:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                messages += f"{role}: {msg.get('content')}\n"
        
        prompt = f"{messages}\nUser: {message}\nAssistant:"

        response = await self.llm.generate(
            prompt=prompt,
            system_prompt=system_prompt
        )
        
        return {
            "message": response.strip(),
            "timestamp": datetime.utcnow().isoformat()
        }


_job_chat_service = None

def get_job_chat_service() -> JobChatService:
    global _job_chat_service
    if _job_chat_service is None:
        _job_chat_service = JobChatService()
    return _job_chat_service
