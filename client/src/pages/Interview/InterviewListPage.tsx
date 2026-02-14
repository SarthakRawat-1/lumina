import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    Plus,
    Loader2,
    Calendar,
    Search,
    Clock,
    Sparkles,
    ChevronRight,
    ArrowRight,
    Briefcase,
    Mic,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

interface Interview {
    id: string;
    industry: string;
    role: string;
    status: string;
    started_at: string;
    overall_score?: number;
}

export default function InterviewListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadInterviews();
        }
    }, [user?.id]);

    const loadInterviews = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${import.meta.env.VITE_FASTAPI_URL}/interview/list?user_id=${user?.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setInterviews(data);
        } catch (err) {
            console.error('Failed to load interviews:', err);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
        }
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
                            Interview Dashboard
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Track your progress and master your interview skills.
                        </p>
                    </div>
                </motion.div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-40">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* 1. Existing Interviews */}
                        <AnimatePresence mode="popLayout">
                            {interviews.map((interview, index) => (
                                <motion.div
                                    key={interview.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => navigate(interview.status === 'completed' ? `/interview/report/${interview.id}` : '/interview/new')}
                                    className="group relative h-full min-h-[280px] bg-[#18181B] border border-white/5 rounded-2xl flex flex-col overflow-hidden cursor-pointer hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/20"
                                >
                                    {/* Background Icon / Visual (Top Section) */}
                                    <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden group-hover:brightness-110 transition-all">
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="flex flex-col items-center gap-4">
                                            <Mic className="w-12 h-12 text-zinc-600 group-hover:text-violet-400 transition-colors duration-300 transform group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
                                        </div>
                                    </div>

                                    {/* Info Section (Bottom Section) */}
                                    <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="text-white font-semibold text-lg line-clamp-1 group-hover:text-violet-400 transition-colors">
                                                {interview.role}
                                            </h3>
                                        </div>

                                        <p className="text-sm text-zinc-500 mb-4 line-clamp-1">
                                            {interview.industry}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(interview.status)}`}>
                                                {interview.status}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDate(interview.started_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* 2. "Start New Interview" Card (Always Append) */}
                        <motion.button
                            layout
                            onClick={() => navigate('/interview/new')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative h-full min-h-[280px] bg-[#18181B] border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/20 text-left"
                        >
                            <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 group-hover:bg-violet-600 group-hover:border-violet-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-violet">
                                    <Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-violet-400 transition-colors">New Interview</h3>
                                <p className="text-sm text-zinc-500">Practice a new scenario</p>
                            </div>
                        </motion.button>

                    </motion.div>
                )}
            </div>
        </div>
    );
}
