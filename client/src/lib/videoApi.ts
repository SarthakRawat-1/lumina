/**
 * Video API - Client functions for TTV (Text-to-Video) endpoints
 */

import { getAuthHeader } from '@/context/AuthContext';
import type {
    Video,
    VideoListItem,
    GenerateVideoRequest,
    LanguageOption,
} from '@/types';

const API_BASE = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000/api';

// =============================================================================
// API Functions
// =============================================================================

/**
 * Generate a new video using AI
 */
export async function generateVideo(request: GenerateVideoRequest): Promise<Video> {
    const response = await fetch(`${API_BASE}/videos/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate video');
    }

    return response.json();
}

/**
 * Get a video by its video_id
 */
export async function getVideo(videoId: string): Promise<Video> {
    const response = await fetch(`${API_BASE}/videos/${videoId}`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Video not found');
    }

    return response.json();
}

/**
 * List all generated videos
 */
export async function listVideos(skip: number = 0, limit: number = 20, userId?: string): Promise<VideoListItem[]> {
    let url = `${API_BASE}/videos?skip=${skip}&limit=${limit}`;
    if (userId) {
        url += `&user_id=${userId}`;
    }

    const response = await fetch(url, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to load videos');
    }

    return response.json();
}

/**
 * Delete a video
 */
export async function deleteVideo(videoId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/videos/${videoId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to delete video');
    }
}

/**
 * Get available languages for video generation
 */
export async function getAvailableLanguages(): Promise<LanguageOption[]> {
    const response = await fetch(`${API_BASE}/videos/languages/available`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        // Return default languages if endpoint fails
        return [
            { code: 'English (US)', name: 'English (US)', native: 'English' },
            { code: 'French', name: 'French', native: 'Français' },
            { code: 'German', name: 'German', native: 'Deutsch' },
            { code: 'Spanish', name: 'Spanish', native: 'Español' },
            { code: 'Hindi', name: 'Hindi', native: 'हिन्दी' },
        ];
    }

    const data = await response.json();
    return data.languages;
}

/**
 * Render video to MP4 (server-side)
 */
const RENDER_API_BASE = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:3002/api';

/**
 * Render video to MP4 (server-side via Express/Remotion)
 */
export async function renderVideo(videoId: string, videoData: Video, force: boolean = false): Promise<{ message: string, status: string }> {
    const response = await fetch(`${RENDER_API_BASE}/videos/render`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({
            videoId,
            videoData,
            force
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to render video');
    }

    return response.json();
}

/**
 * Get render status
 */
export async function getRenderStatus(videoId: string): Promise<{ status: string, file?: string, gcsUrl?: string, error?: string }> {
    const response = await fetch(`${RENDER_API_BASE}/videos/status/${videoId}`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        return { status: 'unknown' };
    }
    return response.json();
}

/**
 * Get download URL
 */
export function getDownloadUrl(videoId: string): string {
    return `${RENDER_API_BASE}/videos/download/${videoId}`;
}

// Re-export types for backwards compatibility
export type { Video, VideoListItem, GenerateVideoRequest, LanguageOption };

// Re-export getAuthHeader for other modules that need it
export { getAuthHeader } from '@/context/AuthContext';
