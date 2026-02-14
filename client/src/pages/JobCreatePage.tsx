/**
 * JobCreatePage - Premium Job Search Entry
 * 
 * Styled with the "Director's Console" aesthetic (Blue Theme).
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Sparkles, Loader2, ArrowLeft, ArrowRight, Plus, X, Check, Briefcase, MapPin, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseResume, searchJobs, type ResumeProfile, type ManualJobInput } from '@/lib/jobsApi';

export default function JobCreatePage() {
    const navigate = useNavigate();

    // Mode: 'resume' or 'manual'
    const [mode, setMode] = useState<'resume' | 'manual'>('resume');

    // Resume upload state
    const [file, setFile] = useState<File | null>(null);
    const [parsedProfile, setParsedProfile] = useState<ResumeProfile | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    // Manual input state
    const [targetRole, setTargetRole] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [experienceYears, setExperienceYears] = useState(0);
    const [industries, setIndustries] = useState<string[]>([]); // Preserved but unused in UI currently to keep logic simple

    // Preferences (shared)
    const [location, setLocation] = useState('');
    const [remoteOnly, setRemoteOnly] = useState(false);

    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle file upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
            setError('Please upload a PDF file');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setIsParsing(true);

        try {
            const result = await parseResume(selectedFile);
            if (result.success && result.profile) {
                setParsedProfile(result.profile);
            } else {
                setError(result.message || 'Failed to parse resume');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse resume');
        } finally {
            setIsParsing(false);
        }
    };

    // Add skill
    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    // Handle search
    const handleSearch = async () => {
        setError(null);
        setIsSearching(true);

        try {
            let response: any;

            if (mode === 'resume' && parsedProfile) {
                response = await searchJobs({
                    profile: parsedProfile,
                    location: location || undefined,
                    remote_only: remoteOnly,
                });
            } else if (mode === 'manual') {
                if (!targetRole.trim()) throw new Error('Please enter a target role');

                const manualInput: ManualJobInput = {
                    target_role: targetRole.trim(),
                    skills,
                    experience_years: experienceYears,
                    preferred_industries: industries,
                    location: location || undefined,
                    remote_only: remoteOnly,
                };

                response = await searchJobs({
                    manual_input: manualInput,
                    location: location || undefined,
                    remote_only: remoteOnly,
                });
            } else {
                throw new Error('Please upload a resume or switch to manual input');
            }

            if (response && response.search_id) {
                navigate(`/jobs/${response.search_id}`);
            } else {
                throw new Error('Invalid response from server');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const canSearch = mode === 'resume' ? !!parsedProfile : !!targetRole.trim();

    return (
        <div className="min-h-screen bg-[#09090b] relative overflow-hidden font-outfit text-white selection:bg-blue-500/30">
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
                    <div className="flex items-center gap-2 mb-2 text-zinc-400 hover-glow-white cursor-pointer transition-colors w-fit" onClick={() => navigate('/jobs')}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium tracking-wide">BACK TO JOB SEARCH</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                        DETECT CAREER OPPORTUNITIES
                    </h1>
                    <p className="text-zinc-500 text-sm ml-1 uppercase tracking-widest font-medium">
                        Configure Search Parameters
                    </p>
                </motion.div>

                {/* Main Content Area - Single Left Column */}
                <div className="w-full max-w-lg flex flex-col gap-8">

                    {/* 1. Mode Selection */}
                    <div className="group">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">INPUT SOURCE</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMode('resume')}
                                className={`relative group bg-[#18181B] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${mode === 'resume'
                                    ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                                    : 'border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <Upload className={`w-6 h-6 ${mode === 'resume' ? 'text-blue-500' : 'text-zinc-500'}`} />
                                <div className="text-center">
                                    <div className={`font-semibold text-sm ${mode === 'resume' ? 'text-white' : 'text-zinc-400'}`}>RESUME UPLOAD</div>
                                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5 uppercase">AUTO-ANALYSIS</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('manual')}
                                className={`relative group bg-[#18181B] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${mode === 'manual'
                                    ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                                    : 'border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <Briefcase className={`w-6 h-6 ${mode === 'manual' ? 'text-blue-500' : 'text-zinc-500'}`} />
                                <div className="text-center">
                                    <div className={`font-semibold text-sm ${mode === 'manual' ? 'text-white' : 'text-zinc-400'}`}>MANUAL ENTRY</div>
                                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5 uppercase">CUSTOM TARGET</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {mode === 'resume' ? (
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
                                        <div className={`relative flex flex-col items-center justify-center h-48 bg-[#18181B] border-2 border-dashed rounded-xl transition-all duration-300 ${file
                                            ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-blue-900/5'
                                            : 'border-white/10 hover:border-blue-500/30 hover:bg-white/5'
                                            }`}>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />

                                            {isParsing ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                                    <span className="text-zinc-400 text-sm font-mono tracking-wide">ANALYZING DATA...</span>
                                                </div>
                                            ) : file ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-medium text-white text-lg">{file.name}</p>
                                                        <p className="text-xs text-blue-400 mt-1 flex items-center gap-1 justify-center font-mono">
                                                            <Check className="w-3 h-3" />
                                                            {parsedProfile?.skills.length || 0} TRAITS FLAGGED
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                                        <Upload className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-medium text-sm">UPLOAD PDF</p>
                                                        <p className="text-xs text-zinc-600 font-mono mt-1">CLICK OR DRAG</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {/* Skills Preview */}
                                {parsedProfile && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">DETECTED PROFILE</label>
                                        <div className="bg-[#18181B] border-2 border-white/5 rounded-xl p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {parsedProfile.skills.slice(0, 8).map((skill, i) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {parsedProfile.skills.length > 8 && (
                                                    <span className="px-3 py-1.5 rounded-lg bg-white/5 text-zinc-500 text-xs font-mono">
                                                        +{parsedProfile.skills.length - 8} MORE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="manual"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                {/* Target Role */}
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">TARGET DESIGNATION</label>
                                    <input
                                        type="text"
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        placeholder="e.g. Senior Frontend Engineer"
                                        className="w-full bg-[#18181B] border-2 border-white/5 rounded-xl px-6 py-4 text-xl font-medium text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                        autoFocus
                                    />
                                </div>

                                {/* Skills Input */}
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">CORE COMPETENCIES</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                            placeholder="Add skill..."
                                            className="w-full bg-[#18181B] border-2 border-white/5 rounded-xl px-6 py-4 text-lg text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                        />
                                        <button
                                            onClick={handleAddSkill}
                                            className="px-6 rounded-xl bg-white/5 hover:bg-white/10 border-2 border-white/5 text-white transition-all hover:border-white/20"
                                        >
                                            <Plus className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {skills.map((skill, i) => (
                                                <span key={i} className="flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium shadow-sm transition-all hover:bg-blue-500/20 hover:border-blue-500/30 group">
                                                    {skill}
                                                    <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="hover:text-white p-1 opacity-60 group-hover:opacity-100 transition-opacity ml-1" >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Experience Input */}
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">EXPERIENCE LEVEL (YEARS)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={experienceYears}
                                        onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                                        className="w-full bg-[#18181B] border-2 border-white/5 rounded-xl px-6 py-4 text-xl font-medium text-white outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Shared Preferences */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Location */}
                        <div className="group">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">LOCATION TARGET</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Anywhere / Global"
                                    className="w-full bg-[#18181B] border-2 border-white/5 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                />
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>

                        {/* Remote Toggle */}
                        <div className="group">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">WORK MODE</label>
                            <button
                                onClick={() => setRemoteOnly(!remoteOnly)}
                                className={`w-full bg-[#18181B] border-2 rounded-xl px-4 py-3 flex items-center justify-between transition-all ${remoteOnly ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Monitor className={`w-4 h-4 ${remoteOnly ? 'text-blue-500' : 'text-zinc-500'}`} />
                                    <span className={`font-medium ${remoteOnly ? 'text-white' : 'text-zinc-400'}`}>Remote Only</span>
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${remoteOnly ? 'bg-blue-600' : 'bg-white/10'}`}>
                                    <motion.div
                                        animate={{ x: remoteOnly ? 20 : 4 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                                    />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                        <button
                            onClick={handleSearch}
                            disabled={!canSearch || isSearching}
                            className="relative w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-[length:100%_auto] border border-blue-600 text-white font-bold text-xl tracking-widest py-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_25px_rgba(59,130,246,0.5),0_0_10px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-200"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {isSearching ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        <span>SCANNING...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                        <span>INITIATE SEARCH</span>
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
            </div >
        </div >
    );
}
