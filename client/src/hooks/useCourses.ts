/**
 * Course Hooks - React hooks for course data management
 */

import { useState, useEffect, useCallback } from 'react';
import { courseApi } from '@/lib/courseApi';
import type { Course, Chapter, CourseListResponse, ChapterListResponse } from '@/types';

// =============================================================================
// useCourses - Fetch and manage course list
// =============================================================================

interface UseCoursesResult {
    courses: Course[];
    total: number;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useCourses(): UseCoursesResult {
    const [courses, setCourses] = useState<Course[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await courseApi.getCourses();
            setCourses(response.courses);
            setTotal(response.total);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load courses'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    return { courses, total, loading, error, refetch: fetchCourses };
}

// =============================================================================
// useCourse - Fetch a single course
// =============================================================================

interface UseCourseResult {
    course: Course | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useCourse(courseId: string | undefined): UseCourseResult {
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCourse = useCallback(async () => {
        if (!courseId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await courseApi.getCourse(courseId);
            setCourse(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load course'));
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    return { course, loading, error, refetch: fetchCourse };
}

// =============================================================================
// useChapters - Fetch chapters for a course
// =============================================================================

interface UseChaptersResult {
    chapters: Chapter[];
    total: number;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useChapters(courseId: string | undefined): UseChaptersResult {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchChapters = useCallback(async () => {
        if (!courseId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await courseApi.getChapters(courseId);
            setChapters(response.chapters);
            setTotal(response.total);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load chapters'));
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchChapters();
    }, [fetchChapters]);

    return { chapters, total, loading, error, refetch: fetchChapters };
}

// =============================================================================
// useChapter - Fetch a single chapter
// =============================================================================

interface UseChapterResult {
    chapter: Chapter | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useChapter(courseId: string | undefined, chapterId: string | undefined): UseChapterResult {
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchChapter = useCallback(async () => {
        if (!courseId || !chapterId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await courseApi.getChapter(courseId, chapterId);
            setChapter(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load chapter'));
        } finally {
            setLoading(false);
        }
    }, [courseId, chapterId]);

    useEffect(() => {
        fetchChapter();
    }, [fetchChapter]);

    return { chapter, loading, error, refetch: fetchChapter };
}
