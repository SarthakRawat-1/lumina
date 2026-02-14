from typing import List

from src.graphs.job_discovery.state import JobDiscoveryState
from src.models.jobs.schemas import (
    ResumeProfile,
    Job,
    ScoredJob,
    CareerInsights,
    DiscoveredJob,
    NormalizedJob,
    EnrichedJob,
    JobScore,
)
from src.agents.jobs import (
    get_resume_agent,
    get_intent_agent,
    get_query_agent,
    get_discovery_agent,
    get_normalization_agent,
    get_scoring_agent,
    get_insights_agent,
)

async def parse_input_node(state: JobDiscoveryState) -> dict:
    if state.get("resume_profile"):
        return {"status": "input_parsed"}

    if state.get("manual_input"):
        manual = state["manual_input"]
        profile = ResumeProfile(
            skills=manual.skills if hasattr(manual, 'skills') else [],
            experience_years=manual.experience_years if hasattr(manual, 'experience_years') else 0,
            domains=manual.preferred_industries if hasattr(manual, 'preferred_industries') else [],
            education=[],
            projects=[],
            raw_text=""
        )
        return {
            "resume_profile": profile,
            "status": "input_parsed"
        }
    
    return {"status": "no_input", "error": "No resume or manual input provided"}


async def expand_roles_node(state: JobDiscoveryState) -> dict:
    intent_agent = get_intent_agent()
    
    profile = state.get("resume_profile")
    manual = state.get("manual_input")
    
    if manual and hasattr(manual, 'target_role') and manual.target_role:
        result = await intent_agent.expand_roles_from_manual(
            target_role=manual.target_role,
            skills=manual.skills if hasattr(manual, 'skills') else [],
            experience_years=manual.experience_years if hasattr(manual, 'experience_years') else 0,
            preferred_industries=manual.preferred_industries if hasattr(manual, 'preferred_industries') else []
        )
    elif profile:
        result = await intent_agent.expand_roles_from_resume(
            skills=profile.skills,
            experience_years=profile.experience_years,
            domains=profile.domains,
            education=profile.education
        )
    else:
        return {"status": "expand_failed", "error": "No profile available"}

    all_roles = result.primary_roles + [r for r in result.expanded_roles if r not in result.primary_roles]
    
    return {
        "expanded_roles": all_roles,
        "status": "roles_expanded"
    }


async def generate_queries_node(state: JobDiscoveryState) -> dict:
    query_agent = get_query_agent()
    
    roles = state.get("expanded_roles", [])
    preferences = state.get("preferences")
    
    location = preferences.location if preferences else None
    remote_only = preferences.remote_only if preferences else False
    
    result = await query_agent.generate_queries(
        roles=roles,
        location=location,
        remote_only=remote_only
    )
    
    return {
        "search_queries": result.queries,
        "status": "queries_generated"
    }


async def discover_jobs_node(state: JobDiscoveryState) -> dict:
    discovery_agent = get_discovery_agent()
    
    queries = state.get("search_queries", [])
    preferences = state.get("preferences")
    
    location = preferences.location if preferences else None
    remote_only = preferences.remote_only if preferences else False
    
    results = await discovery_agent.discover_jobs(
        queries=queries,
        location=location,
        remote_only=remote_only,
        max_results_per_query=10
    )

    all_jobs = []
    for result in results:
        for job in result.jobs:
            job_model = Job(
                job_id="",  
                title=job.title,
                company=job.company,
                location=job.location,
                location_type="onsite",  
                description=job.description,
                apply_url=job.apply_url,
                sources_found=[job.source]
            )
            all_jobs.append(job_model)
    
    return {
        "raw_jobs": all_jobs,
        "status": "jobs_discovered"
    }


async def normalize_jobs_node(state: JobDiscoveryState) -> dict:
    normalization_agent = get_normalization_agent()
    
    raw_jobs = state.get("raw_jobs", [])

    discovered_jobs = [
        DiscoveredJob(
            title=job.title,
            company=job.company,
            location=job.location,
            description=job.description,
            apply_url=job.apply_url,
            source=job.sources_found[0] if job.sources_found else "unknown"
        )
        for job in raw_jobs
    ]
    
    result = await normalization_agent.normalize_and_deduplicate(discovered_jobs)

    normalized = [
        Job(
            job_id=nj.job_id,
            title=nj.title,
            company=nj.company,
            location=nj.location,
            location_type=nj.location_type,
            description=nj.description,
            apply_url=nj.apply_url,
            salary_min=nj.salary_min,
            salary_max=nj.salary_max,
            posted_date=nj.posted_date,
            sources_found=nj.sources_found
        )
        for nj in result.jobs
    ]
    
    print(f"📊 Normalized: {result.total_before} → {result.total_after} jobs ({result.duplicates_removed} duplicates removed)")
    
    return {
        "normalized_jobs": normalized,
        "status": "jobs_normalized"
    }


