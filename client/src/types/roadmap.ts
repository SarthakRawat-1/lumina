/**
 * Centralized Roadmap Types
 * 
 * All roadmap-related types used across the application
 */

// =============================================================================
// Node Types
// =============================================================================

export type RoadmapNodeType = 'main' | 'topic' | 'subtopic';
export type ProgressStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface RoadmapNode {
    id: string;
    label: string;
    type: RoadmapNodeType;
    parent_id: string | null;
}

export interface RoadmapEdge {
    source: string;
    target: string;
}

// =============================================================================
// Roadmap Types
// =============================================================================

export interface Roadmap {
    id: string;
    topic: string;
    title: string;
    description: string;
    nodes: RoadmapNode[];
    edges: RoadmapEdge[];
    language: string;
    created_at: string;
}

export interface GenerateRoadmapRequest {
    topic: string;
    goal?: string;
    skill_level?: 'beginner' | 'intermediate' | 'advanced';
    language?: string;
    user_id?: string;
}

// =============================================================================
// Node Details Types
// =============================================================================

export interface RoadmapResource {
    title: string;
    url: string;
    type: string;
}

export interface NodeDetails {
    id: string;
    title: string;
    description: string;
    key_concepts: string[];
    resources: RoadmapResource[];
    estimated_time: string;
}

// =============================================================================
// Progress Types
// =============================================================================

export interface UserProgress {
    roadmap_id: string;
    user_id: string;
    status: Record<string, ProgressStatus>;
}
