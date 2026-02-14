/**
 * LearnVideoPage - Individual video view page with player and AI chat
 * Route: /learn/:videoId
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import {
    ArrowLeft,
    Send,
    Loader2,
    Clock,
    Sparkles,
    FileText,
    ExternalLink,
    AlertTriangle,
    Layers,
    Play
} from 'lucide-react';
import {
    getLibraryVideo,
    askVideoQuestion,
    getVideoChapters,
    getVideoUrl,
    formatTime,
    teachBack,
    getChatHistory,
    saveChatMessage,
    clearChatHistory,
} from '@/lib/videoAssistantApi';
import type {
    LibraryVideo,
    VideoChapter as Chapter,
} from '@/types';
import { notesApi } from '@/lib/documentsApi';

// =============================================================================
// Helper Functions
// =============================================================================

function detectNoteRequest(message: string): boolean {
    const noteKeywords = [
        'note', 'notes', 'create a note', 'add to notes', 'save as note',
        'make a note', 'write a note', 'create note', 'open note',
        'summarize in note', 'summarize in a note', 'put in notes',
        'document this', 'write it down', 'save this'
    ];
    const lowerMessage = message.toLowerCase();
    return noteKeywords.some(keyword => lowerMessage.includes(keyword));
}

function detectTeachRequest(message: string): boolean {
    const teachKeywords = [
        'test me', 'quiz me', 'teach mode', 'let me explain',
        'check my understanding', 'teach it back', 'test my knowledge',
        'evaluate me', 'assess me', 'teach me back', 'teach back',
        'start teaching', 'enter teach', 'i want to teach'
    ];
    const lowerMessage = message.toLowerCase();
    return teachKeywords.some(keyword => lowerMessage.includes(keyword));
}

function detectStopRequest(message: string): boolean {
    const stopKeywords = [
        'stop', 'exit', 'quit', 'cancel', 'end teach mode',
        'stop teaching', 'normal mode', 'switch to normal'
    ];
    const lowerMessage = message.toLowerCase();
    return stopKeywords.some(keyword => lowerMessage === keyword || lowerMessage.includes('stop teach'));
}

// =============================================================================
// Types
// =============================================================================

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamps?: { seconds: number; formatted: string; text: string }[];
    noteLink?: string;
}

// =============================================================================
// Internal Components
// =============================================================================

function ChaptersSlider({ chapters, currentTime, onSeek }: { chapters: Chapter[], currentTime: number, onSeek: (time: number) => void }) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Update active index
    useEffect(() => {
        const index = chapters.findIndex((chapter, i) =>
            currentTime >= chapter.start_time && (i === chapters.length - 1 || currentTime < chapters[i + 1].start_time)
        );
        if (index !== -1 && index !== activeIndex) {
            setActiveIndex(index);
        }
    }, [currentTime, chapters, activeIndex]);

    // Auto-scroll to active item
    useEffect(() => {
        if (sliderRef.current && activeIndex >= 0) {
            const container = sliderRef.current;
            const activeElement = container.children[activeIndex] as HTMLElement;

            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [activeIndex]);

    return (
        <div
            ref={sliderRef}
            className="flex overflow-x-auto pb-8 pt-4 gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x px-1"
        >
            {chapters.map((chapter, i) => {
                const isActive = i === activeIndex;
                return (
                    <button
                        key={i}
                        onClick={() => onSeek(chapter.start_time)}
                        className={`group flex-shrink-0 w-72 p-4 rounded-xl transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden snap-start border ${isActive
                            ? 'bg-[#18181B] border-pink-500/50 shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)] scale-[1.02] z-10'
                            : 'bg-[#18181B] border-white/5 hover:border-pink-500/30 hover:bg-[#222228] opacity-80 hover:opacity-100'
                            }`}
                        id={`chapter-${i}`}
                    >
                        {/* Hover/Active Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${isActive ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'bg-pink-500/10 text-pink-500'
                                    }`}>
                                    {chapter.formatted_time}
                                </span>
                                {isActive && (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                                    </span>
                                )}
                            </div>
                            <h4 className={`text-sm font-bold line-clamp-2 transition-colors ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                {chapter.title}
                            </h4>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// =============================================================================
// Component
// =============================================================================

export default function LearnVideoPage() {
    const navigate = useNavigate();
    const { videoId } = useParams<{ videoId: string }>();

    // Video state
    const [video, setVideo] = useState<LibraryVideo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Player state - ReactPlayer for uploads, YouTube API for YouTube
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ytPlayerRef = useRef<any>(null); // YouTube IFrame API player instance
    const [isPlaying, setIsPlaying] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Chapters state
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    // Teach mode state
    const [teachModeActive, setTeachModeActive] = useState(false);
    const [teachStartTime, setTeachStartTime] = useState(0);
    const [teachSessionId, setTeachSessionId] = useState<string | undefined>(undefined);

    // Load YouTube IFrame API
    useEffect(() => {
        if (typeof window !== 'undefined' && !(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Time tracking for YouTube
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let interval: any;
        if (isPlaying && video?.source_type === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
            interval = setInterval(() => {
                const time = ytPlayerRef.current.getCurrentTime();
                setCurrentTime(time);
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isPlaying, video]);

    // Initialize YouTube player when video loads and is a YouTube video
    useEffect(() => {
        if (!video || video.source_type !== 'youtube') return;

        const initPlayer = () => {
            if ((window as any).YT && (window as any).YT.Player) {
                if (ytPlayerRef.current) {
                    ytPlayerRef.current.destroy();
                }

                ytPlayerRef.current = new (window as any).YT.Player('youtube-player', {
                    events: {
                        'onReady': () => {
                            console.log('[YouTube API] Player ready');
                            setPlayerReady(true);
                        },
                        'onStateChange': (event: any) => {
                            // 1 = playing, 2 = paused
                            setIsPlaying(event.data === 1);
                        },
                        'onError': (event: any) => {
                            console.error('[YouTube API] Error:', event.data);
                            setPlayerError(`YouTube error code: ${event.data}`);
                        }
                    }
                });
            }
        };

        if ((window as any).YT && (window as any).YT.Player) {
            setTimeout(initPlayer, 500);
        } else {
            (window as any).onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            if (ytPlayerRef.current) {
                ytPlayerRef.current.destroy();
                ytPlayerRef.current = null;
            }
        };
    }, [video]);

    // Get current time
    const getCurrentTime = useCallback((): number => {
        if (video?.source_type === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
            return ytPlayerRef.current.getCurrentTime();
        } else if (playerRef.current?.currentTime) {
            return playerRef.current.currentTime;
        }
        return 0;
    }, [video]);

    // Load video on mount
    useEffect(() => {
        if (videoId) {
            loadVideo(videoId);
        }
    }, [videoId]);

    // Load chapters once video is loaded
    useEffect(() => {
        if (video) {
            loadChapters(video.id);
        }
    }, [video]);

    const loadVideo = async (id: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getLibraryVideo(id);
            setVideo(data);

            const chatHistory = await getChatHistory(id);
            if (chatHistory.length > 0) {
                setChatMessages(chatHistory.map(msg => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamps: msg.timestamps,
                    noteLink: msg.noteLink
                })));
            }
        } catch (err) {
            console.error('Failed to load video:', err);
            setError('Video not found');
        } finally {
            setIsLoading(false);
        }
    };

    const loadChapters = async (id: string) => {
        setIsLoadingChapters(true);
        try {
            const data = await getVideoChapters(id);
            setChapters(data.chapters);
        } catch (err) {
            console.error('Failed to load chapters:', err);
        } finally {
            setIsLoadingChapters(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !video || isSending) return;

        const messageContent = chatInput.trim();
        setChatInput('');

        if (messageContent.toLowerCase() === 'clear chat') {
            try {
                await clearChatHistory(video.id);
                setChatMessages([]);
            } catch (err) {
                console.error('Failed to clear chat:', err);
            }
            return;
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageContent,
        };

        setChatMessages((prev) => [...prev, userMessage]);
        setIsSending(true);
        saveChatMessage(video.id, { role: 'user', content: messageContent });

        const isStopRequest = detectStopRequest(messageContent);
        if (isStopRequest && teachModeActive) {
            setTeachModeActive(false);
            const stopMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '👍 **Exited Teach Back Mode**\n\nReturning to normal chat.',
            };
            setChatMessages((prev) => [...prev, stopMessage]);
            saveChatMessage(video.id, { role: 'assistant', content: stopMessage.content });
            setIsSending(false);
            return;
        }

        try {
            const isTeachRequest = detectTeachRequest(messageContent);
            const currentTime = getCurrentTime();

            if (isTeachRequest && !teachModeActive) {
                setTeachModeActive(true);
                setTeachStartTime(currentTime);
                setTeachSessionId(undefined); // Reset session

                const teachResponse = await teachBack(video.id, 0, currentTime);
                if (teachResponse.session_id) setTeachSessionId(teachResponse.session_id);

                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: teachResponse.prompt || '🎓 **Teach It Back Mode**\n\nExplain what you\'ve learned so far from this video.',
                };
                setChatMessages((prev) => [...prev, assistantMessage]);
                saveChatMessage(video.id, { role: 'assistant', content: assistantMessage.content });
                setIsSending(false);
                return;
            }

            if (teachModeActive) {
                const teachResponse = await teachBack(
                    video.id,
                    teachStartTime,
                    currentTime,
                    undefined,     // userId (not used here)
                    messageContent, // userExplanation
                    teachSessionId  // sessionId
                );

                if (teachResponse.session_id) setTeachSessionId(teachResponse.session_id);

                let content = '';

                if (teachResponse.feedback) {
                    content += `${teachResponse.feedback}\n\n`;
                }

                if (teachResponse.session_progress) {
                    const progress = teachResponse.session_progress;
                    content += `📊 **Progress:** Concept ${progress.concept_index || 0}/${progress.total_concepts || 0}\n`;
                    content += `✅ Mastered: ${progress.mastered_concepts || 0}/${progress.total_concepts || 0}\n`;
                }

                if (teachResponse.evaluation) {
                    const evaluation = teachResponse.evaluation;
                    const score = teachResponse.mastery_score || 0;
                    const emoji = score >= 90 ? '🌟' : score >= 70 ? '👍' : score >= 50 ? '📚' : '🔄';

                    if (evaluation.understanding_level) {
                        content += `📈 **Understanding Level:** ${evaluation.understanding_level}\n\n`;
                    }

                    if (score !== undefined) {
                        content += `${emoji} **Mastery Score:** ${score}%\n\n`;
                        content += `  • Recall: ${evaluation.recall_score || 0}%\n`;
                        content += `  • Explanation: ${evaluation.explanation_score || 0}%\n`;
                        content += `  • Application: ${evaluation.application_score || 0}%\n`;
                    }

                    if (evaluation.strengths && evaluation.strengths.length > 0) {
                        content += `✅ **Strengths:**\n  ${evaluation.strengths.map((s: string) => `• ${s}`).join('\n  ')}\n\n`;
                    }

                    if (evaluation.identified_gaps && evaluation.identified_gaps.length > 0) {
                        content += `❓ **Gaps to Address:**\n  ${evaluation.identified_gaps.map((g: string) => `• ${g}`).join('\n  ')}\n\n`;
                    }

                    if (evaluation.suggested_clarifications && evaluation.suggested_clarifications.length > 0) {
                        content += `💡 **Suggestions:**\n  ${evaluation.suggested_clarifications.map((s: string) => `• ${s}`).join('\n  ')}\n\n`;
                    }
                }

                if (teachResponse.follow_up_question && !teachResponse.is_complete) {
                    content += `🤔 **Follow-up:** ${teachResponse.follow_up_question}`;
                }

                if (teachResponse.is_complete) {
                    const score = teachResponse.mastery_score || 0;
                    if (score >= 85) {
                        content += '\n\n🎉 **Excellent!** You\'ve demonstrated mastery of this section!';
                    } else {
                        content += '\n\n➡️ **Moving On:** We\'ve explored this concept enough for now. Let\'s continue to the next one.';
                    }

                    if (!teachResponse.next_concept_prompt) {
                        content += '\n\n📚 Ready to move to next concept? Or would you like to:\n  • Try a more challenging question?\n  • See how this connects to other concepts?\n  • Review what we\'ve covered?';
                        setTeachModeActive(false);
                    }
                }

                if (teachResponse.next_concept_prompt) {
                    content += '\n\n---\n\n';
                    content += `**Next Concept:** ${teachResponse.next_concept_prompt}`;
                    // Keep teach mode active for next concept
                    setTeachModeActive(true);
                }

                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content,
                };
                setChatMessages((prev) => [...prev, assistantMessage]);
                saveChatMessage(video.id, { role: 'assistant', content: assistantMessage.content });
                setIsSending(false);
                return;
            }



            const isNoteRequest = detectNoteRequest(messageContent);
            const response = await askVideoQuestion(video.id, messageContent, currentTime);

            let assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                timestamps: response.timestamps,
            };

            if (isNoteRequest) {
                try {
                    const noteTitle = `Notes: ${video.title}`;
                    const noteContent = `# ${noteTitle}\n\n${response.answer}\n\n---\n*Generated from video at ${formatTime(currentTime)}*`;

                    const noteResult = await notesApi.createPending({
                        content: noteContent,
                        title: noteTitle,
                        sourceType: 'video',
                        sourceId: video.id
                    });

                    assistantMessage = {
                        ...assistantMessage,
                        content: response.answer + '\n\n📝 I\'ve created a note for you!',
                        noteLink: noteResult.url
                    };
                } catch (noteErr) {
                    console.error('Failed to create note:', noteErr);
                    assistantMessage = { ...assistantMessage, content: response.answer + '\n\n⚠️ Could not create note.' };
                }
            }

            setChatMessages((prev) => [...prev, assistantMessage]);
            saveChatMessage(video.id, {
                role: 'assistant',
                content: assistantMessage.content,
                timestamps: assistantMessage.timestamps,
                noteLink: assistantMessage.noteLink
            });
        } catch (err) {
            console.error('Chat error:', err);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, error: ${err instanceof Error ? err.message : 'Unknown'}.`,
            };
            setChatMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    const seekTo = useCallback((seconds: number) => {
        if (video?.source_type === 'youtube' && ytPlayerRef.current?.seekTo) {
            ytPlayerRef.current.seekTo(seconds, true);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
        } else if (playerRef.current && playerReady) {
            playerRef.current.currentTime = seconds;
            setIsPlaying(true);
        }
    }, [video, playerReady]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center font-outfit">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6 font-outfit">
                <div className="max-w-md w-full bg-[#18181B] border border-white/5 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Video Not Found</h2>
                    <p className="text-zinc-500 mb-8">{error || "Could not retrieve video."}</p>
                    <button onClick={() => navigate('/learn')} className="w-full py-3 rounded-xl bg-white text-black font-bold">Back to Library</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] overflow-hidden font-outfit text-white relative">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500 hover:text-white cursor-pointer transition-colors w-fit" onClick={() => navigate('/learn')}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-widest uppercase">Back</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)]">

                    {/* Left Column: Video & Chapters (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">

                        {/* 1. Video Player */}
                        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl group flex-shrink-0">
                            {/* Glow Effect */}
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500 pointer-events-none" />

                            <div className="relative w-full h-full bg-black z-10">
                                {video.source_type === 'youtube' ? (
                                    <iframe
                                        id="youtube-player"
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${video.source_id}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&origin=${window.location.origin}`}
                                        title={video.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                        onLoad={() => setPlayerReady(true)}
                                    />
                                ) : (
                                    <ReactPlayer
                                        ref={playerRef}
                                        url={getVideoUrl(video)}
                                        width="100%"
                                        height="100%"
                                        playing={isPlaying}
                                        controls
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                                        onReady={() => setPlayerReady(true)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* 2. Metadata (Simplified) */}
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
                        </div>

                        {/* 3. Chapters Slider */}
                        <div className="pb-10">
                            {isLoadingChapters ? (
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading chapters...</span>
                                </div>
                            ) : chapters.length > 0 ? (
                                // Slider Layout
                                <div className="flex overflow-x-auto pb-8 pt-4 gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x px-1">
                                    {chapters.map((chapter, i) => {
                                        const isActive = currentTime >= chapter.start_time && (i === chapters.length - 1 || currentTime < chapters[i + 1].start_time);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => seekTo(chapter.start_time)}
                                                className={`group flex-shrink-0 w-72 p-4 rounded-xl transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden snap-start border ${isActive
                                                    ? 'bg-[#18181B] border-pink-500/50 shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)] scale-[1.02] z-10'
                                                    : 'bg-[#18181B] border-white/5 hover:border-pink-500/30 hover:bg-[#222228] opacity-80 hover:opacity-100'
                                                    }`}
                                            >
                                                {/* Hover/Active Gradient */}
                                                <div className={`absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${isActive ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'bg-pink-500/10 text-pink-500'
                                                            }`}>
                                                            {chapter.formatted_time}
                                                        </span>
                                                        {isActive && (
                                                            <span className="flex h-2 w-2 relative">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className={`text-sm font-bold line-clamp-2 transition-colors ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                                        {chapter.title}
                                                    </h4>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No chapters available.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chat Only (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col h-full bg-[#18181B] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] pointer-events-none" />

                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/5 bg-black/20 z-10 flex items-center gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-white">AI Assistant</h3>
                                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Always Online</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {chatMessages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-6">
                                    <Sparkles className="w-12 h-12 text-zinc-600 mb-4" />
                                    <p className="text-sm text-zinc-400">Ask anything about the video.</p>
                                </div>
                            )}

                            {chatMessages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-pink-600 to-rose-600 text-white font-medium rounded-tr-sm shadow-md'
                                        : 'bg-[#222228] border border-white/5 text-zinc-200 rounded-tl-sm shadow-sm'
                                        }`}>
                                        {msg.content}

                                        {msg.noteLink && (
                                            <button onClick={() => navigate(msg.noteLink!)} className="mt-3 w-full px-3 py-2 rounded-lg bg-black/20 hover:bg-black/30 text-white/90 text-xs font-bold flex items-center justify-center gap-2 border border-white/5 transition-all">
                                                <FileText className="w-3 h-3 text-pink-400" />
                                                View Note
                                                <ExternalLink className="w-3 h-3 opacity-50 ml-auto" />
                                            </button>
                                        )}

                                        {msg.timestamps && msg.timestamps.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-2">
                                                {msg.timestamps.map((ts, i) => (
                                                    <button key={i} onClick={() => seekTo(ts.seconds)} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] mobile:text-xs font-bold text-pink-300 flex items-center gap-1 transition-colors">
                                                        <Clock className="w-3 h-3" />
                                                        {ts.formatted}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isSending && (
                                <div className="flex justify-start">
                                    <div className="px-4 py-3 rounded-2xl bg-[#222228] rounded-tl-none border border-white/5">
                                        <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Teach Mode Bar */}
                        <AnimatePresence>
                            {teachModeActive && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="bg-pink-900/10 border-t border-pink-500/20 px-4 py-2 flex items-center justify-between"
                                >
                                    <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                        Teach Mode
                                    </span>
                                    <button onClick={() => setTeachModeActive(false)} className="text-xs text-white/50 hover:text-white transition-colors">Exit</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div className="p-4 bg-black/20 border-t border-white/5 backdrop-blur-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder={teachModeActive ? "Explain answer..." : "Ask AI..."}
                                    className={`w-full pl-4 pr-12 py-3 rounded-xl bg-[#09090b] border text-sm text-white placeholder:text-zinc-600 outline-none transition-all shadow-inner font-mono ${teachModeActive ? 'border-pink-500/30' : 'border-white/5 focus:border-pink-500/50'
                                        }`}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isSending}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center rounded-lg bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 disabled:opacity-30 disabled:shadow-none transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
