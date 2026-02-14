from typing import Optional, List

from src.utils.llm import get_llm_service
from src.models.jobs.schemas import JobScore, CareerInsightsResult, LearningRecommendation
from src.prompts.jobs.insights_prompts import INSIGHTS_SYSTEM_PROMPT, INSIGHTS_USER_PROMPT


class InsightsAgent:
    def __init__(self):
        self.llm = get_llm_service()
    
    async def generate_insights(
        self,
        scored_jobs: List[JobScore],
        candidate_skills: List[str],
        experience_years: int,
        domains: List[str]
    ) -> CareerInsightsResult:

        all_missing_skills = []
        all_requirements = []
        
        for job in scored_jobs[:20]:  
            all_missing_skills.extend(job.missing_skills)

        from collections import Counter
        missing_counter = Counter(all_missing_skills)
        top_missing = [skill for skill, count in missing_counter.most_common(10)]

        total_jobs = len(scored_jobs)
        avg_score = sum(j.match_score for j in scored_jobs) / total_jobs if total_jobs else 0

        top_jobs_summary = ", ".join([
            f"{j.job_id[:8]}... ({int(j.match_score * 100)}%)"
            for j in scored_jobs[:5]
        ])

        prompt = INSIGHTS_USER_PROMPT.format(
            skills=", ".join(candidate_skills[:15]),
            experience_years=experience_years,
            domains=", ".join(domains[:5]),
            total_jobs=total_jobs,
            avg_score=int(avg_score * 100),
            top_jobs=top_jobs_summary,
            missing_skills_summary=", ".join(top_missing),
            common_requirements="See missing skills above"
        )
        
        try:
            result = await self.llm.generate_structured(
                prompt=prompt,
                output_schema=CareerInsightsResult,
                system_prompt=INSIGHTS_SYSTEM_PROMPT
            )

            if not result.skill_gaps:
                result.skill_gaps = top_missing[:5]
            
            return result
            
        except Exception as e:
            print(f"Insights LLM error: {e}")

            return CareerInsightsResult(
                skill_gaps=top_missing[:5],
                learning_recommendations=[],
                resume_improvements=[
                    "Quantify achievements with metrics",
                    "Highlight relevant projects",
                    "Tailor resume to each application"
                ],
                career_paths=[],
                salary_insights=f"Based on {total_jobs} jobs analyzed",
                interview_tips=[
                    "Research the company before interviews",
                    "Prepare examples of your achievements",
                    "Practice common behavioral questions"
                ]
            )


_insights_agent: Optional[InsightsAgent] = None


def get_insights_agent() -> InsightsAgent:
    global _insights_agent
    if _insights_agent is None:
        _insights_agent = InsightsAgent()
    return _insights_agent
