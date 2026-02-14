import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Loader2, ChevronDown, Check, ArrowLeft, ArrowRight, Clock, Film, Terminal, Zap, Globe, Sparkles } from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import {
    generateVideo,
    getAvailableLanguages,
} from '@/lib/videoApi';
import type {
    Video as VideoType,
    LanguageOption,
} from '@/lib/videoApi';

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

export default function VideoGeneratorPage() {
    const navigate = useNavigate();

    // Form state
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('en-US');
    const [langOpen, setLangOpen] = useState(false);
    const [durationMode, setDurationMode] = useState<'short' | 'medium' | 'long'>('short');
    const [languages, setLanguages] = useState<LanguageOption[]>([]);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLogs, setGenerationLogs] = useState<string[]>([]);
    const [video, setVideo] = useState<VideoType | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Terminal auto-scroll ref
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Load available languages
    useEffect(() => {
        getAvailableLanguages().then(setLanguages).catch(() => {
            setLanguages(DEFAULT_LANGUAGES as any);
        });
    }, []);

    // Scroll to bottom of terminal logs
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [generationLogs]);

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError(null);
        setVideo(null);
        setGenerationLogs(['> Initializing production sequence...']);

        // Simulated Terminal Logs
        const logSequence = [
            { text: '> Researching facts...', delay: 1000 },
            { text: '> Facts researched.', delay: 2500 },
            { text: '> Generating transcripts...', delay: 4500 },
            { text: '> Generating voice...', delay: 6500 },
            { text: '> Generating scenes...', delay: 8500 },
        ];

        let timeouts: ReturnType<typeof setTimeout>[] = [];

        logSequence.forEach(({ text, delay }) => {
            const timeout = setTimeout(() => {
                setGenerationLogs(prev => [...prev, text]);
            }, delay);
            timeouts.push(timeout);
        });

        try {
            const result = await generateVideo({
                topic: topic.trim(),
                language,
                duration_mode: durationMode,
            });
            // Redirect to view page after generation
            navigate(`/video/${result.video_id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate video');
            setGenerationLogs(prev => [...prev, `> ERROR: ${err instanceof Error ? err.message : 'Generation failed'}`]);
        } finally {
            timeouts.forEach(clearTimeout);
            setIsGenerating(false);
        }
    }, [topic, language, durationMode, navigate]);

    const durationOptions = [
        { value: 'short', label: 'Short', time: '1-2m', icon: Zap },
        { value: 'medium', label: 'Medium', time: '2-3m', icon: Clock },
        { value: 'long', label: 'Long', time: '3+m', icon: Film },
    ];

    const currentLangDisplay = languages.find(l => l.code === language) || { name: language, flag: '🌐' };

    const getFlag = (code: string) => {
        const found = DEFAULT_LANGUAGES.find(l => l.code === code);
        return found ? found.flag : '🌐';
    }

    return (
        <div className="relative min-h-screen bg-[#121212] overflow-hidden font-outfit text-white">
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

            {/* Split Layout Container */}
            <div className="relative z-10 flex h-screen">

                {/* LEFT PANEL: Control Deck */}
                <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col overflow-y-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 hover-glow-white cursor-pointer transition-colors w-fit" onClick={() => navigate('/video')}>
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium tracking-wide">BACK TO STUDIO</span>
                        </div>
                        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                            Director's Console
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Fabricate educational content from raw concepts.
                        </p>
                    </motion.div>

                    {/* Forms */}
                    <div className="flex-1 flex flex-col gap-8 max-w-xl">

                        {/* 1. Topic Input (Terminal Style) */}
                        <div className="group">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">CONCEPT</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Enter your topic..."
                                    className="w-full bg-[#18181B] border-2 border-white/5 rounded-xl px-6 py-4 text-xl font-medium text-white placeholder:text-zinc-700 outline-none focus:border-pink-500/50 focus:shadow-glow-pink transition-all"
                                    autoFocus
                                />

                            </div>
                        </div>

                        {/* 2. Duration Grid */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                DURATION
                                <span className="text-xs text-zinc-600 font-normal">(approximate)</span>
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {durationOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setDurationMode(option.value as any)}
                                        className={`relative group bg-[#18181B] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${durationMode === option.value
                                            ? 'border-pink-500/50 shadow-glow-pink'
                                            : 'border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <option.icon className={`w-6 h-6 ${durationMode === option.value ? 'text-pink-500' : 'text-zinc-500'}`} />
                                        <div className="text-center">
                                            <div className={`font-semibold ${durationMode === option.value ? 'text-white' : 'text-zinc-400'}`}>{option.label}</div>
                                            <div className="text-xs text-zinc-600 font-mono mt-1">{option.time}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Language Selector */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">LANGUAGE</label>
                            <div className={`rounded-xl overflow-hidden transition-all duration-300 border ${langOpen
                                ? "bg-[#18181B] border-pink-500/30 shadow-2xl shadow-pink-900/10"
                                : "bg-[#18181B] border-white/5 hover:border-white/10"
                                }`}>
                                <button
                                    onClick={() => setLangOpen(!langOpen)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Globe className={`w-5 h-5 transition-colors ${langOpen ? 'text-pink-500' : 'text-zinc-500'}`} />
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
                                                {languages.map((lang) => (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => {
                                                            setLanguage(lang.code);
                                                            setLangOpen(false);
                                                        }}
                                                        className={`w-full relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group overflow-hidden ${language === lang.code ? 'text-white bg-white/5' : 'text-zinc-400 hover:text-pink-400'
                                                            }`}
                                                    >
                                                        {/* Pink Hover Line */}
                                                        <div className={`absolute left-0 top-1 bottom-1 w-[2px] bg-pink-500/40 rounded-r-full transition-opacity duration-200 ${language === lang.code ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                            }`} />

                                                        {/* Pink Hover Gradient */}
                                                        <div className={`absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent transition-opacity duration-200 pointer-events-none ${language === lang.code ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                            }`} />

                                                        <span className="text-lg relative z-10">{(lang as any).flag || getFlag(lang.code)}</span>
                                                        <span className="relative z-10 flex-1 text-left">{lang.name}</span>
                                                        {language === lang.code && <Check className="w-4 h-4 text-pink-500 relative z-10" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <div className="pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={!topic.trim() || isGenerating}
                                className="relative w-full rounded-xl bg-gradient-to-r from-pink-600 via-pink-400 to-pink-600 bg-[length:100%_auto] border border-pink-600 text-white font-bold text-xl tracking-widest py-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_25px_rgba(236,72,153,0.5),0_0_10px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-200"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                            <span>PRODUCING...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                            <span>ACTION</span>
                                            <ArrowRight className="w-5 h-5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Viewfinder */}
                <div className="hidden lg:flex w-1/2 bg-[#0c0c0e] border-l border-white/5 relative items-center justify-center p-12">
                    {/* Viewfinder Overlay Lines */}
                    <div className="absolute inset-12 border border-white/5 rounded-3xl pointer-events-none">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-pink-500/30 rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-pink-500/30 rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-pink-500/30 rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-pink-500/30 rounded-br-xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-pink-500/20">+</div>
                    </div>

                    {/* Content Display */}
                    <AnimatePresence mode="wait">
                        {isGenerating ? (
                            <motion.div
                                key="terminal"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full max-w-lg p-6 font-mono text-sm max-h-[400px] overflow-hidden flex flex-col items-center text-center"
                            >
                                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar w-full">
                                    {generationLogs.map((log, i) => (
                                        <div key={i} className="text-pink-500 font-medium tracking-wide animate-pulse">
                                            {log}
                                        </div>
                                    ))}
                                    <div ref={terminalEndRef} />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="text-center"
                            >
                                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-pink-500/5 border border-pink-500/10 flex items-center justify-center shadow-glow-pink">
                                    <Video className="w-12 h-12 text-pink-500/50" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Ready to Record</h3>
                                <p className="text-zinc-500 max-w-sm mx-auto">
                                    Configure your content parameters on the left deck to initialize the generation matrix.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
