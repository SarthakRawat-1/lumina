/**
 * RoadmapsListPage - Display existing roadmaps and create new ones
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Map, Clock, Layers, Loader2, ArrowRight } from 'lucide-react';
import { listRoadmaps } from '@/lib/roadmapApi';
import { useAuth } from '@/context/AuthContext';

interface RoadmapSummary {
    id: string;
    topic: string;
    title: string;
    description: string;
    language: string;
    node_count: number;
    created_at: string;
}

export default function RoadmapsListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRoadmaps() {
            try {
                setIsLoading(true);
                const data = await listRoadmaps(0, 50, user?.id);
                setRoadmaps(data as unknown as RoadmapSummary[]);
            } catch (err) {
                console.warn('Failed to load roadmaps (backend likely down), defaulting to empty state:', err);
                setError(null);
                setRoadmaps([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRoadmaps();
    }, [user?.id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[#121212] relative overflow-hidden font-outfit">
            {/* Subtle Grid Pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col min-h-screen">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div>
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Learning Roadmaps
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            AI-generated learning paths to master any skill
                        </p>
                    </div>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-40">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                    <div className="flex items-center justify-center py-40 text-red-500">
                        {error}
                    </div>
                )}

                {/* Unified Grid */}
                {!isLoading && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* 1. Existing Roadmaps */}
                        {roadmaps.map((roadmap, index) => (
                            <motion.div
                                key={roadmap.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/roadmap/${roadmap.id}`)}
                                className="group relative h-full min-h-[300px] bg-[#18181B] border border-white/5 rounded-2xl flex flex-col overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20"
                            >
                                {/* Background Icon / Visual (Top Section) */}
                                <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden group-hover:brightness-110 transition-all">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <Map className="w-16 h-16 text-zinc-600 group-hover:text-cyan-500 transition-all duration-300 scale-100" />
                                </div>

                                {/* Info Section (Bottom Section) */}
                                <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                    <h3 className="text-white font-semibold text-xl mb-4 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                                        {roadmap.title}
                                    </h3>

                                    {/* Features / Stats */}
                                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-600">
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5" />
                                            <span>{roadmap.node_count} nodes</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 border-l border-white/5 pl-4">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{formatDate(roadmap.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* 2. "Start New Roadmap" Card (Always Append) */}
                        <motion.button
                            layout
                            onClick={() => navigate('/roadmap/new')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative h-full min-h-[300px] bg-[#18181B] border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 text-left"
                        >
                            <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 group-hover:bg-cyan-500 group-hover:border-cyan-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-cyan">
                                    <Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-cyan-400 transition-colors">Start New Roadmap</h3>
                                <p className="text-sm text-zinc-500">Generate an AI learning path</p>
                            </div>
                        </motion.button>

                        {/* 3. Ghost Slots (Only if empty) */}
                        {roadmaps.length === 0 && (
                            <>
                                <div className="h-full min-h-[300px] rounded-2xl border border-white/5 bg-[#121212] opacity-30 flex flex-col overflow-hidden pointer-events-none grayscale">
                                    <div className="flex-1 w-full bg-[#18181B/50] relative">
                                        <div className="absolute inset-x-12 top-12 bottom-0 bg-[#222228] rounded-t-xl opacity-50" />
                                    </div>
                                    <div className="p-6 border-t border-white/5 bg-[#121212]">
                                        <div className="h-5 w-3/4 bg-white/10 rounded mb-3" />
                                        <div className="h-4 w-1/2 bg-white/5 rounded" />
                                    </div>
                                </div>

                                <div className="h-full min-h-[300px] rounded-2xl border border-white/5 bg-[#121212] opacity-20 flex flex-col overflow-hidden pointer-events-none grayscale hidden md:flex">
                                    <div className="flex-1 w-full bg-[#18181B/50] relative">
                                        <div className="absolute inset-x-12 top-12 bottom-0 bg-[#222228] rounded-t-xl opacity-50" />
                                    </div>
                                    <div className="p-6 border-t border-white/5 bg-[#121212]">
                                        <div className="h-5 w-2/3 bg-white/10 rounded mb-3" />
                                        <div className="h-4 w-1/3 bg-white/5 rounded" />
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
