from typing import Optional

from langgraph.graph import StateGraph, START, END

from src.graphs.job_discovery.state import JobDiscoveryState
from src.graphs.job_discovery.nodes import (
    parse_input_node,
    expand_roles_node,
    generate_queries_node,
    discover_jobs_node,
    normalize_jobs_node,
    score_jobs_node,
)
from src.models.jobs.schemas import (
    ResumeProfile,
    ManualJobInput,
    JobPreferences,
)

def build_job_discovery_graph() -> StateGraph:
    graph = StateGraph(JobDiscoveryState)

    graph.add_node("parse_input", parse_input_node)
    graph.add_node("expand_roles", expand_roles_node)
    graph.add_node("generate_queries", generate_queries_node)
    graph.add_node("discover_jobs", discover_jobs_node)
    graph.add_node("normalize_jobs", normalize_jobs_node)
    graph.add_node("score_jobs", score_jobs_node)

    graph.add_edge(START, "parse_input")
    graph.add_edge("parse_input", "expand_roles")
    graph.add_edge("expand_roles", "generate_queries")
    graph.add_edge("generate_queries", "discover_jobs")
    graph.add_edge("discover_jobs", "normalize_jobs")
    graph.add_edge("normalize_jobs", "score_jobs")
    graph.add_edge("score_jobs", END)
    
    return graph.compile()


job_discovery_graph = build_job_discovery_graph()


async def run_job_discovery(
    resume_profile: Optional[ResumeProfile] = None,
    manual_input: Optional[ManualJobInput] = None,
    preferences: Optional[JobPreferences] = None,
    user_id: Optional[str] = None
) -> JobDiscoveryState:
    initial_state: JobDiscoveryState = {
        "resume_profile": resume_profile,
        "manual_input": manual_input,
        "preferences": preferences,
        "user_id": user_id,
        "search_id": None,
        "expanded_roles": [],
        "search_queries": [],
        "raw_jobs": [],
        "normalized_jobs": [],
        "scored_jobs": [],
        "insights": None,
        "chat_history": [],
        "current_filter": None,
        "status": "starting",
        "error": None
    }
    
    result = await job_discovery_graph.ainvoke(initial_state)
    return result
