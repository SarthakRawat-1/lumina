import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { courseApi, type Course, type Chapter } from '@/lib/courseApi';
import { CourseGraph } from '@/components/course/CourseGraph';
import { UploadMaterialsModal } from '@/components/course/UploadMaterialsModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    BookOpen,
    Layers,
    Play,
    CheckCircle2,
    MoreVertical,
    FileText,
    Presentation,
    Files,
    Share2,
    Sparkles,
    Calendar,
    Trophy,
    GraduationCap,
    X,
    Lock,
    Download,
    RefreshCw,
    FileCode
} from 'lucide-react';

export default function CourseViewPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    const [course, setCourse] = useState<Course | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Locked chapter modal state
    const [lockedChapterTitle, setLockedChapterTitle] = useState<string | null>(null);


    // Initial load
    useEffect(() => {
        if (courseId) {
            loadCourseData();
        }
    }, [courseId]);

    // Polling for progressive chapter loading while course is generating
    useEffect(() => {
        if (!course || course.status !== 'creating') return;

        const pollInterval = setInterval(async () => {
            if (!courseId) return;
            try {
                const [courseData, chaptersData] = await Promise.all([
                    courseApi.getCourse(courseId),
                    courseApi.getChapters(courseId),
                ]);
                setCourse(courseData);
                setChapters(chaptersData.chapters);

                // Stop polling if course is done
                if (courseData.status !== 'creating') {
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [course?.status, courseId]);

    const loadCourseData = async () => {
        if (!courseId) return;

        try {
            console.log('Loading course data for:', courseId);
            const [courseData, chaptersData] = await Promise.all([
                courseApi.getCourse(courseId),
                courseApi.getChapters(courseId),
            ]);

            console.log('Loaded course:', courseData);
            console.log('Loaded chapters data:', chaptersData);

            setCourse(courseData);
            setChapters(chaptersData.chapters);
        } catch (error) {
            console.error('Failed to load course:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const completedCount = chapters.filter(c => c.is_completed).length;
    const progressPercent = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

    // Helper to get node status from graph - uses same logic as graph view for consistency
    const getNodeStatus = (chapter: Chapter): string => {
        if (!course?.nodes) return 'unlocked';
        const node = course.nodes.find(n => n.id === chapter.node_id);
        return node?.status || 'unlocked';
    };

    // Helper to determine if a chapter is locked based on graph node status
    const isChapterLocked = (chapter: Chapter): boolean => {
        return getNodeStatus(chapter) === 'locked';
    };


    // Handler for chapter click (list view)
    const handleChapterClick = (chapter: Chapter, index: number) => {
        if (isChapterLocked(chapter)) {
            setLockedChapterTitle(chapter.title);
        } else {
            navigate(`/courses/${courseId}/chapters/${chapter.id}`);
        }
    };

    // Handler for node click (graph view)
    const handleGraphNodeClick = (nodeId: string, node: { status: string; title: string }) => {
        if (node.status === 'locked') {
            setLockedChapterTitle(node.title);
        } else {
            const chapter = chapters.find(c => c.node_id === nodeId);
            if (chapter) {
                navigate(`/courses/${courseId}/chapters/${chapter.id}`);
            }
        }
    };

    // Formatting helpers
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-mono text-sm animate-pulse">Loading Course Data...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-3">Course Not Found</h2>
                    <p className="text-zinc-500 mb-6">The course you are looking for does not exist or has been removed.</p>
                    <button
                        onClick={() => navigate('/courses')}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                    >
                        Back to All Courses
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] relative overflow-y-auto font-outfit text-white">
            {/* Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Ambient Orbs */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

                {/* Navigation Bar */}
                <nav className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => navigate('/courses')}
                        className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium tracking-wide">Back to Courses</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                            title="Share Course"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-colors"
                        >
                            <Files className="w-4 h-4 text-emerald-400" />
                            <span>Add Materials</span>
                        </button>
                    </div>
                </nav>

                {/* Course Header Hero */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
                    {/* Left: Course Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${course.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {course.status}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5" />
                                    {course.time_hours} Hours
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(course.created_at)}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                {course.title}
                            </h1>

                            <p className="text-xl text-zinc-400 leading-relaxed max-w-3xl">
                                {course.description}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4">
                            <p className="text-zinc-500 italic">Generate flashcards and slides at the chapter level</p>
                        </div>
                    </div>

                    {/* Right: Progress Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10" />

                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Course Progress</h3>

                            <div className="flex flex-col items-center justify-center mb-8">
                                <div className="relative w-40 h-40">
                                    {/* Progress Ring Background */}
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-white/5"
                                        />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="url(#progressGradient)"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${progressPercent * 4.4} 440`}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        <defs>
                                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#10B981" />
                                                <stop offset="100%" stopColor="#3B82F6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Center Content */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold text-white tabular-nums">{progressPercent}%</span>
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide mt-1">Completed</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm py-4 border-t border-white/5">
                                <span className="text-zinc-400">Items Completed</span>
                                <span className="text-white font-medium">{completedCount} <span className="text-zinc-600">/</span> {chapters.length}</span>
                            </div>

                            {progressPercent === 100 && (
                                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500 rounded-full">
                                        <Trophy className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-400">Course Completed!</p>
                                        <p className="text-xs text-emerald-500/60">Great job mastering this topic.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div>
                    {/* View Toggle */}
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Layers className="w-6 h-6 text-emerald-500" />
                            Curriculum
                        </h2>

                        <div className="p-1 bg-[#18181B] border border-white/5 rounded-lg flex items-center">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                <MoreVertical className="w-4 h-4" />
                                List View
                            </button>
                            <button
                                onClick={() => setViewMode('graph')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'graph'
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                <Share2 className="w-4 h-4" />
                                Knowledge Graph
                            </button>
                        </div>
                    </div>

                    {/* Graph View */}
                    <AnimatePresence mode="wait">
                        {viewMode === 'graph' && course.nodes && course.nodes.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-[600px] border border-white/5 rounded-2xl overflow-hidden bg-[#18181B] shadow-2xl relative group"
                            >
                                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/50 backdrop-blur rounded-lg border border-white/10 text-xs text-zinc-400">
                                    Interactive Knowledge Map
                                </div>
                                <CourseGraph
                                    nodes={course.nodes}
                                    edges={course.edges || []}
                                    onNodeClick={handleGraphNodeClick}
                                />
                            </motion.div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {chapters.length === 0 && course?.status === 'ready' && (
                                    <div className="col-span-1 md:col-span-2 p-4 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 text-center">
                                        No chapters found. Check console logs. Course ID: {courseId}
                                    </div>
                                )}
                                {chapters.map((chapter, index) => {
                                    const locked = isChapterLocked(chapter);

                                    return (
                                        <motion.div
                                            key={chapter.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleChapterClick(chapter, index)}
                                            className={`group relative overflow-hidden bg-[#18181B] border transition-all duration-300 rounded-2xl cursor-pointer ${locked
                                                ? 'border-zinc-700/50 opacity-60 hover:opacity-80'
                                                : chapter.is_completed
                                                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                                                    : 'border-white/5 hover:border-white/20 hover:shadow-2xl hover:shadow-emerald-500/5'
                                                }`}
                                        >
                                            <div className="p-6 relative z-10">
                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${locked
                                                            ? 'bg-zinc-800 text-zinc-500'
                                                            : chapter.is_completed
                                                                ? 'bg-emerald-500 text-white'
                                                                : 'bg-white/5 text-zinc-400'
                                                            }`}>
                                                            {locked ? (
                                                                <Lock className="w-4 h-4" />
                                                            ) : chapter.is_completed ? (
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            ) : (
                                                                index + 1
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                                                Chapter {index + 1}
                                                            </span>
                                                            <h3 className={`text-lg font-bold transition-colors line-clamp-1 ${locked
                                                                ? 'text-zinc-500'
                                                                : 'text-white group-hover:text-emerald-400'
                                                                }`}>
                                                                {chapter.title}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className={`p-2 rounded-full transition-colors ${locked
                                                        ? 'bg-zinc-800/50 text-zinc-600'
                                                        : chapter.is_completed
                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                            : 'bg-white/5 text-zinc-500 group-hover:bg-emerald-500 group-hover:text-white'
                                                        }`}>
                                                        {locked ? (
                                                            <Lock className="w-4 h-4" />
                                                        ) : (
                                                            <Play className="w-4 h-4 fill-current" />
                                                        )}
                                                    </div>
                                                </div>

                                                <p className={`text-sm line-clamp-2 mb-4 transition-colors ${locked ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-zinc-300'
                                                    }`}>
                                                    {chapter.summary}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {chapter.time_minutes} min
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        Reading & Quiz
                                                    </div>
                                                    {locked && (
                                                        <div className="flex items-center gap-1 text-amber-500/80 ml-auto">
                                                            <Lock className="w-3 h-3" />
                                                            <span>Locked</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hover Gradient Effect */}
                                            {!locked && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                            )}
                                        </motion.div>
                                    );
                                })}

                                {/* Generation indicator - shows when course is still being created */}
                                {course?.status === 'creating' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative p-6 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-emerald-400 font-medium mb-1">Generating Chapters...</p>
                                            <p className="text-zinc-500 text-sm">New chapters will appear automatically</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:200ms]" />
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:400ms]" />
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Locked Chapter Modal */}
            <AnimatePresence>
                {lockedChapterTitle && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setLockedChapterTitle(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#18181B] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Lock className="w-8 h-8 text-amber-400" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">Chapter Locked</h3>
                                <p className="text-zinc-400 mb-6 leading-relaxed">
                                    <span className="text-white font-medium">"{lockedChapterTitle}"</span> is currently locked.
                                    Complete the previous chapters to unlock this content.
                                </p>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setLockedChapterTitle(null)}
                                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-colors"
                                    >
                                        Got it
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLockedChapterTitle(null);
                                            // Find the first incomplete chapter
                                            const firstIncomplete = chapters.find(c => !c.is_completed);
                                            if (firstIncomplete) {
                                                navigate(`/courses/${courseId}/chapters/${firstIncomplete.id}`);
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-white text-sm font-bold transition-colors"
                                    >
                                        Continue Learning
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Materials Modal */}
            <UploadMaterialsModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                courseId={courseId || ''}
                onUploadComplete={() => loadCourseData()}
            />

        </div>
    );
}
