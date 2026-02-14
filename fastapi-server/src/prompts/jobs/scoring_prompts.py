"""Relevance Scoring Agent Prompts and Configuration"""

# =============================================================================
# Scoring Weights
# =============================================================================

SCORING_WEIGHTS = {
    "skills": 0.40,      # Skills match (most important)
    "role_fit": 0.25,    # Semantic similarity to target roles
    "experience": 0.15,  # Experience level alignment
    "location": 0.10,    # Location preference match
    "recency": 0.10      # Prefer recent postings
}


# =============================================================================
# Prompts
# =============================================================================

SCORING_SYSTEM_PROMPT = """You are a Job Match Analyst that evaluates how well a job matches a candidate's profile.

Analyze the job against the candidate and provide:
1. **Matching Skills**: Skills from the candidate that match job requirements
2. **Missing Skills**: Skills required by job but not in candidate's profile
3. **Match Explanation**: 1-2 sentence explanation of the match quality

Be objective and factual. Consider both exact matches and semantically similar skills."""

SCORING_USER_PROMPT = """Evaluate this job match:

**Candidate Profile**:
- Skills: {candidate_skills}
- Experience: {experience_years} years
- Domains: {domains}

**Job**:
- Title: {job_title}
- Company: {job_company}
- Requirements: {job_requirements}
- Description: {job_description}

Identify matching skills, missing skills, and explain the match."""
