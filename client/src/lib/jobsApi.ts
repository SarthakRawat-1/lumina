/**
 * Jobs API - Client functions for job discovery endpoints
 */

import { getAuthHeader } from '@/context/AuthContext';
import type {
    ResumeProfile,
    ManualJobInput,
    ScoredJob,
    CareerInsights,
    JobSearchResponse,
    ResumeParseResponse,
    ChatRefinementResponse,
} from '@/types';

const API_BASE = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000/api';

export interface JobResultsResponse {
    search_id: string;
    status: string;
    total_jobs: number;
    jobs: ScoredJobResponse[];
    insights?: any;
}

export interface ScoredJobResponse {
    job_id: string;
    title: string;
    company: string;
    location: string;
    location_type: string;
    description: string;
    apply_url: string;
    salary_min?: number;
    salary_max?: number;
    match_score: number;
    matching_skills: string[];
    missing_skills: string[];
    match_explanation: string;
}

export interface JobEnrichmentResponse {
    summary: string;
    key_requirements: string[];
    nice_to_haves: string[];
    benefits: string[];
    company_info: string;
    matching_skills: string[];
    missing_skills: string[];
    match_explanation: string;
}

// =============================================================================
// API Functions
// =============================================================================

export async function listJobSearches(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/jobs/history`, {
        headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to list job searches');
    return response.json();
}

export async function getJobSearchResults(searchId: string, skip: number = 0, limit: number = 20): Promise<JobResultsResponse> {
    const response = await fetch(`${API_BASE}/jobs/history/${searchId}?skip=${skip}&limit=${limit}`, {
        headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to get job search results');
    return response.json();
}

/**
 * Upload and parse a resume PDF
 */
export async function parseResume(file: File): Promise<ResumeParseResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/jobs/upload-resume`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Failed to upload resume');
    }

    return response.json();
}

/**
 * Search for jobs based on profile or manual input
 */
export async function searchJobs(params: {
    profile?: ResumeProfile;
    manual_input?: ManualJobInput;
    location?: string;
    remote_only?: boolean;
    hybrid_ok?: boolean;
}): Promise<JobSearchResponse> {
    const response = await fetch(`${API_BASE}/jobs/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Search failed' }));
        throw new Error(error.detail || 'Failed to search jobs');
    }

    return response.json();
}

/**
 * Get job details by ID
 */
export async function getJobDetails(jobId: string): Promise<ScoredJobResponse> {
    const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to get job details');
    }

    return response.json();
}

/**
 * Get enriched job details (summary, structured requirements)
 */
export async function enrichJob(jobId: string): Promise<JobEnrichmentResponse> {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/enrich`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to enrich job');
    }

    return response.json();
}

/**
 * Refine job search via chat
 */
export async function refineSearch(searchId: string, message: string): Promise<ChatRefinementResponse> {
    const response = await fetch(`${API_BASE}/jobs/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({
            search_id: searchId,
            message,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to refine search');
    }

    return response.json();
}

/**
 * Get career insights for a search
 */
export async function getInsights(searchId: string): Promise<CareerInsights> {
    const response = await fetch(`${API_BASE}/jobs/insights/${searchId}`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to get insights');
    }

    return response.json();
}

// Re-export types for backwards compatibility
export type { ResumeProfile, ManualJobInput, ScoredJob, CareerInsights, JobSearchResponse, ResumeParseResponse };
