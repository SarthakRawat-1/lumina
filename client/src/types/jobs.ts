/**
 * Centralized Jobs Types
 * 
 * All job discovery-related types used across the application
 */

// =============================================================================
// Profile Types
// =============================================================================

export interface ResumeProfile {
    skills: string[];
    experience_years: number;
    domains: string[];
    education: Array<{ degree?: string; institution?: string }>;
    projects: Array<{ name?: string; description?: string }>;
}

export interface ManualJobInput {
    target_role: string;
    skills: string[];
    experience_years: number;
    preferred_industries: string[];
    location?: string;
    remote_only: boolean;
}

// =============================================================================
// Job Types
// =============================================================================

export type LocationType = 'onsite' | 'remote' | 'hybrid';

export interface ScoredJob {
    job_id: string;
    title: string;
    company: string;
    location: string;
    location_type: LocationType;
    description: string;
    apply_url: string;
    salary_min?: number;
    salary_max?: number;
    match_score: number;
    matching_skills: string[];
    missing_skills: string[];
    match_explanation: string;
}

// =============================================================================
// Insights Types
// =============================================================================

export interface LearningRecommendation {
    skill: string;
    resource: string;
    platform?: string;
    time?: string;
}

export interface CareerInsights {
    skill_gaps: string[];
    learning_recommendations: LearningRecommendation[];
    resume_improvements: string[];
    career_paths: string[];
    salary_insights: string;
    interview_tips: string[];
}

// =============================================================================
// API Response Types
// =============================================================================

export interface JobSearchResponse {
    search_id: string;
    status: string;
    total_jobs: number;
    jobs: ScoredJob[];
    insights?: CareerInsights;
}

export interface ResumeParseResponse {
    success: boolean;
    profile?: ResumeProfile;
    skills_count: number;
    experience_years: number;
    message: string;
}

export interface ChatRefinementResponse {
    applied_filter: string;
    jobs_after_filter: number;
    response_message: string;
}
