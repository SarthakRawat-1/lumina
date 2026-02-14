"""Job Discovery Agents Package"""
from src.models.jobs.schemas import (
    ResumeParseResult,
    RoleExpansionResult,
    SearchQueryResult,
    DiscoveredJob,
    DiscoveryResult,
    NormalizedJob,
    NormalizationResult,
    EnrichedJob,
    JobScore,
    ScoringResult,
    CareerInsightsResult,
    LearningRecommendation,
    ChatRefinementRequest,
)

from src.agents.jobs.resume_agent import ResumeAgent, get_resume_agent
from src.agents.jobs.intent_agent import IntentAgent, get_intent_agent
from src.agents.jobs.query_agent import QueryAgent, get_query_agent
from src.agents.jobs.discovery_agent import DiscoveryAgent, get_discovery_agent
from src.agents.jobs.normalization_agent import NormalizationAgent, get_normalization_agent
from src.agents.jobs.scoring_agent import ScoringAgent, get_scoring_agent
from src.agents.jobs.insights_agent import InsightsAgent, get_insights_agent

__all__ = [
    # Schemas
    "ResumeParseResult",
    "RoleExpansionResult",
    "SearchQueryResult",
    "DiscoveredJob",
    "DiscoveryResult",
    "NormalizedJob",
    "NormalizationResult",
    "EnrichedJob",
    "JobScore",
    "ScoringResult",
    "CareerInsightsResult",
    "LearningRecommendation",
    "ChatRefinementRequest",
    # Agents
    "ResumeAgent",
    "get_resume_agent",
    "IntentAgent",
    "get_intent_agent",
    "QueryAgent",
    "get_query_agent",
    "DiscoveryAgent",
    "get_discovery_agent",
    "NormalizationAgent",
    "get_normalization_agent",
    "ScoringAgent",
    "get_scoring_agent",
    "InsightsAgent",
    "get_insights_agent",
]