async def score_jobs_node(state: JobDiscoveryState) -> dict:
    scoring_agent = get_scoring_agent()
    
    normalized = state.get("normalized_jobs", [])
    profile = state.get("resume_profile")
    manual = state.get("manual_input")
    roles = state.get("expanded_roles", [])
    preferences = state.get("preferences")

    preferred_location = preferences.location if preferences else None
    remote_only = preferences.remote_only if preferences else False

    def _location_matches(preferred: str, actual: str) -> bool:
        preferred_l = (preferred or "").lower().strip()
        actual_l = (actual or "").lower().strip()
        if not preferred_l or not actual_l:
            return False

        if "india" in preferred_l:
            indian_markers = [
                "india",
                "mumbai",
                "bombay",
                "delhi",
                "new delhi",
                "bengaluru",
                "bangalore",
                "hyderabad",
                "chennai",
                "pune",
                "kolkata",
                "calcutta",
                "ahmedabad",
                "gurgaon",
                "gurugram",
                "noida",
            ]
            return any(m in actual_l for m in indian_markers)

        return preferred_l in actual_l

    if preferred_location and not remote_only:
        normalized = [
            job for job in normalized
            if job.location_type == "remote" or _location_matches(preferred_location, job.location)
        ]

    jobs_for_scoring = [
        EnrichedJob(
            job_id=job.job_id,
            title=job.title,
            company=job.company,
            location=job.location,
            location_type=job.location_type,
            description=job.description,
            full_description=job.description,  
            requirements=[],  
            benefits=[],      
            apply_url=job.apply_url,
            salary_min=job.salary_min,
            salary_max=job.salary_max
        )
        for job in normalized
    ]
    
    result = await scoring_agent.score_jobs(
        jobs=jobs_for_scoring,
        profile=profile,
        manual_input=manual,
        target_roles=roles,
        preferred_location=preferred_location,
        remote_only=remote_only
    )

    scored = [
        ScoredJob(
            job=normalized[i] if i < len(normalized) else Job(
                job_id=js.job_id,
                title="",
                company="",
                apply_url=""
            ),
            match_score=js.match_score,
            component_scores=js.component_scores,
            matching_skills=js.matching_skills,
            missing_skills=js.missing_skills,
            match_explanation=js.match_explanation
        )
        for i, js in enumerate(result.scored_jobs)
    ]
    
    return {
        "scored_jobs": scored,
        "status": "jobs_scored"
    }


async def generate_insights_node(state: JobDiscoveryState) -> dict:
    insights_agent = get_insights_agent()
    
    scored_jobs = state.get("scored_jobs", [])
    profile = state.get("resume_profile")
    manual = state.get("manual_input")

    if profile:
        skills = profile.skills
        experience = profile.experience_years
        domains = profile.domains
    elif manual:
        skills = manual.skills if hasattr(manual, 'skills') else []
        experience = manual.experience_years if hasattr(manual, 'experience_years') else 0
        domains = manual.preferred_industries if hasattr(manual, 'preferred_industries') else []
    else:
        skills, experience, domains = [], 0, []

    job_scores = [
        JobScore(
            job_id=sj.job.job_id,
            match_score=sj.match_score,
            component_scores=sj.component_scores,
            matching_skills=sj.matching_skills,
            missing_skills=sj.missing_skills,
            match_explanation=sj.match_explanation
        )
        for sj in scored_jobs
    ]
    
    result = await insights_agent.generate_insights(
        scored_jobs=job_scores,
        candidate_skills=skills,
        experience_years=experience,
        domains=domains
    )
    
    insights = CareerInsights(
        skill_gaps=result.skill_gaps,
        learning_recommendations=[
            {"skill": lr.skill, "resource": lr.resource, "platform": lr.platform, "time": lr.estimated_time}
            for lr in result.learning_recommendations
        ],
        resume_improvements=result.resume_improvements,
        career_paths=result.career_paths,
        salary_insights=result.salary_insights,
        interview_tips=result.interview_tips
    )
    
    return {
        "insights": insights,
        "status": "complete"
    }
