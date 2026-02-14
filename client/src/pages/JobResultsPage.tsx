/**
 * JobResultsPage - Displays job search results
 * 
 * Styled with "Director's Console" aesthetic (Blue/Dark Theme)
 * matching the LearnVideoPage design structure.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    MapPin,
    Building2,
    Clock,
    ArrowLeft,
    ExternalLink,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Send,
    ArrowRight
} from 'lucide-react';
import { getJobSearchResults, refineSearch, enrichJob, type JobResultsResponse, type ScoredJobResponse, type JobEnrichmentResponse } from '@/lib/jobsApi';
import { cacheEnrichment } from '@/store/slices/jobEnrichmentsSlice';
import type { RootState } from '@/store/store';
import { useSidebar } from '@/context/SidebarContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

function JobChat({ searchId }: { searchId: string }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi! I've analyzed these jobs. Ask me anything about them, like 'Which ones are remote?' or 'Any startups?'" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await refineSearch(searchId, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: response.response_message }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-h-[900px] bg-[#18181B] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />

            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 bg-black/20 z-10 flex items-center gap-3">
                <div>
                    <h3 className="text-sm font-bold text-white">AI Assistant</h3>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Relayed Connection</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium rounded-tr-sm shadow-md'
                            : 'bg-[#222228] border border-white/5 text-zinc-200 rounded-tl-sm shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl bg-[#222228] rounded-tl-none border border-white/5">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/20 border-t border-white/5 backdrop-blur-md">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask AI..."
                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-[#09090b] border border-white/5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all shadow-inner font-mono"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-30 disabled:shadow-none transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function JobResultsPage() {
    const { searchId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cachedEnrichments = useSelector((state: RootState) => state.jobEnrichments.byJobId);
    const { collapsed } = useSidebar();

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<JobResultsResponse | null>(null);
    const [selectedJob, setSelectedJob] = useState<ScoredJobResponse | null>(null);
    const [enrichmentLoading, setEnrichmentLoading] = useState(false);
    const [enrichedData, setEnrichedData] = useState<JobEnrichmentResponse | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const handleSelectJob = async (job: ScoredJobResponse) => {
        setSelectedJob(job);

        // Check Redux cache first
        const cached = cachedEnrichments[job.job_id];
        if (cached) {
            setEnrichedData(cached);
            return;
        }

        setEnrichmentLoading(true);
        setEnrichedData(null);
        try {
            const enriched = await enrichJob(job.job_id);
            setEnrichedData(enriched);

            // Cache to Redux for persistence
            dispatch(cacheEnrichment({ jobId: job.job_id, data: enriched }));
        } catch (err) {
            console.error("Failed to enrich job", err);
        } finally {
            setEnrichmentLoading(false);
        }
    };

    const loadResults = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const result = await getJobSearchResults(id, 0, 20); // Initial Page
            setData(result);
            setPage(0);
            setHasMore(result.jobs.length < result.total_jobs);
        } catch (err) {
            setError('Failed to load job results');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchId) {
            loadResults(searchId);
        }
    }, [searchId, loadResults]);

    const loadMore = useCallback(async () => {
        if (!searchId) return;

        try {
            setLoadingMore(true);
            const limit = 20;
            const skip = (page + 1) * limit;

            const result = await getJobSearchResults(searchId, skip, limit);

            if (result.jobs.length > 0) {
                setData(prev => {
                    const next = prev ? {
                        ...prev,
                        jobs: [...prev.jobs, ...result.jobs]
                    } : result;

                    setHasMore(next.jobs.length < result.total_jobs);
                    return next;
                });
                setPage(prev => prev + 1);

                // If we got fewer items than limit, or total matches, we are done
                if (result.jobs.length < limit) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to load more jobs", err);
        } finally {
            setLoadingMore(false);
        }
    }, [page, searchId]);

    // Infinite Scroll Listener (attach to the scrolling container, not window)
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const handleScroll = () => {
            const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (remaining <= 500 && !loadingMore && hasMore && !loading) {
                loadMore();
            }
        };

        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, [loadingMore, hasMore, loading, loadMore]);

    // Calculate displayed jobs by merging data with cache
    const displayedJobs = data?.jobs.map(job => {
        const cached = cachedEnrichments[job.job_id];
        if (cached) {
            return {
                ...job,
                matching_skills: cached.matching_skills,
                missing_skills: cached.missing_skills,
                match_explanation: cached.match_explanation
            };
        }
        return job;
    }) || [];

    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return 'Salary not specified';
        if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
        if (min) return `From $${(min / 1000).toFixed(0)}k`;
        return `Up to $${(max! / 1000).toFixed(0)}k`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <div className="font-mono text-zinc-500 text-sm tracking-widest">CONNECTING...</div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-outfit">
                <div className="text-center max-w-md p-8 border border-red-500/20 bg-red-500/5 rounded-2xl">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl text-white font-bold mb-2">CRITICAL ERROR</h2>
                    <p className="text-zinc-400 mb-6 font-mono text-sm">{error || "Data retrieval failed."}</p>
                    <button
                        onClick={() => navigate('/jobs')}
                        className="px-6 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                    >
                        Abort
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] relative font-outfit text-white selection:bg-blue-500/30">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500 hover:text-white cursor-pointer transition-colors w-fit" onClick={() => navigate('/jobs')}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-widest uppercase">Back</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)]">
                    {/* Job List Column (8 cols) */}
                    <div ref={listRef} className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                        {data.jobs.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-zinc-500 font-mono text-sm">NO MATCHING TARGETS FOUND.</p>
                            </div>
                        ) : (
                            displayedJobs.map((job, index) => (
                                <motion.div
                                    key={job.job_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleSelectJob(job)}
                                    className="group relative rounded-xl bg-[#18181B] border border-white/5 hover:border-blue-500/50 p-6 flex flex-col md:flex-row gap-6 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] shrink-0"
                                >
                                    {/* Left Border Accent */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Content */}
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                {job.title}
                                            </h3>
                                            <div className="text-zinc-400 text-sm flex items-center gap-2 mt-1">
                                                <Building2 className="w-4 h-4 text-zinc-500" />
                                                {job.company}
                                                <span className="text-zinc-700 mx-1">|</span>
                                                <MapPin className="w-4 h-4 text-zinc-500" />
                                                {job.location} ({job.location_type})
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {job.matching_skills.slice(0, 3).map((skill, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-mono tracking-wide uppercase">
                                                    {skill}
                                                </span>
                                            ))}
                                            {job.missing_skills.length > 0 && (
                                                <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono tracking-wide uppercase flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {job.missing_skills.length} MISSING
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side Stats */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 min-w-[120px]">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white font-mono group-hover:text-blue-400 transition-colors">
                                                {(job.match_score * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Match Scoore</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-zinc-300 font-medium">
                                                {formatSalary(job.salary_min, job.salary_max)}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Est. Salary</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}

                        {/* Loading More Indicator */}
                        {loadingMore && (
                            <div className="py-6 flex justify-center">
                                <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    FETCHING MORE RECORDS...
                                </div>
                            </div>
                        )}

                        {!hasMore && data.jobs.length > 0 && (
                            <div className="py-8 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest border-t border-white/5 mt-8">
                                End of Report
                            </div>
                        )}
                    </div>

                    {/* Chat Side Panel (4 cols) - Fixed Height */}
                    <div className="lg:col-span-4 sticky top-4 self-start">
                        <JobChat searchId={searchId || ''} />
                    </div>
                </div>
            </div>

            {/* Job Details Modal - Full Screen Overlay Style */}
            <AnimatePresence>
                {selectedJob && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        style={{ left: collapsed ? 72 : 260 }}
                        onClick={() => setSelectedJob(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-4xl max-h-[90vh] bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
                        >
                            {/* Modal Header */}
                            <div className="bg-[#18181B] border-b border-white/5 p-8 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                            Top Match
                                        </div>
                                        <span className="font-mono text-zinc-500 text-xs">ID: {selectedJob.job_id.slice(0, 8)}</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedJob.title}</h2>
                                    <div className="flex items-center gap-4 text-zinc-400">
                                        <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {selectedJob.company}</span>
                                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selectedJob.location}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-4">
                                    <button
                                        onClick={() => setSelectedJob(null)}
                                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <a
                                        href={selectedJob.apply_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Apply for Role <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-[#0c0c0e]">
                                {/* AI Insight */}
                                <div className="p-6 rounded-xl bg-blue-900/10 border border-blue-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none" />
                                    <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2 font-mono text-sm tracking-widest uppercase">
                                        <Sparkles className="w-4 h-4" /> AI Analysis
                                    </h3>
                                    <p className="text-blue-100/80 leading-relaxed text-sm">
                                        {enrichedData ? enrichedData.match_explanation : (
                                            <span className="flex items-center gap-2 animate-pulse">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Generating personalized analysis...
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Skills Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-zinc-500 font-bold font-mono text-xs uppercase tracking-widest mb-4">You Have</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {enrichedData ? enrichedData.matching_skills.map((skill, i) => (
                                                <span key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#18181B] border border-green-500/20 text-green-400 text-sm font-medium">
                                                    <CheckCircle2 className="w-4 h-4" /> {skill}
                                                </span>
                                            )) : (
                                                <span className="text-zinc-500 text-sm italic">Analyze to see matches...</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-zinc-500 font-bold font-mono text-xs uppercase tracking-widest mb-4">Missing / To Learn</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {enrichedData ? enrichedData.missing_skills.map((skill, i) => (
                                                <span key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#18181B] border border-red-500/20 text-red-400 text-sm font-medium opacity-80">
                                                    <AlertCircle className="w-4 h-4" /> {skill}
                                                </span>
                                            )) : (
                                                <span className="text-zinc-500 text-sm italic">Analyze to see gaps...</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-4">Job Description</h3>

                                    {enrichmentLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                                            <p className="font-mono text-zinc-400 text-xs tracking-widest uppercase">Analyzing & Enriching Content...</p>
                                        </div>
                                    ) : enrichedData ? (
                                        <div className="space-y-8">
                                            {/* Summary */}
                                            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-6 rounded-xl border border-blue-500/10">
                                                <h4 className="text-blue-400 font-bold font-mono text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3" /> Executive Summary
                                                </h4>
                                                <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
                                                    {enrichedData.summary}
                                                </p>
                                            </div>

                                            {/* Key Requirements */}
                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div>
                                                    <h4 className="text-zinc-400 font-bold font-mono text-xs uppercase tracking-widest mb-4">Core Requirements</h4>
                                                    <ul className="space-y-3">
                                                        {enrichedData.key_requirements.map((req, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                                                                <div className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                                                {req}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 className="text-zinc-400 font-bold font-mono text-xs uppercase tracking-widest mb-4">Nice to Haves</h4>
                                                    <ul className="space-y-3">
                                                        {enrichedData.nice_to_haves.map((req, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
                                                                <div className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                                                                {req}
                                                            </li>
                                                        ))}
                                                        {enrichedData.nice_to_haves.length === 0 && (
                                                            <li className="text-zinc-600 italic text-sm">None specified</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Benefits */}
                                            {enrichedData.benefits.length > 0 && (
                                                <div>
                                                    <h4 className="text-zinc-400 font-bold font-mono text-xs uppercase tracking-widest mb-4">Benefits & Perks</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {enrichedData.benefits.map((benefit, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs">
                                                                {benefit}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Toggle for Raw Description */}
                                            <details className="group">
                                                <summary className="flex items-center gap-2 text-xs font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors uppercase tracking-widest mt-8 mb-4">
                                                    <ArrowRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                                                    View Original Raw Description
                                                </summary>
                                                <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-white max-w-none text-sm p-4 bg-black/20 rounded-xl border border-white/5">
                                                    <p className="whitespace-pre-wrap">{selectedJob.description}</p>
                                                </div>
                                            </details>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-white max-w-none">
                                            <p className="whitespace-pre-wrap">{selectedJob.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
