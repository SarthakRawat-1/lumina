/**
 * Roadmap Hooks - React hooks for roadmap data management
 */

import { useState, useEffect, useCallback } from 'react';
import { listRoadmaps, getRoadmap, generateRoadmap, getNodeDetails, getUserProgress } from '@/lib/roadmapApi';
import type {
    Roadmap,
    GenerateRoadmapRequest,
    NodeDetails,
    UserProgress,
} from '@/types';

// =============================================================================
// useRoadmaps - Fetch all roadmaps
// =============================================================================

interface UseRoadmapsResult {
    roadmaps: Roadmap[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useRoadmaps(userId?: string): UseRoadmapsResult {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchRoadmaps = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listRoadmaps(0, 100, userId);
            setRoadmaps(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load roadmaps'));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchRoadmaps();
    }, [fetchRoadmaps]);

    return { roadmaps, loading, error, refetch: fetchRoadmaps };
}

// =============================================================================
// useRoadmap - Fetch a single roadmap
// =============================================================================

interface UseRoadmapResult {
    roadmap: Roadmap | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useRoadmap(roadmapId: string | undefined): UseRoadmapResult {
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchRoadmap = useCallback(async () => {
        if (!roadmapId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getRoadmap(roadmapId);
            setRoadmap(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load roadmap'));
        } finally {
            setLoading(false);
        }
    }, [roadmapId]);

    useEffect(() => {
        fetchRoadmap();
    }, [fetchRoadmap]);

    return { roadmap, loading, error, refetch: fetchRoadmap };
}

// =============================================================================
// useRoadmapGeneration - Handle roadmap generation
// =============================================================================

interface UseRoadmapGenerationResult {
    roadmap: Roadmap | null;
    generating: boolean;
    error: Error | null;
    generate: (request: GenerateRoadmapRequest) => Promise<Roadmap | null>;
    reset: () => void;
}

export function useRoadmapGeneration(): UseRoadmapGenerationResult {
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const generate = useCallback(async (request: GenerateRoadmapRequest): Promise<Roadmap | null> => {
        setGenerating(true);
        setError(null);
        try {
            const data = await generateRoadmap(request);
            setRoadmap(data);
            return data;
        } catch (err) {
            const e = err instanceof Error ? err : new Error('Generation failed');
            setError(e);
            return null;
        } finally {
            setGenerating(false);
        }
    }, []);

    const reset = useCallback(() => {
        setRoadmap(null);
        setError(null);
    }, []);

    return { roadmap, generating, error, generate, reset };
}

// =============================================================================
// useNodeDetails - Fetch node details lazily
// =============================================================================

interface UseNodeDetailsResult {
    details: NodeDetails | null;
    loading: boolean;
    error: Error | null;
    fetch: (roadmapId: string, nodeId: string, language?: string) => Promise<NodeDetails | null>;
}

export function useNodeDetails(): UseNodeDetailsResult {
    const [details, setDetails] = useState<NodeDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchDetails = useCallback(async (
        roadmapId: string,
        nodeId: string,
        language: string = 'en'
    ): Promise<NodeDetails | null> => {
        setLoading(true);
        setError(null);
        try {
            const data = await getNodeDetails(roadmapId, nodeId, language);
            setDetails(data);
            return data;
        } catch (err) {
            const e = err instanceof Error ? err : new Error('Failed to load details');
            setError(e);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { details, loading, error, fetch: fetchDetails };
}

// =============================================================================
// useRoadmapProgress - Track user progress
// =============================================================================

interface UseRoadmapProgressResult {
    progress: UserProgress | null;
    loading: boolean;
    error: Error | null;
    fetch: (roadmapId: string, userId: string) => Promise<void>;
}

export function useRoadmapProgress(): UseRoadmapProgressResult {
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchProgress = useCallback(async (roadmapId: string, userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUserProgress(roadmapId, userId);
            setProgress(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load progress'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { progress, loading, error, fetch: fetchProgress };
}
