import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseApi, type Language, type CourseCreate } from '@/lib/courseApi';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    ArrowLeft,
    Clock,
    Book,
    Globe,
    Layers,
    ArrowRight,
    ChevronDown,
    Check
} from 'lucide-react';

export default function CreateCoursePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [topic, setTopic] = useState('');
    const [timeHours, setTimeHours] = useState(5);
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [language, setLanguage] = useState('en');

    // Explicitly define languages to ensure dropdown is populated
    const [languages, setLanguages] = useState<Language[]>([
        { code: "en", name: "English", native_name: "English" },
        // Global Languages
        { code: "fr", name: "French", native_name: "Français" },
        { code: "de", name: "German", native_name: "Deutsch" },
        { code: "es", name: "Spanish", native_name: "Español" },
        { code: "pt", name: "Portuguese", native_name: "Português" },
        { code: "it", name: "Italian", native_name: "Italiano" },
        // Indian Languages
        { code: "hi", name: "Hindi", native_name: "हिन्दी" },
        { code: "ta", name: "Tamil", native_name: "தமிழ்" },
        { code: "te", name: "Telugu", native_name: "తెలుగు" },
        { code: "bn", name: "Bengali", native_name: "বাংলা" },
        { code: "mr", name: "Marathi", native_name: "मराठी" },
        { code: "gu", name: "Gujarati", native_name: "ગુજરાતી" },
        { code: "kn", name: "Kannada", native_name: "ಕನ್ನಡ" },
        { code: "ml", name: "Malayalam", native_name: "മലയാളം" },
        { code: "pa", name: "Punjabi", native_name: "ਪੰਜਾਬੀ" },
        { code: "or", name: "Odia", native_name: "ଓଡ଼ିଆ" }
    ]);

    // UI State
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    // Initial Data Load
    useEffect(() => {
        courseApi.getLanguages().then(langs => {
            if (langs && langs.length > 0) {
                setLanguages(langs);
            }
        }).catch(console.error);
    }, []);

    const handleSubmit = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        try {
            const courseData: CourseCreate = {
                topic: topic.trim(),
                time_hours: timeHours,
                difficulty,
                language,
                user_id: user?.id,
            };
            const course = await courseApi.createCourse(courseData);
            navigate(`/courses/${course.id}`);
        } catch (error) {
            console.error('Failed to create course:', error);
            setIsLoading(false);
        }
    };

    const difficulties = [
        { id: 'beginner', label: 'Beginner', desc: 'New to the subject' },
        { id: 'intermediate', label: 'Intermediate', desc: 'Some prior knowledge' },
        { id: 'advanced', label: 'Advanced', desc: 'Deep understanding' },
    ];

    const currentLanguage = languages.find(l => l.code === language);

    return (
        <div className="min-h-screen bg-[#121212] relative overflow-y-auto font-outfit text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/courses')}
                        className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold tracking-widest uppercase">Back to Courses</span>
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">CREATE NEW COURSE</h1>
                    <p className="text-zinc-500 text-lg">Generate a personalized curriculum powered by AI.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input Form */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Topic Input */}
                        <section>
                            <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                What do you want to learn?
                            </label>
                            <div className="relative group">
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Master React Native including Reanimated, Gesture Handler, and publishing to App Store..."
                                    className="w-full h-32 bg-[#18181B] border-2 border-white/5 rounded-xl p-6 text-lg text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] resize-none transition-all"
                                />
                                <div className="absolute bottom-4 right-4 text-xs font-mono text-zinc-600 bg-black/20 px-2 py-1 rounded">
                                    {topic.length} chars
                                </div>
                            </div>
                        </section>


                        {/* Language Selection (Dropdown) */}
                        <section className="relative z-30">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                <Globe className="w-3 h-3" />
                                Course Language
                            </label>

                            <div className="relative">
                                {/* Trigger Button */}
                                <button
                                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-300 ${showLanguageDropdown
                                        ? 'bg-[#18181B] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                        : 'bg-[#18181B] border border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <span className="text-white font-medium flex items-center gap-2">
                                        <span className="opacity-60 text-xs font-mono uppercase tracking-wider">{currentLanguage?.code}</span>
                                        {currentLanguage ? currentLanguage.native_name : 'Select Language'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180 text-emerald-500' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {showLanguageDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.98 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-[#18181B] border border-white/5 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar p-1"
                                        >
                                            <div className="space-y-0.5">
                                                {languages.map((lang) => (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => {
                                                            setLanguage(lang.code);
                                                            setShowLanguageDropdown(false);
                                                        }}
                                                        className={`w-full relative group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${language === lang.code
                                                            ? "text-white bg-white/[0.02]"
                                                            : "text-zinc-500 hover:text-zinc-300"
                                                            }`}
                                                    >
                                                        {/* Active State: Electric Line Indicator */}
                                                        {language === lang.code && (
                                                            <motion.div
                                                                layoutId="activeLangIndicator"
                                                                className="absolute left-0 top-1 bottom-1 w-[2px] bg-emerald-500 rounded-r-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 500,
                                                                    damping: 30,
                                                                    duration: 0.2
                                                                }}
                                                            />
                                                        )}

                                                        {/* Hover State: Subtle Line Indicator */}
                                                        {language !== lang.code && (
                                                            <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-emerald-500/40 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                        )}

                                                        {/* Active State: Gradient Glow */}
                                                        <div
                                                            className={`absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-md pointer-events-none transition-opacity duration-200 ${language === lang.code ? "opacity-100" : "opacity-0"
                                                                }`}
                                                        />

                                                        {/* Hover State: Subtle Gradient Glow */}
                                                        {language !== lang.code && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                        )}

                                                        <div className="relative z-10 flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono text-[10px] opacity-40 uppercase tracking-wider">{lang.code}</span>
                                                                <span className={`text-sm ${language === lang.code ? 'font-medium' : 'font-normal'}`}>
                                                                    {lang.native_name}
                                                                </span>
                                                            </div>
                                                            {language === lang.code && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Configuration & Actions */}
                    <div className="space-y-8">
                        {/* Difficulty */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block flex items-center gap-2">
                                <Layers className="w-3 h-3" />
                                Complexity Level
                            </label>
                            <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6">
                                <div className="grid grid-cols-3 gap-2">
                                    {difficulties.map((d) => {
                                        const isActive = difficulty === d.id;
                                        return (
                                            <button
                                                key={d.id}
                                                onClick={() => setDifficulty(d.id as any)}
                                                className={`relative overflow-hidden px-1 py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group ${isActive
                                                    ? 'text-white border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-white/[0.02]'
                                                    : 'bg-white/5 border-transparent hover:bg-white/10 text-zinc-400 hover:text-white'
                                                    }`}
                                            >
                                                {/* Active Gradient Shine */}
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent opacity-100 transition-opacity" />
                                                )}

                                                {/* Hover Shine (when not active) */}
                                                {!isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}

                                                <div className="relative z-10 text-[10px] md:text-xs font-bold uppercase truncate w-full text-center">
                                                    {d.label}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Total Duration
                            </label>
                            <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6">
                                <div className="flex items-end gap-2 mb-4">
                                    <div className="text-4xl font-bold text-white">{timeHours}</div>
                                    <div className="text-sm text-zinc-500 mb-1.5 font-medium">hours</div>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    value={timeHours}
                                    onChange={(e) => setTimeHours(Number(e.target.value))}
                                    style={{
                                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${((timeHours - 1) * 100) / 29}%, #27272a ${((timeHours - 1) * 100) / 29}%, #27272a 100%)`
                                    }}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.5)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                                />
                                <div className="flex justify-between mt-3 gap-2">
                                    {[2, 10, 25].map(h => {
                                        const isActive = timeHours === h;
                                        return (
                                            <button
                                                key={h}
                                                onClick={() => setTimeHours(h)}
                                                className={`relative overflow-hidden flex-1 py-3 px-1 rounded-xl border transition-all flex items-center justify-center group ${isActive
                                                    ? 'text-white border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-white/[0.02]'
                                                    : 'bg-white/5 border-transparent hover:bg-white/10 text-zinc-400 hover:text-white'
                                                    }`}
                                            >
                                                {/* Active Gradient Shine */}
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent opacity-100 transition-opacity" />
                                                )}

                                                {/* Hover Shine (when not active) */}
                                                {!isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}

                                                <span className="relative z-10 text-xs font-bold font-mono">
                                                    {h}H
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <button
                            onClick={handleSubmit}
                            disabled={!topic.trim() || isLoading}
                            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2 text-white font-bold tracking-widest uppercase">
                                {isLoading ? (
                                    <>Generating...</>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                        <span>Initialize Course</span>
                                        <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                                    </>
                                )}
                            </div>
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}
