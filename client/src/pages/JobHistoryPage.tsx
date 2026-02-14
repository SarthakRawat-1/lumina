/**
 * JobHistoryPage - Dashboard for previous job searches
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Loader2,
    Calendar,
    Search,
    Clock,
    Sparkles,
    ChevronRight,
    ArrowRight,
    Briefcase
} from 'lucide-react';
import { listJobSearches } from '@/lib/jobsApi';

export default function JobHistoryPage() {
    const navigate = useNavigate();
    const [searches, setSearches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSearches();
    }, []);

    const loadSearches = async () => {
        try {
            setIsLoading(true);
            const data = await listJobSearches();
            setSearches(data);
        } catch (err) {
            console.error('Failed to load job searches:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
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
                            Job Discovery
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Professional insights to accelerate your career journey.
                        </p>
                    </div>
                </motion.div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-40">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* 1. Existing Searches */}
                        <AnimatePresence mode="popLayout">
                            {searches.map((search, index) => (
                                <motion.div
                                    key={search.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => navigate(`/jobs/${search.id}`)}
                                    className="group relative h-full min-h-[300px] bg-[#18181B] border border-white/5 rounded-2xl flex flex-col overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
                                >
                                    {/* Background Icon / Visual (Top Section) */}
                                    <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden group-hover:brightness-110 transition-all">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <Briefcase className="w-16 h-16 text-zinc-600 group-hover:text-blue-600 transition-colors duration-300" />
                                    </div>

                                    {/* Info Section (Bottom Section) */}
                                    <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                        <h3 className="text-white font-semibold text-xl mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                                            {search.title}
                                        </h3>

                                        <p className="text-sm text-zinc-500 mb-4 line-clamp-1">
                                            {search.location || 'Remote'} search query
                                        </p>

                                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 mt-auto">
                                            <div className="flex items-center gap-1.5">
                                                <Search className="w-3.5 h-3.5" />
                                                <span>{search.jobs_count} Jobs</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDate(search.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* 2. "Start New Search" Card (Always Append) */}
                        <motion.button
                            layout
                            onClick={() => navigate('/jobs/new')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative h-full min-h-[300px] bg-[#18181B] border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 text-left"
                        >
                            <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-blue">
                                    <Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">Start New Search</h3>
                                <p className="text-sm text-zinc-500">AI-powered job discovery</p>
                            </div>
                        </motion.button>

                        {/* 3. Ghost Slots (Only if empty) */}
                        {searches.length === 0 && (
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
