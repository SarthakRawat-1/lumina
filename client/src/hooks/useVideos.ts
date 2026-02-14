/**
 * Video Hooks - React hooks for video data management
 */

import { useState, useEffect, useCallback } from 'react';
import { listVideos, getVideo, generateVideo } from '@/lib/videoApi';
import {
    listLibraryVideos,
    getLibraryVideo,
    askVideoQuestion,
    getVideoSummary
} from '@/lib/videoAssistantApi';
import type {
    Video,
    VideoListItem,
    GenerateVideoRequest,
    LibraryVideo,
    QAResponse,
    VideoSummary,
} from '@/types';

// =============================================================================
// useTTVVideos - Fetch TTV generated videos
// =============================================================================

interface UseTTVVideosResult {
    videos: VideoListItem[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useTTVVideos(userId?: string): UseTTVVideosResult {
    const [videos, setVideos] = useState<VideoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listVideos(0, 100, userId);
            setVideos(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load videos'));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    return { videos, loading, error, refetch: fetchVideos };
}

// =============================================================================
// useVideoGeneration - Handle video generation
// =============================================================================

interface UseVideoGenerationResult {
    video: Video | null;
    generating: boolean;
    error: Error | null;
    generate: (request: GenerateVideoRequest) => Promise<Video | null>;
    reset: () => void;
}

export function useVideoGeneration(): UseVideoGenerationResult {
    const [video, setVideo] = useState<Video | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const generate = useCallback(async (request: GenerateVideoRequest): Promise<Video | null> => {
        setGenerating(true);
        setError(null);
        try {
            const data = await generateVideo(request);
            setVideo(data);
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
        setVideo(null);
        setError(null);
    }, []);

    return { video, generating, error, generate, reset };
}

// =============================================================================
// useLibraryVideos - Fetch Video Assistant library
// =============================================================================

interface UseLibraryVideosResult {
    videos: LibraryVideo[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useLibraryVideos(userId?: string): UseLibraryVideosResult {
    const [videos, setVideos] = useState<LibraryVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listLibraryVideos(0, 100, userId);
            setVideos(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load videos'));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    return { videos, loading, error, refetch: fetchVideos };
}

// =============================================================================
// useVideoQA - Handle video question answering
// =============================================================================

interface UseVideoQAResult {
    answer: QAResponse | null;
    asking: boolean;
    error: Error | null;
    ask: (videoId: string, question: string, currentTime?: number) => Promise<QAResponse | null>;
    reset: () => void;
}

export function useVideoQA(): UseVideoQAResult {
    const [answer, setAnswer] = useState<QAResponse | null>(null);
    const [asking, setAsking] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const ask = useCallback(async (videoId: string, question: string, currentTime?: number): Promise<QAResponse | null> => {
        setAsking(true);
        setError(null);
        try {
            const data = await askVideoQuestion(videoId, question, currentTime);
            setAnswer(data);
            return data;
        } catch (err) {
            const e = err instanceof Error ? err : new Error('Failed to get answer');
            setError(e);
            return null;
        } finally {
            setAsking(false);
        }
    }, []);

    const reset = useCallback(() => {
        setAnswer(null);
        setError(null);
    }, []);

    return { answer, asking, error, ask, reset };
}
