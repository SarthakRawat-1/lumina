import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Download, Video, CheckCircle, AlertTriangle, ArrowLeft, Calendar, Share2, Award, Lightbulb } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Evaluation {
    category: string;
    score: number;
    notes: string;
    timestamp: string;
}

interface ReportData {
    status: string;
    report: {
        overall_score: number;
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
        final_decision?: string;
    };
    recording_url: string;
    evaluations: Evaluation[];
    started_at?: string;
    ended_at?: string;
}

const InterviewReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let pollTimer: ReturnType<typeof setTimeout>;

        const fetchReport = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_FASTAPI_URL}/interview/${id}/report`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const json = await res.json();
                setData(json);

                // Poll every 5s while status is still pending
                if (json.status === 'pending') {
                    pollTimer = setTimeout(fetchReport, 5000);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();

        return () => clearTimeout(pollTimer);
    }, [id]);

    const calculateDuration = (start?: string, end?: string) => {
        if (!start || !end) return "N/A";
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffMs = endTime - startTime;

        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        return `${minutes}m ${seconds}s`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-outfit">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    <p className="text-zinc-500 animate-pulse tracking-widest text-sm uppercase">Loading Report...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">Failed to load report.</div>;

    const report = data.report || {};
    const score = report.overall_score || 0;

    // Determine grade color/text based on score
    const getGradeInfo = (s: number) => {
        if (s >= 9) return { label: 'Excellent', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' };
        if (s >= 7) return { label: 'Good', color: 'text-violet-400', border: 'border-violet-500/50', bg: 'bg-violet-500/10' };
        if (s >= 5) return { label: 'Average', color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' };
        return { label: 'Needs Improvement', color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10' };
    };

    const grade = getGradeInfo(score);

    return (
        <div className="min-h-screen bg-[#09090b] relative overflow-y-auto font-outfit text-white selection:bg-violet-500/30">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
                >
                    <div className="space-y-2">
                        <div
                            onClick={() => navigate('/interview')}
                            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors cursor-pointer w-fit"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-widest uppercase">Back to Dashboard</span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Interview Report</h1>
                        <div className="flex items-center gap-3 text-zinc-400 text-sm">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date().toLocaleDateString()}
                            </span>
                            <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${data.status === 'completed'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                }`}>
                                {data.status}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {data.recording_url && (
                            <a
                                href={data.recording_url}
                                download
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-all text-white text-sm font-medium shadow-lg shadow-violet-500/20"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </a>
                        )}
                    </div>
                </motion.div>

                {/* Score Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    {/* Overall Score Card */}
                    <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-[#121212] border border-white/10 p-8 flex items-center justify-between group">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="space-y-4 relative z-10">
                            <h2 className="text-zinc-400 font-medium uppercase tracking-widest text-sm">Overall Score</h2>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-7xl font-bold ${grade.color} drop-shadow-2xl`}>{score}</span>
                                <span className="text-3xl text-zinc-600 font-medium">/10</span>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${grade.border} ${grade.bg}`}>
                                <Award className={`w-4 h-4 ${grade.color}`} />
                                <span className={`text-sm font-bold uppercase tracking-wider ${grade.color}`}>{grade.label}</span>
                            </div>
                            <p className="text-zinc-500 text-sm max-w-sm mt-4">
                                {report.final_decision || "Analysis completed based on your responses, technical accuracy, and communication clarity."}
                            </p>
                        </div>

                        {/* Circular Progress Visual (Decorative) */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="45%" className="stroke-zinc-800 fill-none stroke-[8]" />
                                <motion.circle
                                    cx="50%" cy="50%" r="45%"
                                    className={`fill-none stroke-[8] ${grade.color === 'text-emerald-400' ? 'stroke-emerald-500' : grade.color === 'text-violet-400' ? 'stroke-violet-500' : grade.color === 'text-amber-400' ? 'stroke-amber-500' : 'stroke-red-500'}`}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: score / 10 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    style={{ pathLength: 0 }} // Required for initial state
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Stats / Quick Summary */}
                    <div className="space-y-6">
                        <div className="h-full rounded-2xl bg-[#18181B] border border-white/5 p-6 flex flex-col justify-center gap-6">
                            <div>
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Evaluations</div>
                                <div className="text-3xl font-bold text-white">{data.evaluations.length}</div>
                            </div>
                            <div>
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Duration</div>
                                <div className="text-3xl font-bold text-white">{calculateDuration(data.started_at, data.ended_at)}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* Strengths */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl bg-[#18181B] border border-white/5 overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-emerald-900/5">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-lg text-emerald-100">Key Strengths</h3>
                        </div>
                        <div className="p-6">
                            <ul className="space-y-4">
                                {report.strengths?.map((s, i) => (
                                    <li key={i} className="flex gap-4 group">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors flex-shrink-0" />
                                        <span className="text-zinc-300 leading-relaxed text-sm">{s}</span>
                                    </li>
                                ))}
                                {(!report.strengths || report.strengths.length === 0) && (
                                    <p className="text-zinc-600 italic">No specific strengths highlighted.</p>
                                )}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Weaknesses */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-2xl bg-[#18181B] border border-white/5 overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-amber-900/5">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold text-lg text-amber-100">Areas for Improvement</h3>
                        </div>
                        <div className="p-6">
                            <ul className="space-y-4">
                                {report.weaknesses?.map((w, i) => (
                                    <li key={i} className="flex gap-4 group">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500/50 group-hover:bg-amber-400 transition-colors flex-shrink-0" />
                                        <span className="text-zinc-300 leading-relaxed text-sm">{w}</span>
                                    </li>
                                ))}
                                {(!report.weaknesses || report.weaknesses.length === 0) && (
                                    <p className="text-zinc-600 italic">No major weaknesses detected.</p>
                                )}
                            </ul>
                        </div>
                    </motion.div>
                </div>

                {/* AI Recommendations - Full Width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl bg-[#18181B] border border-white/5 overflow-hidden"
                >
                    <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-violet-900/5">
                        <Lightbulb className="w-5 h-5 text-violet-500" />
                        <h3 className="font-bold text-lg text-violet-100">Actionable Recommendations</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {report.recommendations?.map((r, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/20 transition-colors">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-sm">
                                    {i + 1}
                                </span>
                                <p className="text-zinc-300 text-sm leading-relaxed">{r}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Video Recording Section */}
                {data.recording_url && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 rounded-2xl bg-[#121212] border border-white/10 overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-zinc-400" />
                                <h3 className="font-bold text-lg text-white">Session Recording</h3>
                            </div>
                        </div>
                        <div className="p-4 bg-black/50">
                            <video controls className="w-full rounded-lg bg-black aspect-video" src={data.recording_url} />
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default InterviewReport;
