/**
 * Hooks Index - Re-exports all domain hooks
 */

// Course hooks
export { useCourses, useCourse, useChapters, useChapter } from './useCourses';

// Jobs hooks
export { useResumeUpload, useJobSearch, useCareerInsights } from './useJobs';

// Video hooks (TTV + Video Assistant)
export { useTTVVideos, useVideoGeneration, useLibraryVideos, useVideoQA } from './useVideos';

// Roadmap hooks
export { useRoadmaps, useRoadmap, useRoadmapGeneration, useNodeDetails, useRoadmapProgress } from './useRoadmaps';
