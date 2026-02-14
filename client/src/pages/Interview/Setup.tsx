import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader2, ArrowLeft, ArrowRight, Briefcase, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const INDUSTRIES = [
    "Technology & Software",
    "Finance & Banking",
    "Professional Services & Consulting",
    "Sales & Marketing",
    "Legal"
];

export default function InterviewSetup() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Mode: 'resume' or 'manual'
    const [mode, setMode] = useState<'resume' | 'manual'>('resume');

    // State
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dropdown state
    const [industryOpen, setIndustryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        industry: "",
        role: "",
        resumeText: ""
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIndustryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Please upload a PDF file');
            return;
        }

        setPdfLoading(true);
        setSelectedFile(file);
        setError(null);

        try {
            const uploadData = new FormData();
            uploadData.append('file', file);

            const response = await fetch(`${import.meta.env.VITE_FASTAPI_URL}/interview/upload-resume`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: uploadData
            });

            const result = await response.json();

            if (result.success && result.extracted_text) {
                setFormData(prev => ({ ...prev, resumeText: result.extracted_text }));
            } else {
                setError(result.message || 'Failed to parse resume');
                setSelectedFile(null);
            }
        } catch (err) {
            console.error("Failed to upload resume:", err);
            setError('Failed to upload resume');
            setSelectedFile(null);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleStart = async () => {
        if (!formData.industry || !formData.role) {
            setError("Target Role and Industry are required. Please enter them.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_FASTAPI_URL}/interview/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    industry: formData.industry,
                    role: formData.role,
                    resume_text: formData.resumeText
                })
            });

            const data = await response.json();
            if (data.token) {
                navigate('/interview/room', {
                    state: {
                        token: data.token,
                        wsUrl: data.ws_url,
                        interviewId: data.interview_id
                    }
                });
            }
        } catch (err) {
            console.error("Failed to start interview:", err);
            setError("Failed to initialize interview session.");
        } finally {
            setLoading(false);
        }
    };

    const canStart = (mode === 'resume' ? !!formData.resumeText : (!!formData.resumeText && !!formData.role && !!formData.industry));

    return (
        <div className="min-h-screen bg-[#09090b] relative overflow-hidden font-outfit text-white selection:bg-violet-500/30">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <div className="relative z-10 w-full min-h-screen flex flex-col p-8 md:p-12">
                {/* Header - Left Aligned */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col items-start gap-2 mb-12"
                >
                    <div className="flex items-center gap-2 mb-2 text-zinc-400 hover-glow-white cursor-pointer transition-colors w-fit" onClick={() => navigate('/interview')}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium tracking-wide">BACK TO DASHBOARD</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                        MASTER YOUR INTERVIEW SKILLS
                    </h1>
                    <p className="text-zinc-500 text-sm ml-1 uppercase tracking-widest font-medium">
                        Configure Session Parameters
                    </p>
                </motion.div>

                {/* Main Content - Single Left Column */}
                <div className="w-full max-w-lg flex flex-col gap-8">

                    {/* 1. Mode Selection */}
                    <div className="group">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">INPUT SOURCE</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMode('resume')}
                                className={`relative group bg-[#18181B] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${mode === 'resume'
                                    ? 'border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                                    : 'border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <Upload className={`w-6 h-6 ${mode === 'resume' ? 'text-violet-500' : 'text-zinc-500'}`} />
                                <div className="text-center">
                                    <div className={`font-semibold text-sm ${mode === 'resume' ? 'text-white' : 'text-zinc-400'}`}>RESUME UPLOAD</div>
                                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5 uppercase">AUTO-CONTEXT</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('manual')}
                                className={`relative group bg-[#18181B] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${mode === 'manual'
                                    ? 'border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                                    : 'border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <Briefcase className={`w-6 h-6 ${mode === 'manual' ? 'text-violet-500' : 'text-zinc-500'}`} />
                                <div className="text-center">
                                    <div className={`font-semibold text-sm ${mode === 'manual' ? 'text-white' : 'text-zinc-400'}`}>MANUAL ENTRY</div>
                                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5 uppercase">CUSTOM TARGET</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {mode === 'resume' && (
                            <motion.div
                                key="resume"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                {/* Resume Dropzone */}
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">DOCUMENT</label>
                                    <label className="block w-full group cursor-pointer">
                                        <div className={`relative flex flex-col items-center justify-center h-48 bg-[#18181B] border-2 border-dashed rounded-xl transition-all duration-300 ${selectedFile
                                            ? 'border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)] bg-violet-900/5'
                                            : 'border-white/10 hover:border-violet-500/30 hover:bg-white/5'
                                            }`}>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />

                                            {pdfLoading ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                                                    <span className="text-zinc-400 text-sm font-mono tracking-wide">PARSING DATA...</span>
                                                </div>
                                            ) : selectedFile ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-violet-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-medium text-white text-lg">{selectedFile.name}</p>
                                                        <p className="text-xs text-violet-400 mt-1 flex items-center gap-1 justify-center font-mono">
                                                            <Check className="w-3 h-3" />
                                                            CONTEXT EXTRACTED
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                                        <Upload className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-medium text-sm">UPLOAD RESUME (PDF)</p>
                                                        <p className="text-xs text-zinc-600 font-mono mt-1">CLICK OR DRAG</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </motion.div>
                        )}

                        {/* Always show Role/Industry Inputs for now since backend needs them */}
                        <motion.div
                            key="fields"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Custom Industry Dropdown */}
                            <div className="z-50 relative" ref={dropdownRef}>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">TARGET INDUSTRY</label>

                                <div className={`rounded-xl overflow-hidden transition-all duration-300 border ${industryOpen
                                    ? "bg-[#18181B] border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                                    : "bg-[#18181B] border-white/5 hover:border-white/10 hover:bg-white/5"
                                    }`}>
                                    <button
                                        onClick={() => setIndustryOpen(!industryOpen)}
                                        className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors"
                                    >
                                        <span className={`text-xl font-medium ${formData.industry ? 'text-white' : 'text-zinc-600'}`}>
                                            {formData.industry || "Select Industry..."}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${industryOpen ? 'rotate-180 text-violet-400' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {industryOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden border-t border-white/5"
                                            >
                                                <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {INDUSTRIES.map(ind => (
                                                        <button
                                                            key={ind}
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, industry: ind }));
                                                                setIndustryOpen(false);
                                                            }}
                                                            className={`w-full relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left group overflow-hidden ${formData.industry === ind
                                                                ? "text-white bg-white/[0.05]"
                                                                : "text-zinc-400 hover:text-white"
                                                                }`}
                                                        >
                                                            {/* Active/Hover Gradient Indicator - Adapted from Roadmap Page */}
                                                            <div className={`absolute left-0 top-1 bottom-1 w-[2px] bg-violet-500/40 rounded-r-full transition-opacity duration-200 ${formData.industry === ind ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                                }`} />

                                                            {/* Gradient background on hover */}
                                                            <div className={`absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent transition-opacity duration-200 pointer-events-none ${formData.industry === ind ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                                }`} />

                                                            <span className="relative z-10 text-base font-medium">{ind}</span>
                                                            {formData.industry === ind && (
                                                                <Check className="absolute right-4 w-4 h-4 text-violet-400 relative z-10" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Target Role */}
                            <div className="group">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">TARGET ROLE</label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                    placeholder="e.g. Senior Product Manager"
                                    className="w-full bg-[#18181B] border-2 border-white/5 rounded-xl px-6 py-4 text-xl font-medium text-white placeholder:text-zinc-700 outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all"
                                />
                            </div>

                            {/* Manual Resume Text Entry (Only in Manual Mode) */}
                            {mode === 'manual' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="group"
                                >
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">EXPERIENCE / RESUME TEXT</label>
                                    <textarea
                                        value={formData.resumeText}
                                        onChange={(e) => setFormData(prev => ({ ...prev, resumeText: e.target.value }))}
                                        placeholder="Paste your resume summary or describe your experience here..."
                                        className="w-full min-h-[150px] bg-[#18181B] border-2 border-white/5 rounded-xl px-6 py-4 text-base text-white placeholder:text-zinc-700 outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all resize-y custom-scrollbar"
                                    />
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Action Button */}
                    <div className="pt-6">
                        <button
                            onClick={handleStart}
                            disabled={loading || !canStart}
                            className="relative w-full rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 bg-[length:100%_auto] border border-violet-600 text-white font-bold text-xl tracking-widest py-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_25px_rgba(139,92,246,0.5),0_0_10px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-200"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        <span>INITIALIZING...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                        <span>INITIATE SESSION</span>
                                        <ArrowRight className="w-5 h-5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 p-3 rounded-xl font-mono"
                        >
                            {'>'} ERROR: {error}
                        </motion.p>
                    )}

                </div>
            </div>
        </div>
    );
}
