/**
 * Centralized Course Types
 * 
 * All course-related types used across the application
 */

// =============================================================================
// Enums
// =============================================================================

export type NodeStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed';
export type CourseStatus = 'creating' | 'ready' | 'failed';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type QuestionType = 'mcq' | 'open_text';

// =============================================================================
// Knowledge Graph Types
// =============================================================================

export interface TopicNode {
    id: string;
    title: string;
    summary: string;
    learning_objectives: string[];
    time_minutes: number;
    status: NodeStatus;
    position_x?: number;
    position_y?: number;
}

export interface TopicEdge {
    source: string;
    target: string;
}

// =============================================================================
// Course Types
// =============================================================================

export interface Course {
    id: string;
    topic: string;
    title: string;
    description: string;
    time_hours: number;
    difficulty: Difficulty;
    language: string;
    status: CourseStatus;
    chapter_count: number;
    image_url?: string;
    nodes: TopicNode[];
    edges: TopicEdge[];
    created_at: string;
    updated_at?: string;
}

export interface CourseCreate {
    topic: string;
    time_hours: number;
    difficulty: Difficulty;
    language: string;
    document_ids?: string[];
    user_id?: string;
    image_url?: string;
    generate_content?: boolean;
}

export interface ImageSearchResult {
    url: string;
    thumbnail_url: string;
    description: string;
    photographer: string;
    unsplash_link: string;
}

export interface CourseListResponse {
    courses: Course[];
    total: number;
}

// =============================================================================
// Chapter Types
// =============================================================================

export type SectionType = 'introduction' | 'concept' | 'case_study' | 'summary';

export interface ContentSection {
    section_type: SectionType;
    title: string;
    paragraphs: string[];
    bullets?: string[] | null;
    tip?: string | null;
    image_index?: number | null;
    image_url?: string | null;
    diagram_code?: string | null;
}

export interface Chapter {
    id: string;
    course_id?: string;
    node_id?: string;
    index: number;
    title: string;
    summary: string;
    content?: string;  // Legacy markdown (for old chapters)
    sections?: ContentSection[];  // New structured format
    images?: string[];
    time_minutes: number;
    is_completed: boolean;
    image_url?: string;
}

export interface ChapterListResponse {
    chapters: Chapter[];
    total: number;
}

// =============================================================================
// Quiz Types
// =============================================================================

export interface MCQOption {
    key: string;
    text: string;
}

export interface Question {
    id: string;
    chapter_id: string;
    question_type: QuestionType;
    question_text: string;
    options?: MCQOption[];
    correct_answer?: string;
    expected_answer?: string;
}

export interface QuestionsResponse {
    questions: Question[];
    total: number;
}

export interface AnswerResult {
    is_correct: boolean;
    score: number;
    feedback: string;
    correct_answer?: string;
}

// =============================================================================
// Chat Types
// =============================================================================

export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatResponse {
    message: string;
    timestamp: string;
}

export interface ChatHistoryResponse {
    messages: ChatMessage[];
    total: number;
}

// =============================================================================
// Material Types
// =============================================================================

export interface MaterialUploadResponse {
    success: boolean;
    message: string;
    new_nodes_count: number;
    new_edges_count: number;
    expansion_summary?: string;
}

export interface MaterialUploadPreview {
    new_topics: {
        id: string;
        title: string;
        summary: string;
        connects_to: string[];
    }[];
    new_edges: {
        source: string;
        target: string;
    }[];
    summary: string;
}

// =============================================================================
// Slide Types
// =============================================================================

export interface SlideGenerateResponse {
    slides_html: string;
    slide_count: number;
    key_concepts: string[];
    title?: string;
    concept_images?: Record<string, string>;
}

// =============================================================================
// Language Types
// =============================================================================

export interface Language {
    code: string;
    name: string;
    native_name: string;
}
