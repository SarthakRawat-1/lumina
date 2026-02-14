/**
 * Analytics API Service
 * Sends analytics events to the Express server
 */

import { getAuthHeader } from '@/context/AuthContext';

const API_BASE = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:3002/api';

export type AnalyticsEventType =
    | 'page_view'
    | 'study_session'
    | 'course_started'
    | 'chapter_completed'
    | 'course_completed'
    | 'video_watched'
    | 'quiz_completed'
    | 'flashcard_session'
    | 'note_created';

interface TrackEventOptions {
    eventType: AnalyticsEventType;
    metadata?: Record<string, unknown>;
}

interface UserStats {
    coursesCompleted: number;
    coursesCreated: number;
    chaptersCompleted: number;
    roadmapsCreated: number;
    nodesCompleted: number;
    videosCreated: number;
    videosWatched: number;
    quizzesCompleted: number;
    flashcardSessions: number;
    totalStudyMinutes: number;
    streak: number;
    weeklyActivity: { day: string; count: number }[];
    quizScores: { date: string; score: number }[];
}

interface HeatmapData {
    heatmapData: Record<string, number>;
}

/**
 * Track an analytics event
 */
export async function trackEvent(options: TrackEventOptions): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/analytics/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify({
                eventType: options.eventType,
                metadata: options.metadata || {},
            }),
        });
        return response.ok;
    } catch (error) {
        console.warn('Analytics tracking failed:', error);
        return false;
    }
}

/**
 * Get user stats
 */
export async function getUserStats(): Promise<UserStats | null> {
    try {
        const response = await fetch(`${API_BASE}/analytics/stats`, {
            headers: getAuthHeader(),
        });
        if (!response.ok) return null;
        return response.json();
    } catch (error) {
        console.warn('Failed to fetch user stats:', error);
        return null;
    }
}

/**
 * Get activity heatmap data
 */
export async function getHeatmapData(): Promise<HeatmapData | null> {
    try {
        const response = await fetch(`${API_BASE}/analytics/heatmap`, {
            headers: getAuthHeader(),
        });
        if (!response.ok) return null;
        return response.json();
    } catch (error) {
        console.warn('Failed to fetch heatmap data:', error);
        return null;
    }
}

// =============================================================================
// Convenience functions
// =============================================================================

export function trackPageView(path: string): void {
    trackEvent({ eventType: 'page_view', metadata: { path } });
}

export function trackStudySession(durationMinutes: number): void {
    trackEvent({ eventType: 'study_session', metadata: { duration: durationMinutes } });
}

export function trackChapterCompleted(courseId: string, chapterId: string): void {
    trackEvent({
        eventType: 'chapter_completed',
        metadata: { courseId, chapterId },
    });
}

export function trackCourseCompleted(courseId: string): void {
    trackEvent({ eventType: 'course_completed', metadata: { courseId } });
}

export function trackVideoWatched(videoId: string, durationSeconds: number): void {
    trackEvent({
        eventType: 'video_watched',
        metadata: { videoId, duration: durationSeconds },
    });
}

export function trackQuizCompleted(score: number, totalQuestions: number, topic: string): void {
    trackEvent({
        eventType: 'quiz_completed',
        metadata: { score, totalQuestions, topic },
    });
}
