/**
 * Jobs Hooks - React hooks for job discovery data management
 */

import { useState, useCallback } from 'react';
import { parseResume, searchJobs, getInsights } from '@/lib/jobsApi';
import type {
    ResumeProfile,
    ManualJobInput,
    ScoredJob,
    CareerInsights,
    JobSearchResponse
} from '@/types';

// =============================================================================
// useResumeUpload - Handle resume parsing
// =============================================================================

interface UseResumeUploadResult {
    profile: ResumeProfile | null;
    uploading: boolean;
    error: Error | null;
    upload: (file: File) => Promise<ResumeProfile | null>;
    reset: () => void;
}

export function useResumeUpload(): UseResumeUploadResult {
    const [profile, setProfile] = useState<ResumeProfile | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const upload = useCallback(async (file: File): Promise<ResumeProfile | null> => {
        setUploading(true);
        setError(null);
        try {
            const response = await parseResume(file);
            if (response.success && response.profile) {
                setProfile(response.profile);
                return response.profile;
            }
            throw new Error(response.message || 'Failed to parse resume');
        } catch (err) {
            const e = err instanceof Error ? err : new Error('Upload failed');
            setError(e);
            return null;
        } finally {
            setUploading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setProfile(null);
        setError(null);
    }, []);

    return { profile, uploading, error, upload, reset };
}

// =============================================================================
// useJobSearch - Handle job searching
// =============================================================================

interface UseJobSearchResult {
    searchId: string | null;
    jobs: ScoredJob[];
    totalJobs: number;
    searching: boolean;
    error: Error | null;
    search: (params: {
        profile?: ResumeProfile;
        manual_input?: ManualJobInput;
        location?: string;
        remote_only?: boolean;
    }) => Promise<JobSearchResponse | null>;
    reset: () => void;
}

export function useJobSearch(): UseJobSearchResult {
    const [searchId, setSearchId] = useState<string | null>(null);
    const [jobs, setJobs] = useState<ScoredJob[]>([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const search = useCallback(async (params: {
        profile?: ResumeProfile;
        manual_input?: ManualJobInput;
        location?: string;
        remote_only?: boolean;
    }): Promise<JobSearchResponse | null> => {
        setSearching(true);
        setError(null);
        try {
            const response = await searchJobs(params);
            setSearchId(response.search_id);
            setJobs(response.jobs);
            setTotalJobs(response.total_jobs);
            return response;
        } catch (err) {
            const e = err instanceof Error ? err : new Error('Search failed');
            setError(e);
            return null;
        } finally {
            setSearching(false);
        }
    }, []);

    const reset = useCallback(() => {
        setSearchId(null);
        setJobs([]);
        setTotalJobs(0);
        setError(null);
    }, []);

    return { searchId, jobs, totalJobs, searching, error, search, reset };
}

// =============================================================================
// useCareerInsights - Fetch career insights
// =============================================================================

interface UseCareerInsightsResult {
    insights: CareerInsights | null;
    loading: boolean;
    error: Error | null;
    fetch: (searchId: string) => Promise<CareerInsights | null>;
}

export function useCareerInsights(): UseCareerInsightsResult {
    const [insights, setInsights] = useState<CareerInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchInsights = useCallback(async (searchId: string): Promise<CareerInsights | null> => {
        setLoading(true);
        setError(null);
        try {
            const data = await getInsights(searchId);
            setInsights(data);
            return data;
        } catch (err) {
            const e = err instanceof Error ? err : new Error('Failed to load insights');
            setError(e);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { insights, loading, error, fetch: fetchInsights };
}
