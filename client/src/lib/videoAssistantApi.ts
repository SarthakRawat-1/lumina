/**
 * Video Assistant API - Client functions for Video AI Assistant endpoints
 */

import { getAuthHeader } from '@/context/AuthContext';
import type {
    LibraryVideo,
    QAResponse,
    VideoSummary,
    ChaptersResponse,
    TeachBackResponse,
    VideoChapter as Chapter,
    ChatHistoryResponse,
} from '@/types';

export interface EnhancedTeachBackResponse extends TeachBackResponse {
    session_id?: string;
    session_progress?: {
        current_concept?: string;
        concept_index?: number;
        total_concepts?: number;
        mastered_concepts?: number;
        current_attempt?: number;
    };
    feedback?: string;
    next_concept_prompt?: string;
}

const API_BASE = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000/api';

// =============================================================================
// API Functions
// =============================================================================

/**
 * Add a video to the library (YouTube URL)
 */
export async function addVideo(
    url: string,
    title?: string,
    language: string = 'en',
    userId?: string
): Promise<LibraryVideo> {
    const response = await fetch(`${API_BASE}/video-assistant/videos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({ url, title, language, user_id: userId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add video');
    }

    return response.json();
}

/**
 * Get a video by ID
 */
export async function getLibraryVideo(videoId: string): Promise<LibraryVideo> {
    const response = await fetch(`${API_BASE}/video-assistant/videos/${videoId}`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Video not found');
    }

    return response.json();
}

/**
 * List all videos in the library
 */
export async function listLibraryVideos(
    skip: number = 0,
    limit: number = 20,
    userId?: string
): Promise<LibraryVideo[]> {
    let url = `${API_BASE}/video-assistant/videos?skip=${skip}&limit=${limit}`;
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
 * Ask a question about a video
 */
export async function askVideoQuestion(
    videoId: string,
    question: string,
    currentTime?: number
): Promise<QAResponse> {
    const response = await fetch(`${API_BASE}/video-assistant/videos/${videoId}/qa`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({
            question,
            current_time: currentTime,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get answer');
    }

    return response.json();
}

/**
 * Get video summary
 */
export async function getVideoSummary(
    videoId: string,
    regenerate: boolean = false
): Promise<VideoSummary> {
    const url = `${API_BASE}/video-assistant/videos/${videoId}/summary${regenerate ? '?regenerate=true' : ''}`;
    const response = await fetch(url, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get summary');
    }

    return response.json();
}

/**
 * Get auto-generated chapters
 */
export async function getVideoChapters(
    videoId: string,
    regenerate: boolean = false,
    targetChapters: number = 8
): Promise<ChaptersResponse> {
    let url = `${API_BASE}/video-assistant/videos/${videoId}/chapters`;
    const params = new URLSearchParams();
    if (regenerate) params.append('regenerate', 'true');
    if (targetChapters !== 8) params.append('target_chapters', targetChapters.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get chapters');
    }

    return response.json();
}

/**
 * Delete a video from the library
 */
export async function deleteLibraryVideo(videoId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/video-assistant/videos/${videoId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to delete video');
    }
}

/**
 * Teach-back mode - Socratic learning evaluation with session management
 */
export async function teachBack(
    videoId: string,
    startTime: number = 0,
    endTime?: number,
    userId?: string,
    userExplanation?: string,
    sessionId?: string,
    bloomLevel: string = 'understand'
): Promise<EnhancedTeachBackResponse> {
    const isInitial = !userExplanation;

    const response = await fetch(`${API_BASE}/video-assistant/videos/${videoId}/teach-back`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({
            start_time: startTime,
            end_time: endTime,
            user_id: userId,
            user_explanation: userExplanation,
            is_initial: isInitial,
            session_id: sessionId,
            bloom_level: bloomLevel,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to evaluate');
    }

    return response.json();
}

/**
 * Upload a video file
 */
export async function uploadVideo(
    file: File,
    title: string,
    language: string = 'en-US',
    userId?: string,
    onProgress?: (percent: number) => void
): Promise<LibraryVideo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('language', language);
    if (userId) {
        formData.append('user_id', userId);
    }

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress((e.loaded / e.total) * 100);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.detail || 'Upload failed'));
                } catch (_) {
                    reject(new Error('Upload failed'));
                }
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('POST', `${API_BASE}/video-assistant/videos/upload`);
        const token = localStorage.getItem('lumina_token');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
    });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get YouTube video URL from source_id
 */
export function getYouTubeUrl(sourceId: string): string {
    return `https://www.youtube.com/watch?v=${sourceId}`;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
    const secs = Math.floor(seconds);
    if (secs >= 3600) {
        const hours = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get video URL based on source type
 */
export function getVideoUrl(video: LibraryVideo): string {
    const FASTAPI_BASE = import.meta.env.VITE_FASTAPI_URL?.replace('/api', '') || 'http://localhost:8000';

    if (video.source_type === 'youtube') {
        return `https://www.youtube.com/watch?v=${video.source_id}`;
    } else if (video.source_type === 'upload') {
        if (video.source_url) {
            return `${FASTAPI_BASE}${video.source_url}`;
        }
        return `${FASTAPI_BASE}/uploads/${video.source_id}.mp4`;
    }
    return '';
}

// =============================================================================
// Chat History API Functions
// =============================================================================

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamps?: { seconds: number; formatted: string; text: string }[];
    noteLink?: string;
}

/**
 * Get chat history for a video
 */
export async function getChatHistory(videoId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE}/video-assistant/videos/${videoId}/chat`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        console.error('Failed to load chat history');
        return [];
    }

    const data = await response.json();
    return data.messages || [];
}

/**
 * Save a single chat message
 */
export async function saveChatMessage(
    videoId: string,
    message: { role: string; content: string; timestamps?: any[]; noteLink?: string }
): Promise<void> {
    await fetch(`${API_BASE}/video-assistant/videos/${videoId}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify(message),
    });
}

/**
 * Clear all chat history for a video
 */
export async function clearChatHistory(videoId: string): Promise<{ deleted_count: number }> {
    const response = await fetch(`${API_BASE}/video-assistant/videos/${videoId}/chat`, {
        method: 'DELETE',
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to clear chat history');
    }

    return response.json();
}

// Re-export types for backwards compatibility
export type { LibraryVideo, QAResponse, VideoSummary, ChaptersResponse, TeachBackResponse };
