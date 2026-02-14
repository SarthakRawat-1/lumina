/**
 * Course API - Client functions for course-related endpoints
 */

import { getAuthHeader } from '@/context/AuthContext';
import type {
    Course,
    CourseCreate,
    CourseListResponse,
    Chapter,
    ChapterListResponse,
    QuestionsResponse,
    AnswerResult,
    ChatResponse,
    ChatHistoryResponse,
    MaterialUploadResponse,
    MaterialUploadPreview,
    SlideGenerateResponse,
    Language,
    ImageSearchResult,
} from '@/types';

const API_BASE = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000/api';

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
        throw new Error(error.detail || `Request failed: ${response.status}`);
    }

    return response.json();
}

// =============================================================================
// Course API Functions
// =============================================================================

export const courseApi = {
    // Get supported languages
    async getLanguages(): Promise<Language[]> {
        const data = await fetchJson<{ languages: Language[] }>('/languages');
        return data.languages;
    },

    // Search for images
    async searchImages(query: string): Promise<ImageSearchResult[]> {
        return fetchJson<ImageSearchResult[]>(`/images/search?query=${encodeURIComponent(query)}`);
    },

    // Create a new course
    async createCourse(course: CourseCreate): Promise<Course> {
        return fetchJson<Course>('/courses', {
            method: 'POST',
            body: JSON.stringify(course),
        });
    },

    // Get user's courses
    async getCourses(): Promise<CourseListResponse> {
        return fetchJson<CourseListResponse>('/courses');
    },

    // Get a specific course
    async getCourse(courseId: string): Promise<Course> {
        return fetchJson<Course>(`/courses/${courseId}`);
    },

    // Delete a course
    async deleteCourse(courseId: string): Promise<void> {
        await fetchJson(`/courses/${courseId}`, { method: 'DELETE' });
    },

    // Get chapters for a course
    async getChapters(courseId: string): Promise<ChapterListResponse> {
        return fetchJson<ChapterListResponse>(`/courses/${courseId}/chapters`);
    },

    // Get a specific chapter
    async getChapter(courseId: string, chapterId: string): Promise<Chapter> {
        return fetchJson<Chapter>(`/courses/${courseId}/chapters/${chapterId}`);
    },

    // Get chapter audio URL for TTS playback
    getChapterAudioUrl(courseId: string, chapterId: string, rate: number = 1.0): string {
        return `${API_BASE}/courses/${courseId}/chapters/${chapterId}/audio?rate=${rate}`;
    },

    // Mark chapter as complete
    async markChapterComplete(courseId: string, chapterId: string): Promise<void> {
        await fetchJson(`/courses/${courseId}/chapters/${chapterId}/complete`, { method: 'PATCH' });
    },

    // Mark chapter as incomplete
    async markChapterIncomplete(courseId: string, chapterId: string): Promise<void> {
        await fetchJson(`/courses/${courseId}/chapters/${chapterId}/incomplete`, { method: 'PATCH' });
    },

    // Get questions for a chapter
    async getQuestions(chapterId: string): Promise<QuestionsResponse> {
        return fetchJson<QuestionsResponse>(`/chapters/${chapterId}/questions`);
    },

    // Submit an answer
    async submitAnswer(chapterId: string, questionId: string, answer: string): Promise<AnswerResult> {
        return fetchJson<AnswerResult>(`/chapters/${chapterId}/questions/${questionId}/answer`, {
            method: 'POST',
            body: JSON.stringify({ answer }),
        });
    },

    // Send chat message
    async sendChatMessage(chapterId: string, message: string): Promise<ChatResponse> {
        return fetchJson<ChatResponse>(`/chapters/${chapterId}/chat`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
    },

    // Get chat history
    async getChatHistory(chapterId: string): Promise<ChatHistoryResponse> {
        return fetchJson<ChatHistoryResponse>(`/chapters/${chapterId}/chat/history`);
    },

    // Clear chat history
    async clearChatHistory(chapterId: string): Promise<void> {
        await fetchJson(`/chapters/${chapterId}/chat/history`, { method: 'DELETE' });
    },

    // Get chat message audio URL
    getChatAudioUrl(chapterId: string, messageId: string, rate: number = 1.0): string {
        return `${API_BASE}/chapters/${chapterId}/chat/${messageId}/audio?rate=${rate}`;
    },

    // Generate flashcards for a chapter (returns blob)
    async generateChapterFlashcards(chapterId: string, type: string = 'testing', difficulty: string = 'intermediate'): Promise<Blob> {
        const response = await fetch(
            `${API_BASE}/chapters/${chapterId}/flashcards?flashcard_type=${type}&difficulty=${difficulty}`,
            { method: 'POST', headers: getAuthHeader() }
        );
        if (!response.ok) throw new Error('Failed to generate flashcards');
        return response.blob();
    },

    // Generate flashcards for entire course (returns blob)
    async generateCourseFlashcards(courseId: string, type: string = 'testing', difficulty: string = 'intermediate'): Promise<Blob> {
        const response = await fetch(
            `${API_BASE}/courses/${courseId}/flashcards?flashcard_type=${type}&difficulty=${difficulty}`,
            { method: 'POST', headers: getAuthHeader() }
        );
        if (!response.ok) throw new Error('Failed to generate course flashcards');
        return response.blob();
    },

    // Generate slides for a chapter
    async generateChapterSlides(chapterId: string, numSlides: number = 15, includeImages: boolean = true, forceRegenerate: boolean = false): Promise<SlideGenerateResponse> {
        return fetchJson<SlideGenerateResponse>(
            `/chapters/${chapterId}/slides?num_slides=${numSlides}&include_images=${includeImages}&force_regenerate=${forceRegenerate}`,
            { method: 'POST' }
        );
    },

    // Generate slides for entire course
    async generateCourseSlides(courseId: string, numSlides: number = 30, includeImages: boolean = true, forceRegenerate: boolean = false): Promise<SlideGenerateResponse> {
        return fetchJson<SlideGenerateResponse>(
            `/courses/${courseId}/slides?num_slides=${numSlides}&include_images=${includeImages}&force_regenerate=${forceRegenerate}`,
            { method: 'POST' }
        );
    },

    // Upload material to expand course graph
    async uploadMaterial(courseId: string, file: File): Promise<MaterialUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('auto_expand', 'true');

        const response = await fetch(`${API_BASE}/courses/${courseId}/materials/upload`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload material');
        return response.json();
    },

    // Preview material expansion
    async previewMaterialUpload(courseId: string, file: File): Promise<MaterialUploadPreview> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/courses/${courseId}/materials/preview`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to preview material');
        return response.json();
    },

    // Process YouTube URL to expand course graph
    async processYouTubeUrl(courseId: string, youtubeUrl: string): Promise<MaterialUploadResponse> {
        return fetchJson<MaterialUploadResponse>(`/courses/${courseId}/materials/youtube`, {
            method: 'POST',
            body: JSON.stringify({ youtube_url: youtubeUrl, auto_expand: true }),
        });
    },
};

// Re-export types for backwards compatibility
export type { Course, CourseCreate, Chapter, AnswerResult, SlideGenerateResponse, MaterialUploadResponse, MaterialUploadPreview, Language, ImageSearchResult };
