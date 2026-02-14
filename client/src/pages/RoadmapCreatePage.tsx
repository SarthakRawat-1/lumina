/**
 * RoadmapCreatePage - Navigator's Console
 * Left-aligned layout with high-tech "Architect" aesthetic (Cyan/Blue).
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronDown, Check, ArrowLeft, ArrowRight, Terminal, Compass, Trophy, Zap, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { generateRoadmap } from '@/lib/roadmapApi';

const DEFAULT_LANGUAGES = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    // Global Languages
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    // Indian Languages
    { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
    { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳' },
    { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
    { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'pa-IN', name: 'Punjabi', flag: '🇮🇳' },
];

export default function RoadmapCreatePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Form State
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('');
    const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [language, setLanguage] = useState('en-US');
    const [langOpen, setLangOpen] = useState(false);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLogs, setGenerationLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Get user ID from auth, fallback to anonymous
    const userId = user?.id || 'anonymous';

    // Scroll logs
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [generationLogs]);

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError(null);
        setGenerationLogs(['> Initializing navigation systems...']);

        // Simulated Logs
        const logSequence = [
            { text: '> Analyzing skill prerequisites...', delay: 1000 },
            { text: '> Mapping knowledge nodes...', delay: 2500 },
            { text: '> Calculating optimal learning trajectory...', delay: 4500 },
            { text: '> Finalizing schematic...', delay: 6000 },
        ];

        let timeouts: ReturnType<typeof setTimeout>[] = [];

        logSequence.forEach(({ text, delay }) => {
            const timeout = setTimeout(() => {
                setGenerationLogs(prev => [...prev, text]);
            }, delay);
            timeouts.push(timeout);
        });

        try {
            const result = await generateRoadmap({
                topic: topic.trim(),
                goal: goal.trim() || undefined,
                skill_level: skillLevel,
                language,
                user_id: userId,
            });
            navigate(`/roadmap/${result.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate roadmap');
            setGenerationLogs(prev => [...prev, `> ERROR: ${err instanceof Error ? err.message : 'Generation failed'}`]);
        }
    };

    const skillOptions = [
        { value: 'beginner', label: 'Beginner', icon: Zap, desc: 'New to this' },
        { value: 'intermediate', label: 'Intermediate', icon: Compass, desc: 'Some experience' },
        { value: 'advanced', label: 'Advanced', icon: Trophy, desc: 'Expert level' },
    ];

    const currentLangDisplay = DEFAULT_LANGUAGES.find(l => l.code === language) || { name: language, flag: '🌐' };

    return (
        <div className="min-h-screen bg-[#121212] overflow-y-auto font-outfit text-white relative">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 w-full min-h-screen flex flex-col p-8 md:p-12">

                {/* Header - Left Aligned */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col items-start gap-4 mb-8"
                >
                    <div
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                        onClick={() => navigate('/roadmap')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium tracking-wide">BACK TO ROADMAPS</span>
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
                            Create New Roadmap
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-lg">
                            Design your personalized learning path. define your goal, and let AI map the journey.
                        </p>
                    </div>
                </motion.div>

                {/* Main Content Area - Single Left Column */}
                <div className="w-full max-w-lg flex flex-col gap-8">

                    {/* 1. Topic */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="group"
                    >
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">TARGET SKILL</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Python for Data Science"
                            className="w-full bg-[#18181B] border-2 border-white/5 rounded-xl px-6 py-4 text-xl font-medium text-white placeholder:text-zinc-700 outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all"
                            autoFocus
                        />
                    </motion.div>

                    {/* 2. Goal */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="group"
                    >
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">MISSION OBJECTIVE (OPTIONAL)</label>
                        <input
                            type="text"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g. Build a portfolio project"
                            className="w-full bg-[#18181B] border-2 border-white/5 rounded-xl px-6 py-4 text-lg text-white placeholder:text-zinc-700 outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all"
                        />
                    </motion.div>

                    {/* 3. Skill Level */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">STARTING COORDINATES</label>
                        <div className="grid grid-cols-3 gap-4">
                            {skillOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSkillLevel(option.value as any)}
                                    className={`relative group bg-[#18181B] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${skillLevel === option.value
                                        ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                        : 'border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <option.icon className={`w-6 h-6 ${skillLevel === option.value ? 'text-cyan-500' : 'text-zinc-500'}`} />
                                    <div className="text-center">
                                        <div className={`font-semibold text-sm ${skillLevel === option.value ? 'text-white' : 'text-zinc-400'}`}>{option.label}</div>
                                        <div className="text-[10px] text-zinc-600 font-mono mt-0.5 uppercase">{option.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* 4. Language */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">COMMUNICATION PROTOCOL</label>
                        <div className={`rounded-xl overflow-hidden transition-all duration-300 border ${langOpen
                            ? "bg-[#18181B] border-cyan-500/30"
                            : "bg-[#18181B] border-white/5 hover:border-white/10 hover:bg-white/5"
                            }`}>
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Globe className={`w-5 h-5 transition-colors ${langOpen ? 'text-cyan-500' : 'text-zinc-500'}`} />
                                    <span className="text-lg text-white">
                                        {currentLangDisplay.name}
                                    </span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${langOpen ? 'rotate-180 text-white' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {langOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden border-t border-white/5"
                                    >
                                        <div className="p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                            {DEFAULT_LANGUAGES.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        setLanguage(lang.code);
                                                        setLangOpen(false);
                                                    }}
                                                    className={`w-full relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group overflow-hidden ${language === lang.code ? 'text-white bg-white/5' : 'text-zinc-400 hover:text-cyan-400'
                                                        }`}
                                                >
                                                    {/* Cyan Hover Line */}
                                                    <div className={`absolute left-0 top-1 bottom-1 w-[2px] bg-cyan-500/40 rounded-r-full transition-opacity duration-200 ${language === lang.code ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />

                                                    {/* Cyan Hover Gradient */}
                                                    <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent transition-opacity duration-200 pointer-events-none ${language === lang.code ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />

                                                    <span className="text-lg relative z-10">
                                                        {lang.flag}
                                                    </span>
                                                    <span className="relative z-10 flex-1 text-left">{lang.name}</span>
                                                    {language === lang.code && <Check className="w-4 h-4 text-cyan-500 relative z-10" />}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Action Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="pt-6"
                    >
                        <button
                            onClick={handleGenerate}
                            disabled={!topic.trim() || isGenerating}
                            className="relative w-full rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600 bg-[length:100%_auto] border border-cyan-600 text-white font-bold text-xl tracking-widest py-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_25px_rgba(6,182,212,0.5),0_0_10px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-200"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        <span>INITIALIZING...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                        <span>INITIATE ROADMAP</span>
                                        <ArrowRight className="w-5 h-5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                                    </>
                                )}
                            </div>
                        </button>

                        {error && (
                            <p className="mt-4 text-red-400 text-sm">{error}</p>
                        )}
                    </motion.div>

                </div>

            </div>
        </div>
    );
}
