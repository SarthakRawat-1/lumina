/**
 * Documents API - Client functions for collaborative documents and notes (Express)
 */

import { getAuthHeader } from '@/context/AuthContext';

const API_BASE = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:3002/api';

// =============================================================================
// Helper function for authenticated JSON requests
// =============================================================================

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
}

// =============================================================================
// Documents API Functions
// =============================================================================

export interface DocumentMeta {
    name: string;
    createdAt: string;
    updatedAt: string;
}

export const documentsApi = {
    // List user's documents
    async getAll(): Promise<DocumentMeta[]> {
        return fetchJson<DocumentMeta[]>('/documents');
    },

    // Get document metadata by name
    async getByName(name: string): Promise<DocumentMeta> {
        return fetchJson<DocumentMeta>(`/documents/${name}`);
    },

    // Delete document by name
    async delete(name: string): Promise<void> {
        await fetchJson(`/documents/${name}`, { method: 'DELETE' });
    },
};

// =============================================================================
// Pending Notes API Functions (for Hocuspocus pre-population)
// =============================================================================

export interface PendingNoteCreate {
    content: string;
    title: string;
    sourceType: string;
    sourceId?: string;
}

export interface PendingNoteResponse {
    documentId: string;
    url: string;
    expiresAt: string;
}

export const notesApi = {
    // Create a pending note
    async createPending(data: PendingNoteCreate): Promise<PendingNoteResponse> {
        return fetchJson<PendingNoteResponse>('/notes/pending', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Get pending note details
    async getPending(documentId: string): Promise<{ documentId: string; content: string; title: string, sourceType: string }> {
        return fetchJson(`/notes/pending/${documentId}`);
    },

    // Delete pending note
    async deletePending(documentId: string): Promise<void> {
        await fetchJson(`/notes/pending/${documentId}`, { method: 'DELETE' });
    },
};
