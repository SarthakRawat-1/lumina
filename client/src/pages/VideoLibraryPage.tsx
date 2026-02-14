/**
 * VideoLibraryPage - Library of AI-generated videos
 * 
 * Shows grid of generated videos, styled like LearnPage.
 * Click a video card to navigate to /video/:videoId.
 * "Create Video" button navigates to /video/new.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Video,
    Plus,
    Loader2,
    Clock,
    Layers,
    Sparkles,
    Armchair,
} from 'lucide-react';
import { listVideos } from '@/lib/videoApi';
import type { VideoListItem } from '@/types';

// =============================================================================
// Component
// =============================================================================

export default function VideoLibraryPage() {
    const navigate = useNavigate();

    // Video library state
    const [videos, setVideos] = useState<VideoListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load videos on mount
    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            setIsLoading(true);
            const data = await listVideos();
            setVideos(data);
        } catch (err) {
            console.error('Failed to load videos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // ==========================================================================
    // Render
    // ==========================================================================

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

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div>
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Video Studio
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Create, manage, and watch your AI-generated lessons.
                        </p>
                    </div>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-40">
                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    </div>
                )}

                {/* Unified Grid */}
                {!isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* 1. Existing Videos */}
                        <AnimatePresence mode="popLayout">
                            {videos.map((video, index) => (
                                <motion.div
                                    key={video.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => navigate(`/video/${video.video_id}`)}
                                    className="group relative bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/20"
                                >
                                    {/* Video Thumbnail Placeholder */}
                                    <div className="aspect-video bg-[#2c2c31] relative overflow-hidden group-hover:brightness-110 transition-all">
                                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Video className="w-12 h-12 text-zinc-600 group-hover:text-pink-500 transition-colors duration-300" />
                                        </div>

                                        {/* Duration Badge */}
                                        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/80 border border-white/10 text-white/90 text-xs font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-pink-400" />
                                            {formatDuration(video.duration_seconds)}
                                        </div>
                                    </div>

                                    {/* Video Info */}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="text-white font-semibold text-lg line-clamp-1 group-hover:text-pink-400 transition-colors">
                                                {video.topic}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                                            <span className="flex items-center gap-1.5">
                                                <Layers className="w-4 h-4" />
                                                {video.scene_count} scenes
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                            <span className="capitalize">{video.language}</span>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-600">
                                            <span>
                                                Created {formatDate(video.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* 2. "Start New Project" Card (Always Append) */}
                        <motion.button
                            layout
                            onClick={() => navigate('/video/new')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative h-full min-h-[300px] bg-[#18181B] border-2 border-dashed border-white/10 hover:border-pink-500/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/20 text-left"
                        >
                            <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 group-hover:bg-pink-500 group-hover:border-pink-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow">
                                    <Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-pink-400 transition-colors">Start New Project</h3>
                                <p className="text-sm text-zinc-500">Create an AI video lesson</p>
                            </div>
                        </motion.button>

                        {/* 3. Ghost Slots (Only if empty, to maintain shelf aesthetic) */}
                        {videos.length === 0 && (
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
