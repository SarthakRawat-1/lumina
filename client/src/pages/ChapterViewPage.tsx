import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { courseApi } from '@/lib/courseApi';
import type { Chapter, Question, ChatMessage } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ChapterRenderer from '@/components/ChapterRenderer';
import {
    ArrowLeft,
    CheckCircle2,
    MessageSquare,
    Send,
    X,
    Presentation,
    Files,
    Headphones,
    Pause,
    BookOpen,
    HelpCircle,
    Bot,
    User,
    RefreshCw,
    FileCode,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChapterViewPage() {
    const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
    const navigate = useNavigate();

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // AI Tools state
    const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
    const [slidesHtml, setSlidesHtml] = useState<string | null>(null);

    // Quiz state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);

    // Chat state
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Audio player state
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [isPausedAudio, setIsPausedAudio] = useState(false);
    const [audioRate, setAudioRate] = useState(1.0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Handlers
    const handleGenerateSlides = async () => {
        if (!chapter || !chapterId) return;
        setIsGeneratingSlides(true);
        try {
            const response = await courseApi.generateChapterSlides(chapterId);
            setSlidesHtml(response.slides_html);
        } catch (error) {
            console.error(error);
            alert("Failed to generate slides. Please try again.");
        } finally {
            setIsGeneratingSlides(false);
        }
    };

    const handleGenerateFlashcards = async () => {
        if (!chapter || !chapterId) return;
        setIsGeneratingFlashcards(true);
        try {
            const blob = await courseApi.generateChapterFlashcards(chapterId);

            // Trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${chapter.title.replace(/\s+/g, '_')}_flashcards.apkg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("Failed to generate flashcards. Please try again.");
        } finally {
            setIsGeneratingFlashcards(false);
        }
    };

    const handleDownloadPdf = () => {
        if (!slidesHtml) return;

        // Use data URI with print-pdf parameter for proper PDF rendering
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Chapter Slides - ${chapter?.title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/black.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/highlight/monokai.css">
    <style>
        /* PDF print styles */
        @media print {
            .reveal .slides {
                width: 100% !important;
                height: auto !important;
            }
            .reveal .slides section {
                page-break-after: always !important;
                display: block !important;
                position: relative !important;
                width: 100% !important;
                height: 100vh !important;
                min-height: 100vh !important;
                padding: 40px !important;
                box-sizing: border-box !important;
            }
            .reveal section {
                visibility: visible !important;
                opacity: 1 !important;
            }
        }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${slidesHtml}
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/markdown/markdown.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/highlight/highlight.js"></script>
    <script>
        Reveal.initialize({
            plugins: [ RevealMarkdown, RevealHighlight ],
            pdfSeparateFragments: false,
            pdfMaxPagesPerSlide: 1,
            embedded: false,
            center: true,
            width: 960,
            height: 700
        }).then(() => {
            setTimeout(() => window.print(), 1500);
        });
    </script>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleDownloadHtml = () => {
        if (!slidesHtml) return;
        const blob = new Blob([`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${chapter?.title} - Slides</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.css">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/black.css">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/highlight/monokai.css">
            </head>
            <body>
                <div class="reveal">
                    <div class="slides">
                        ${slidesHtml}
                    </div>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/markdown/markdown.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/highlight/highlight.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/notes/notes.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/math/math.js"></script>
                <script>
                    Reveal.initialize({
                        plugins: [ RevealMarkdown, RevealHighlight, RevealNotes, RevealMath.KaTeX ],
                        hash: true,
                        autoAnimate: true,
                        transition: 'slide'
                    });
                </script>
            </body>
            </html>
        `], { type: 'text/html' });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chapter?.title?.replace(/\s+/g, '_') || 'chapter'}_slides.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (courseId && chapterId) {
            loadChapterData();
        }
    }, [courseId, chapterId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const loadChapterData = async () => {
        if (!courseId || !chapterId) return;

        try {
            const [chapterData, questionsData] = await Promise.all([
                courseApi.getChapter(courseId, chapterId),
                courseApi.getQuestions(chapterId),
            ]);

            setChapter(chapterData);
            setQuestions(questionsData.questions);
        } catch (error) {
            console.error('Failed to load chapter:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!chapterId || !selectedAnswer) return;

        const question = questions[currentQuestionIndex];

        try {
            const result = await courseApi.submitAnswer(chapterId, question.id, selectedAnswer);
            setFeedback({
                isCorrect: result.is_correct,
                message: result.feedback,
            });
        } catch (error) {
            console.error('Failed to submit answer:', error);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer('');
            setFeedback(null);
        } else {
            setShowQuiz(false);
        }
    };

    const handleMarkComplete = async () => {
        if (!courseId || !chapterId) return;

        try {
            await courseApi.markChapterComplete(courseId, chapterId);
            setChapter(prev => prev ? { ...prev, is_completed: true } : null);
        } catch (error) {
            console.error('Failed to mark complete:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!chapterId || !chatInput.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: chatInput.trim(),
            timestamp: new Date().toISOString(),
        };

        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsSending(true);

        try {
            const response = await courseApi.sendChatMessage(chapterId, userMessage.content);

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.message,
                timestamp: response.timestamp,
            };

            setChatMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!chapter) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-3">Chapter Not Found</h2>
                    <button
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                    >
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-[#121212] relative font-outfit text-white">
            {/* Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Ambient Orbs */}
            <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-4 py-4 max-w-5xl flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Course</span>
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Audio Player */}
                        <button
                            onClick={async () => {
                                if (audioRef.current) {
                                    if (isPlayingAudio) {
                                        audioRef.current.pause();
                                        setIsPlayingAudio(false);
                                        setIsPausedAudio(true);
                                    } else if (isPausedAudio) {
                                        try {
                                            await audioRef.current.play();
                                            setIsPlayingAudio(true);
                                            setIsPausedAudio(false);
                                        } catch (error) {
                                            console.error("Audio resume error:", error);
                                        }
                                    } else {
                                        setIsLoadingAudio(true);
                                        const audioUrl = courseApi.getChapterAudioUrl(
                                            courseId || '',
                                            chapterId || '',
                                            audioRate
                                        );

                                        audioRef.current.onerror = () => {
                                            console.error("Audio playback error");
                                            setIsLoadingAudio(false);
                                            setIsPlayingAudio(false);
                                            alert("Failed to load audio.");
                                        };

                                        audioRef.current.oncanplay = () => {
                                            setIsLoadingAudio(false);
                                        };

                                        audioRef.current.src = audioUrl;

                                        try {
                                            await audioRef.current.play();
                                            setIsPlayingAudio(true);
                                            setIsLoadingAudio(false);
                                        } catch (error: unknown) {
                                            console.error("Audio play error:", error);
                                            setIsLoadingAudio(false);
                                            setIsPlayingAudio(false);
                                            const err = error as Error;
                                            if (err.name === 'NotAllowedError') {
                                                alert("Audio playback was prevented by browser autoplay policy.");
                                            } else if (err.name === 'AbortError') {
                                                alert("Audio loading was aborted. Please try again.");
                                            } else {
                                                alert("Could not play audio.");
                                            }
                                        }
                                    }
                                }
                            }}
                            disabled={isLoadingAudio}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${isLoadingAudio
                                ? 'bg-white/10 text-zinc-400 cursor-wait'
                                : isPlayingAudio
                                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
                                    : isPausedAudio
                                        ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {isLoadingAudio ? (
                                <div className="w-3.5 h-3.5 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" />
                            ) : isPlayingAudio ? (
                                <Pause className="w-3.5 h-3.5" />
                            ) : (
                                <Headphones className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">
                                {isLoadingAudio ? 'Loading...' : isPlayingAudio ? 'Playing' : isPausedAudio ? 'Paused' : 'Listen'}
                            </span>
                        </button>

                        {/* Tools Divider */}
                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <button
                            onClick={handleGenerateSlides}
                            disabled={isGeneratingSlides}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative group"
                            title="Generate Slides"
                        >
                            {isGeneratingSlides ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Presentation className="w-4 h-4" />
                            )}
                            <span className="absolute top-10 right-0 bg-black/90 text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Generate Slides
                            </span>
                        </button>

                        <button
                            onClick={handleGenerateFlashcards}
                            disabled={isGeneratingFlashcards}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative group"
                            title="Download Flashcards"
                        >
                            {isGeneratingFlashcards ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Files className="w-4 h-4" />
                            )}
                            <span className="absolute top-10 right-0 bg-black/90 text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Download Flashcards
                            </span>
                        </button>

                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`p-2 rounded-full transition-all relative ${showChat
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>

                        {!chapter.is_completed && (
                            <button
                                onClick={handleMarkComplete}
                                className="ml-2 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Complete</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-12 items-start justify-center lg:justify-start">
                {/* Left Column: Content */}
                <div className="lg:col-span-1 w-full max-w-full">
                    <div className="mb-10">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">
                            <BookOpen className="w-4 h-4" />
                            Chapter {chapter.index + 1}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                            {chapter.title}
                        </h1>
                        <p className="text-lg text-zinc-400 leading-relaxed border-l-2 border-emerald-500/50 pl-6">
                            {chapter.summary}
                        </p>
                    </div>

                    {/* Render structured sections if available, otherwise fallback to markdown */}
                    {chapter.sections && chapter.sections.length > 0 ? (
                        <ChapterRenderer sections={chapter.sections} />
                    ) : (
                        <MarkdownRenderer content={chapter.content || ''} />
                    )}

                    {/* Bottom Completion (if completed) */}
                    {chapter.is_completed && (
                        <div className="mt-12 p-6 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Chapter Completed</h3>
                                <p className="text-sm text-zinc-400">You've mastered this topic. Great work!</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Quiz (Sticky) */}
                <div className="lg:sticky lg:top-28 space-y-6 w-full max-w-full">
                    {questions.length > 0 && (
                        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-emerald-500" />
                                    <h2 className="font-bold text-white">Knowledge Check</h2>
                                </div>
                                <span className="text-xs font-medium text-zinc-500 bg-white/5 px-2 py-1 rounded-full">
                                    {questions.length} Questions
                                </span>
                            </div>

                            {!showQuiz ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-zinc-400 mb-6">Ready to test your understanding of this chapter?</p>
                                    <button
                                        onClick={() => setShowQuiz(true)}
                                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors transform active:scale-95"
                                    >
                                        Start Quiz
                                    </button>
                                </div>
                            ) : (
                                <div className="relative z-10">
                                    {/* Progress Bar */}
                                    <div className="w-full h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                                            Question {currentQuestionIndex + 1}
                                        </span>
                                        <p className="font-medium text-white leading-relaxed">
                                            {currentQuestion.question_text}
                                        </p>
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-2 mb-6">
                                        {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                                            currentQuestion.options.map((option: { key: string; text: string }) => (
                                                <button
                                                    key={option.key}
                                                    onClick={() => !feedback && setSelectedAnswer(option.key)}
                                                    disabled={!!feedback}
                                                    className={`w-full p-3 rounded-lg text-left text-sm transition-all border ${selectedAnswer === option.key
                                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                                                        : 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                                                        } ${feedback && option.key === currentQuestion.correct_answer
                                                            ? '!border-green-500 !bg-green-500/20 !text-green-300'
                                                            : ''
                                                        } ${feedback && selectedAnswer === option.key && !feedback.isCorrect
                                                            ? '!border-red-500 !bg-red-500/20 !text-red-300'
                                                            : ''
                                                        } disabled:cursor-default`}
                                                >
                                                    <span className="font-bold mr-2 opacity-50">{option.key.toUpperCase()}.</span>
                                                    {option.text}
                                                </button>
                                            ))
                                        )}

                                        {currentQuestion.question_type === 'open_text' && (
                                            <textarea
                                                value={selectedAnswer}
                                                onChange={(e) => setSelectedAnswer(e.target.value)}
                                                disabled={!!feedback}
                                                placeholder="Type your answer..."
                                                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                                            />
                                        )}
                                    </div>

                                    {/* Feedback */}
                                    <AnimatePresence>
                                        {feedback && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className={`p-3 rounded-lg mb-4 text-sm ${feedback.isCorrect
                                                    ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                                                    : 'bg-red-500/10 border border-red-500/20 text-red-300'
                                                    }`}
                                            >
                                                <p className="font-bold mb-1">
                                                    {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                                                </p>
                                                <p className="opacity-90 leading-relaxed font-light">{feedback.message}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Actions */}
                                    <div className="flex justify-end">
                                        {!feedback ? (
                                            <button
                                                onClick={handleSubmitAnswer}
                                                disabled={!selectedAnswer}
                                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Check Answer
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleNextQuestion}
                                                className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Sidepanel */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed right-0 top-[73px] bottom-0 w-full max-w-[400px] bg-[#18181B]/95 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col shadow-2xl"
                    >
                        {/* Chat Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#18181B]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Bot className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">AI Tutor</h3>
                                    <p className="text-xs text-zinc-500">Ask me anything about this chapter</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChat(false)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {chatMessages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 p-8">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-sm">No messages yet.</p>
                                    <p className="text-xs opacity-60 mt-1">Start a conversation to get help!</p>
                                </div>
                            )}

                            {chatMessages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-zinc-800 text-white rounded-tr-sm'
                                            : 'bg-emerald-500/10 border border-emerald-500/10 text-zinc-200 rounded-tl-sm'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isSending && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/10 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5 bg-[#18181B]">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder="Type your question..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isSending}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Slides Overlay */}
            {slidesHtml && (
                <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#18181B]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Presentation className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white text-sm">Chapter Slides</h2>
                                <p className="text-xs text-zinc-400">{chapter?.title}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleGenerateSlides()}
                                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                                title="Regenerate"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <div className="h-6 w-px bg-white/10 mx-2" />
                            <button
                                onClick={handleDownloadHtml}
                                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                                title="Download HTML"
                            >
                                <FileCode className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors"
                                title="Print to PDF"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export PDF</span>
                            </button>
                            <div className="h-6 w-px bg-white/10 mx-2" />
                            <button
                                onClick={() => setSlidesHtml(null)}
                                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-black relative">
                        <iframe
                            title="Slide Preview"
                            srcDoc={`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.css">
                                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/black.css">
                                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/highlight/monokai.css">
                                    <style>
                                        .reveal section img { background: none; border: none; box-shadow: none; }
                                        .reveal h1, .reveal h2, .reveal h3 { text-transform: none; }
                                    </style>
                                </head>
                                <body>
                                    <div class="reveal">
                                        <div class="slides">
                                            ${slidesHtml}
                                        </div>
                                    </div>
                                    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.js"></script>
                                    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/markdown/markdown.js"></script>
                                    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/highlight/highlight.js"></script>
                                    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/notes/notes.js"></script>
                                    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/math/math.js"></script>
                                    <script>
                                        Reveal.initialize({
                                            plugins: [ RevealMarkdown, RevealHighlight, RevealNotes, RevealMath.KaTeX ],
                                            hash: true,
                                            autoAnimate: true,
                                            transition: 'slide'
                                        });
                                    </script>
                                </body>
                                </html>
                            `}
                            className="w-full h-full border-none"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {/* Hidden audio element for TTS */}
            <audio
                ref={audioRef}
                onEnded={() => {
                    setIsPlayingAudio(false);
                    setIsPausedAudio(false);
                }}
                onError={() => {
                    setIsPlayingAudio(false);
                    setIsLoadingAudio(false);
                    setIsPausedAudio(false);
                }}
                className="hidden"
            />
        </div>
    );
}
