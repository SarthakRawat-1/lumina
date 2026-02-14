/**
 * JobsPage - AI-powered job discovery entry point
 * 
 * Allows users to either upload a resume or manually enter their profile
 * to find relevant job opportunities.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Upload, FileText, Sparkles, Loader2, Plus, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseResume, searchJobs, type ResumeProfile, type ManualJobInput, type JobSearchResponse } from '@/lib/jobsApi';


export default function JobsPage() {
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
    const [industries, setIndustries] = useState<string[]>([]);
    const [newIndustry, setNewIndustry] = useState('');

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

    // Add industry
    const handleAddIndustry = () => {
        if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
            setIndustries([...industries, newIndustry.trim()]);
            setNewIndustry('');
        }
    };

    // Handle search
    const handleSearch = async () => {
        setError(null);
        setIsSearching(true);

        try {
            let response: JobSearchResponse;

            if (mode === 'resume' && parsedProfile) {
                response = await searchJobs({
                    profile: parsedProfile,
                    location: location || undefined,
                    remote_only: remoteOnly,
                });
            } else if (mode === 'manual') {
                if (!targetRole.trim()) {
                    throw new Error('Please enter a target role');
                }

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

            if (!response?.search_id) {
                throw new Error('Invalid response from server');
            }

            navigate(`/jobs/${response.search_id}`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const canSearch = mode === 'resume' ? !!parsedProfile : !!targetRole.trim();

    return (
        <div className="relative min-h-screen bg-background overflow-hidden">
            {/* Gradient background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Briefcase className="w-8 h-8 text-emerald-400" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            AI Job Discovery
                        </h1>
                    </div>
                    <p className="text-white/60 max-w-lg mx-auto">
                        Find your perfect job match. Upload your resume or tell us about yourself.
                    </p>
                </motion.div>

                {/* Mode Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-xl mx-auto mb-6"
                >
                    <div className="flex gap-2 p-1 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                        <button
                            onClick={() => setMode('resume')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${mode === 'resume'
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                                : 'text-white/60 hover:bg-white/10'
                                }`}
                        >
                            <Upload className="w-4 h-4" />
                            Upload Resume
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${mode === 'manual'
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                                : 'text-white/60 hover:bg-white/10'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Manual Entry
                        </button>
                    </div>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-xl mx-auto"
                >
                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-6">

                        {/* Resume Upload Mode */}
                        {mode === 'resume' && (
                            <div className="space-y-4">
                                {/* File Upload */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Resume (PDF)</label>
                                    <label className="block">
                                        <div className={`relative px-6 py-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${file
                                            ? 'border-emerald-500/50 bg-emerald-500/10'
                                            : 'border-white/20 hover:border-white/40'
                                            }`}>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            {isParsing ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                                                    <span className="text-white/60">Parsing resume...</span>
                                                </div>
                                            ) : file ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileText className="w-8 h-8 text-emerald-400" />
                                                    <span className="text-white">{file.name}</span>
                                                    <span className="text-sm text-emerald-400">
                                                        ✓ {parsedProfile?.skills.length || 0} skills extracted
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Upload className="w-8 h-8 text-white/40" />
                                                    <span className="text-white/60">
                                                        Click to upload or drag and drop
                                                    </span>
                                                    <span className="text-sm text-white/40">PDF files only</span>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {/* Parsed Skills Preview */}
                                {parsedProfile && (
                                    <div className="space-y-2">
                                        <label className="text-sm text-white/60">Extracted Skills</label>
                                        <div className="flex flex-wrap gap-2">
                                            {parsedProfile.skills.slice(0, 10).map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {parsedProfile.skills.length > 10 && (
                                                <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-sm">
                                                    +{parsedProfile.skills.length - 10} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Manual Entry Mode */}
                        {mode === 'manual' && (
                            <div className="space-y-4">
                                {/* Target Role */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Target Role *</label>
                                    <input
                                        type="text"
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        placeholder="e.g., Software Engineer, Product Manager"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>

                                {/* Skills */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Skills</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                            placeholder="Add a skill..."
                                            className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                        <button
                                            onClick={handleAddSkill}
                                            className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {skills.map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm"
                                                >
                                                    {skill}
                                                    <button
                                                        onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                                                        className="hover:text-white"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Experience */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Years of Experience</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={experienceYears}
                                        onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>

                                {/* Industries */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Preferred Industries</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newIndustry}
                                            onChange={(e) => setNewIndustry(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddIndustry()}
                                            placeholder="e.g., Tech, Healthcare, Finance"
                                            className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                        <button
                                            onClick={handleAddIndustry}
                                            className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {industries.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {industries.map((ind, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm"
                                                >
                                                    {ind}
                                                    <button
                                                        onClick={() => setIndustries(industries.filter((_, j) => j !== i))}
                                                        className="hover:text-white"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Preferences (Shared) */}
                        <div className="pt-4 border-t border-white/10 space-y-4">
                            <h3 className="text-sm font-medium text-white/80">Job Preferences</h3>

                            {/* Location */}
                            <div className="space-y-2">
                                <label className="text-sm text-white/60">Location (optional)</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g., San Francisco, Remote, Germany"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            {/* Remote Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div
                                    className={`w-12 h-6 rounded-full transition-all ${remoteOnly ? 'bg-emerald-500' : 'bg-white/20'
                                        }`}
                                    onClick={() => setRemoteOnly(!remoteOnly)}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${remoteOnly ? 'translate-x-[26px]' : 'translate-x-0.5'
                                            }`}
                                    />
                                </div>
                                <span className="text-white/70">Remote only</span>
                            </label>
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            disabled={!canSearch || isSearching}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Find Jobs
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        {/* Error */}
                        {error && (
                            <p className="text-center text-red-400 text-sm">{error}</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
