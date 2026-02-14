/**
 * RoadmapPage - AI-powered learning roadmap generator
 * 
 * Redesigned: Left-aligned, Card-less, Normal Sizing, Sidebar-style Dropdown.
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronDown, Check } from 'lucide-react';
import { RoadmapFlow } from '@/components/roadmap/RoadmapFlow';
import { NodeDetailsDrawer } from '@/components/roadmap/NodeDetailsDrawer';
import { useAuth } from '@/context/AuthContext';
import {
    generateRoadmap,
    getNodeDetails,
    updateNodeProgress,
} from '@/lib/roadmapApi';
import type {
    Roadmap,
    NodeDetails,
    UserProgress,
} from '@/lib/roadmapApi';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    // Global Languages
    { code: 'fr', label: 'French', flag: '🇫🇷' },
    { code: 'de', label: 'German', flag: '🇩🇪' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
    { code: 'it', label: 'Italian', flag: '🇮🇹' },
    // Indian Languages
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
    { code: 'te', label: 'Telugu', flag: '🇮🇳' },
    { code: 'bn', label: 'Bengali', flag: '🇮🇳' },
    { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
    { code: 'gu', label: 'Gujarati', flag: '🇮🇳' },
    { code: 'kn', label: 'Kannada', flag: '🇮🇳' },
    { code: 'ml', label: 'Malayalam', flag: '🇮🇳' },
    { code: 'pa', label: 'Punjabi', flag: '🇮🇳' },
    { code: 'or', label: 'Odia', flag: '🇮🇳' },
];

export default function RoadmapPage() {
    const { user } = useAuth();

    // Form State
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('');
    const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [language, setLanguage] = useState('en');
    const [langOpen, setLangOpen] = useState(false);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Node details drawer state
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Get user ID from auth, fallback to anonymous
    const userId = user?.id || 'anonymous';

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateRoadmap({
                topic: topic.trim(),
                goal: goal.trim() || undefined,
                skill_level: skillLevel,
                language,
                user_id: userId,
            });
            setRoadmap(result);
            setProgress({
                roadmap_id: result.id,
                user_id: userId,
                status: {},
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate roadmap');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNodeClick = useCallback(async (nodeId: string, _label: string) => {
        if (!roadmap) return;

        setSelectedNodeId(nodeId);
        setIsLoadingDetails(true);
        setNodeDetails(null);

        try {
            const details = await getNodeDetails(roadmap.id, nodeId, language);
            setNodeDetails(details);
        } catch (err) {
            console.error('Failed to load node details:', err);
        } finally {
            setIsLoadingDetails(false);
        }
    }, [roadmap, language]);

    const handleStatusChange = useCallback(async (newStatus: 'in_progress' | 'completed' | 'skipped') => {
        if (!roadmap || !selectedNodeId || !progress) return;

        try {
            await updateNodeProgress(roadmap.id, userId, selectedNodeId, newStatus);
            setProgress({
                ...progress,
                status: {
                    ...progress.status,
                    [selectedNodeId]: newStatus,
                },
            });
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    }, [roadmap, selectedNodeId, progress, userId]);

    // Current language object
    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <div className="relative min-h-screen bg-background overflow-y-auto font-outfit">
            {/* 
                Clean Grid Background (No Gradient Blobs as requested) 
                Added a subtle grid for texture without being "silly".
            */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <div className="relative z-10 w-full min-h-screen flex flex-col p-8">
                {/* Header - Left Aligned */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col items-start gap-2 mb-12"
                >
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold text-white">
                            AI Learning Roadmap
                        </h1>
                    </div>
                    <p className="text-white/50 text-sm max-w-md ml-1">
                        Generate personalized learning paths tailored to your goals.
                    </p>
                </motion.div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative">
                    <AnimatePresence mode="wait">
                        {!roadmap ? (
                            /* Input Form - Left Aligned, No Card, Normal Sizing */
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="max-w-xl w-full flex flex-col gap-8 pb-20"
                            >
                                {/* Topic Input */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-medium text-white/70 ml-1">What do you want to learn?</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., Full Stack Developer"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-white/[0.07]"
                                        autoFocus
                                    />
                                </div>

                                {/* Goal Input */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-medium text-white/70 ml-1">Your goal (optional)</label>
                                    <input
                                        type="text"
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        placeholder="e.g., To get a job at Google"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-white/[0.07]"
                                    />
                                </div>

                                {/* Skill Level */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-medium text-white/70 ml-1">Current skill level</label>
                                    <div className="flex gap-3">
                                        {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setSkillLevel(level)}
                                                className={`
                                                    relative flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors duration-200 border
                                                    ${skillLevel === level
                                                        ? 'text-white border-white/20 shadow-lg shadow-blue-500/20'
                                                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white/60'}
                                                `}
                                            >
                                                {skillLevel === level && (
                                                    <motion.div
                                                        layoutId="skill-level-bg"
                                                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl"
                                                        initial={false}
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    />
                                                )}
                                                <span className="relative z-10">{level}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 
                                    Language Dropdown - Sidebar Style 
                                    Placed at the bottom as requested, but with the custom interaction.
                                */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-medium text-white/70 ml-1">Language</label>
                                    <div className={`
                                        relative rounded-xl overflow-hidden transition-all duration-200 border
                                        ${langOpen ? "bg-[#0c0c14] border-white/10 shadow-xl z-50 ring-1 ring-white/10" : "bg-white/5 border-white/10 hover:bg-white/[0.07]"}
                                    `}>
                                        <button
                                            onClick={() => setLangOpen(!langOpen)}
                                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{currentLang.flag}</span>
                                                <span className="text-white/90 text-sm font-medium">{currentLang.label}</span>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
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
                                                    <div className="p-1 max-h-[220px] overflow-y-auto custom-scrollbar bg-[#0c0c14]">
                                                        {LANGUAGES.map((lang) => (
                                                            <button
                                                                key={lang.code}
                                                                onClick={() => {
                                                                    setLanguage(lang.code);
                                                                    setLangOpen(false);
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${language === lang.code ? 'bg-blue-500/20 text-blue-200' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                                                            >
                                                                <span className="text-lg">{lang.flag}</span>
                                                                <span>{lang.label}</span>
                                                                {language === lang.code && <Check className="w-3 h-3 ml-auto text-blue-400" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={!topic.trim() || isGenerating}
                                    className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            Generate Roadmap
                                        </>
                                    )}
                                </button>

                                {error && (
                                    <p className="mt-2 text-red-400 text-sm">{error}</p>
                                )}
                            </motion.div>
                        ) : (
                            /* Result State - Full Screen Roadmap */
                            <motion.div
                                key="roadmap"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex flex-col bg-[#0c0c14] border border-white/10 rounded-2xl overflow-hidden h-[calc(100vh-140px)]"
                            >
                                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">{roadmap.title}</h2>
                                        <p className="text-white/50 text-xs">{roadmap.description}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setRoadmap(null);
                                            setProgress(null);
                                            setTopic('');
                                            setGoal('');
                                        }}
                                        className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 text-sm border border-white/10 transition-all hover:text-white"
                                    >
                                        Create New
                                    </button>
                                </div>

                                <div className="flex-1 relative bg-grid-white/[0.02]">
                                    <RoadmapFlow
                                        roadmapNodes={roadmap.nodes}
                                        roadmapEdges={roadmap.edges}
                                        progress={progress || undefined}
                                        onNodeClick={handleNodeClick}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Node Details Drawer */}
                <NodeDetailsDrawer
                    isOpen={!!selectedNodeId}
                    nodeDetails={nodeDetails}
                    isLoading={isLoadingDetails}
                    currentStatus={progress?.status[selectedNodeId || ''] || 'pending'}
                    onClose={() => setSelectedNodeId(null)}
                    onStatusChange={handleStatusChange}
                />
            </div>
        </div>
    );
}
