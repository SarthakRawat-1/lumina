/**
 * Centralized Video Types
 * 
 * Types for both TTV (Text-to-Video) and Video Assistant features
 */

// =============================================================================
// TTV (Text-to-Video) Types
// =============================================================================

export interface VideoScene {
    index: number;
    caption: string;
    image_url: string;
    audio_url: string;
    duration_frames: number;
}

export interface Video {
    id: string;
    video_id: string;
    topic: string;
    language: string;
    duration_mode: string;
    fps: number;
    total_duration_frames: number;
    total_duration_seconds: number;
    scenes: VideoScene[];
    created_at: string;
    render_file?: string;
    render_size_bytes?: number;
    rendered_at?: string;
}

export interface VideoListItem {
    id: string;
    video_id: string;
    topic: string;
    language: string;
    duration_seconds: number;
    scene_count: number;
    created_at: string;
}

export interface GenerateVideoRequest {
    topic: string;
    language?: string;
    duration_mode?: 'short' | 'medium' | 'long';
    user_id?: string;
}

export interface LanguageOption {
    code: string;
    name: string;
    native: string;
}

// =============================================================================
// Video Assistant Types
// =============================================================================

export interface LibraryVideo {
    id: string;
    title: string;
    source_type: 'youtube' | 'upload';
    source_id: string;
    source_url?: string;
    duration_seconds: number | null;
    language: string;
    segment_count: number;
    has_summary: boolean;
    has_chapters: boolean;
    created_at: string;
}

export interface Timestamp {
    seconds: number;
    formatted: string;
    text: string;
}

export interface QAResponse {
    answer: string;
    confidence: 'high' | 'medium' | 'low';
    timestamps: Timestamp[];
}

export interface VideoSummary {
    summary: string;
    key_points: string[];
    topics: string[];
    cached: boolean;
}

export interface VideoChapter {
    title: string;
    start_time: number;
    formatted_time: string;
    summary: string;
}

export interface ChaptersResponse {
    chapters: VideoChapter[];
    cached: boolean;
}

export interface TeachBackEvaluation {
    covered: string[];
    unclear: string[];
    missed: string[];
    understanding_level?: string;
    recall_score?: number;
    explanation_score?: number;
    application_score?: number;
    overall_score?: number;
    identified_gaps?: string[];
    suggested_clarifications?: string[];
    strengths?: string[];
}

export interface TeachBackResponse {
    prompt?: string;
    evaluation?: TeachBackEvaluation;
    follow_up_question?: string;
    mastery_score?: number;
    encouragement?: string;
    is_complete?: boolean;
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
