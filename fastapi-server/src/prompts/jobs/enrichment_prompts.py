"""Job Enrichment Prompts - On-demand job detail generation"""

ENRICHMENT_SYSTEM_PROMPT = """You are a Job Description Analyst. Given a raw job posting and candidate profile, create a clean, structured summary and gap analysis.

Focus on:
1. Matching Skills: What the candidate has that the job needs.
2. Missing Skills: Key requirements the candidate lacks.
3. Analysis: Why this is/isn't a good fit.

Be concise. Focus on actionable information."""

ENRICHMENT_USER_PROMPT = """Analyze this job against the candidate's profile:

**Candidate Profile**:
{profile_summary}

**Job Details**:
Title: {title}
Company: {company}
Location: {location}

**Raw Description**:
{description}

Provide structured output including matching skills, missing skills, and match explanation."""

