/**
 * Roadmap API - Client functions for roadmap endpoints
 */

import { getAuthHeader } from '@/context/AuthContext';
import type {
    Roadmap,
    GenerateRoadmapRequest,
    NodeDetails,
    UserProgress,
    ProgressStatus,
} from '@/types';

const API_BASE = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000/api';

// =============================================================================
// API Functions
// =============================================================================

/**
 * Generate a new roadmap using AI
 */
export async function generateRoadmap(request: GenerateRoadmapRequest): Promise<Roadmap> {
    const response = await fetch(`${API_BASE}/roadmaps/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate roadmap');
    }

    return response.json();
}

/**
 * Get a roadmap by ID
 */
export async function getRoadmap(roadmapId: string): Promise<Roadmap> {
    const response = await fetch(`${API_BASE}/roadmaps/${roadmapId}`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Roadmap not found');
    }

    return response.json();
}

/**
 * Get node details (lazy loaded)
 */
export async function getNodeDetails(
    roadmapId: string,
    nodeId: string,
    language: string = 'en'
): Promise<NodeDetails> {
    const response = await fetch(
        `${API_BASE}/roadmaps/${roadmapId}/nodes/${nodeId}?language=${language}`,
        { headers: getAuthHeader() }
    );

    if (!response.ok) {
        throw new Error('Failed to load node details');
    }

    return response.json();
}

/**
 * Get user progress on a roadmap
 */
export async function getUserProgress(
    roadmapId: string,
    userId: string
): Promise<UserProgress> {
    const response = await fetch(`${API_BASE}/roadmaps/${roadmapId}/progress/${userId}`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to load progress');
    }

    return response.json();
}

/**
 * Update user progress on a node
 */
export async function updateNodeProgress(
    roadmapId: string,
    userId: string,
    nodeId: string,
    status: ProgressStatus
): Promise<void> {
    const response = await fetch(`${API_BASE}/roadmaps/${roadmapId}/progress/${userId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({ node_id: nodeId, status }),
    });

    if (!response.ok) {
        throw new Error('Failed to update progress');
    }
}

/**
 * List all available roadmaps
 */
export async function listRoadmaps(skip: number = 0, limit: number = 20, userId?: string): Promise<Roadmap[]> {
    let url = `${API_BASE}/roadmaps?skip=${skip}&limit=${limit}`;
    if (userId) {
        url += `&user_id=${userId}`;
    }

    const response = await fetch(url, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to load roadmaps');
    }

    return response.json();
}

// =============================================================================
// AI Chat API
// =============================================================================

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    message: string;
    timestamp: string;
}

/**
 * Send a chat message to the AI tutor about a roadmap
 */
export async function sendRoadmapChatMessage(
    roadmapId: string,
    message: string,
    chatHistory: ChatMessage[] = []
): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/roadmaps/${roadmapId}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({
            message,
            chat_history: chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send message');
    }

    return response.json();
}

/**
 * Get suggested questions for a roadmap
 */
export async function getSuggestedQuestions(roadmapId: string): Promise<string[]> {
    const response = await fetch(`${API_BASE}/roadmaps/${roadmapId}/chat/suggestions`, {
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Failed to load suggestions');
    }

    const data = await response.json();
    return data.questions;
}

// Re-export types for backwards compatibility
export type { Roadmap, GenerateRoadmapRequest, NodeDetails, UserProgress, ProgressStatus };
