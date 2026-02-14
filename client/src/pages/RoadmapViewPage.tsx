/**
 * RoadmapViewPage - View a specific roadmap by ID
 * 
 * Uses the new scrollable RoadmapVisualization component
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Map } from 'lucide-react';
import { RoadmapVisualization } from '@/components/roadmap/RoadmapVisualization';
import { NodeDetailsDrawer } from '@/components/roadmap/NodeDetailsDrawer';
import { RoadmapAITutor } from '@/components/roadmap/RoadmapAITutor';
import { useAuth } from '@/context/AuthContext';
import {
    getRoadmap,
    getNodeDetails,
    getUserProgress,
    updateNodeProgress,
} from '@/lib/roadmapApi';
import type {
    Roadmap,
    NodeDetails,
    UserProgress,
} from '@/lib/roadmapApi';

export default function RoadmapViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Roadmap state
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Node details drawer state
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const userId = user?.id || 'anonymous';

    // Fetch roadmap on mount
    useEffect(() => {
        async function fetchRoadmap() {
            if (!id) return;

            try {
                setIsLoading(true);
                const [roadmapData, progressData] = await Promise.all([
                    getRoadmap(id),
                    getUserProgress(id, userId).catch(() => null)
                ]);
                setRoadmap(roadmapData);
                setProgress(progressData || { roadmap_id: id, user_id: userId, status: {} });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load roadmap');
            } finally {
                setIsLoading(false);
            }
        }
        fetchRoadmap();
    }, [id, userId]);

    const handleNodeClick = useCallback(async (nodeId: string, _label: string) => {
        if (!roadmap) return;

        setSelectedNodeId(nodeId);
        setIsLoadingDetails(true);
        setNodeDetails(null);

        try {
            const details = await getNodeDetails(roadmap.id, nodeId, roadmap.language || 'en');
            setNodeDetails(details);
        } catch (err) {
            console.error('Failed to load node details:', err);
        } finally {
            setIsLoadingDetails(false);
        }
    }, [roadmap]);

    const handleStatusChange = useCallback(async (newStatus: 'in_progress' | 'completed' | 'skipped') => {
        if (!roadmap || !selectedNodeId || !progress) return;

        try {
            await updateNodeProgress(roadmap.id, userId, selectedNodeId, newStatus);
            setProgress({
                ...progress,
                status: {
                    ...progress.status,
                    [selectedNodeId]: newStatus,
                },
            });
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    }, [roadmap, selectedNodeId, progress, userId]);

    // Calculate progress percentage
    const progressPercentage = roadmap && progress ?
        Math.round((Object.values(progress.status).filter(s => s === 'completed').length / roadmap.nodes.length) * 100) : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#121212]">
                <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
        );
    }

    if (error || !roadmap) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] gap-4">
                <p className="text-red-400">{error || 'Roadmap not found'}</p>
                <button
                    onClick={() => navigate('/roadmap')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Roadmaps
                </button>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#121212] font-outfit">
            {/* Sticky Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 backdrop-blur-xl bg-[#121212]/80"
            >
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/roadmap')}
                            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium tracking-wide">BACK</span>
                        </button>

                        <div className="h-6 w-px bg-white/10" />

                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-white tracking-tight">{roadmap.title}</h1>
                            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                <span>{roadmap.nodes.length} Topics</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress with Text */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-cyan-400">{progressPercentage}%</span>
                        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                className="h-full bg-cyan-500"
                            />
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Roadmap Content - Scrollable */}
            <RoadmapVisualization
                nodes={roadmap.nodes}
                edges={roadmap.edges}
                userProgress={progress?.status || {}}
                onNodeClick={handleNodeClick}
            />

            {/* Node Details Drawer */}
            <NodeDetailsDrawer
                isOpen={!!selectedNodeId}
                nodeDetails={nodeDetails}
                isLoading={isLoadingDetails}
                currentStatus={progress?.status[selectedNodeId || ''] || 'pending'}
                onClose={() => setSelectedNodeId(null)}
                onStatusChange={handleStatusChange}
            />

            {/* AI Tutor */}
            <RoadmapAITutor
                roadmapId={roadmap.id}
                roadmapTitle={roadmap.title}
            />
        </div>
    );
}
