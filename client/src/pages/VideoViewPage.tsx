
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Trash2,
    Clock,
    Layers,
    Globe,
    Calendar,
    MonitorPlay,
    AlertTriangle,
    Film,
    Download,
    Check
} from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { getVideo, deleteVideo, renderVideo, getRenderStatus, getDownloadUrl } from '@/lib/videoApi';
import { getAuthHeader } from '@/context/AuthContext';
import type { Video } from '@/types';

export default function VideoViewPage() {
    const navigate = useNavigate();
    const { videoId } = useParams<{ videoId: string }>();

    const [video, setVideo] = useState<Video | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New Render State
    const [renderState, setRenderState] = useState<'idle' | 'rendering' | 'done'>('idle');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    useEffect(() => {
        if (videoId) {
            loadVideo(videoId);
            checkRenderStatus(videoId);
        }
    }, [videoId]);

    const loadVideo = async (id: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getVideo(id);
            setVideo(data);
        } catch (err) {
            console.error('Failed to load video:', err);
            setError('Video not found');
        } finally {
            setIsLoading(false);
        }
    };

    const checkRenderStatus = async (id: string) => {
        try {
            const status = await getRenderStatus(id);
            if (status.status === 'done') {
                setRenderState('done');
                setDownloadUrl(status.gcsUrl || getDownloadUrl(id));
            } else if (status.status === 'rendering') {
                setRenderState('rendering');
                startPolling(id);
            }
        } catch (e) {
            // Ignore if not found
        }
    };

    const startPolling = (id: string) => {
        const interval = setInterval(async () => {
            const status = await getRenderStatus(id);
            if (status.status === 'done') {
                setRenderState('done');
                setDownloadUrl(status.gcsUrl || getDownloadUrl(id));
                clearInterval(interval);
            } else if (status.status === 'error') {
                setRenderState('idle');
                clearInterval(interval);
            }
        }, 2000);
        return () => clearInterval(interval);
    };

    const handleDelete = async () => {
        if (!videoId) return;

        try {
            setIsDeleting(true);
            await deleteVideo(videoId);
            navigate('/video');
        } catch (err) {
            console.error('Failed to delete video:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRender = async () => {
        if (!videoId || !video) return;

        // If already done, trigger download
        if (renderState === 'done' && downloadUrl) {
            window.open(downloadUrl, '_blank');
            return;
        }

        try {
            setRenderState('rendering');

            // Trigger render
            await renderVideo(videoId, video);

            // Start polling (and get cleanup fn, but we just let it run)
            startPolling(videoId);

        } catch (err) {
            console.error('Failed to render video:', err);
            setRenderState('idle');
        }
    };

    const handleReRender = async () => {
        if (!videoId || !video) return;

        try {
            setRenderState('rendering');
            // Trigger render with force=true
            await renderVideo(videoId, video, true);
            startPolling(videoId);
        } catch (err) {
            console.error('Failed to re-render video:', err);
            setRenderState('idle');
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                    <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Loading Assets...</p>
                </div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[#18181B] border border-white/5 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Signal Lost</h2>
                    <p className="text-zinc-500 mb-8">{error || "The requested video could not be retrieved."}</p>
                    <button
                        onClick={() => navigate('/video')}
                        className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
                    >
                        Return to Console
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] overflow-x-hidden font-outfit text-white relative">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

                {/* Header Navigation (Simpler Style) */}
                <div className="mb-6">
                    <div
                        className="flex items-center gap-2 text-zinc-500 hover:text-white cursor-pointer transition-colors w-fit"
                        onClick={() => navigate('/video')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-widest uppercase">Back to Studio</span>
                    </div>
                </div>

                {/* Main Content (Stack Layout) */}
                <div className="flex flex-col gap-8">

                    {/* 1. Full Width Player */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group w-full"
                    >
                        {/* Monitor Frame Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" />

                        <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                            {/* Wider Display */}
                            <div className="aspect-video relative w-full bg-black">
                                <VideoPlayer video={video} />
                            </div>

                            {/* Decorative line */}
                            <div className="h-0.5 bg-zinc-800 w-full relative">
                                <div className="absolute top-0 left-0 h-full bg-pink-500/50 w-full" />
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. Metadata & Title (Below Player) */}
                    <div className="flex flex-col md:flex-row gap-8 items-start justify-between">

                        {/* Title & Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">{video.topic}</h1>
                                <div className="flex flex-wrap items-center gap-6 text-zinc-400">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-pink-500" />
                                        {formatDate(video.created_at)}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                    <span className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-pink-500" />
                                        <span className="capitalize">{video.language}</span>
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider">
                                        <MonitorPlay className="w-3 h-3" />
                                        AI Generated
                                    </div>
                                    {renderState === 'done' && (
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                            <Check className="w-3 h-3" />
                                            Download Ready
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-zinc-400 text-lg max-w-3xl leading-relaxed">
                                This video was generated using Lumina's AI engine. It contains {video.scenes.length} distinct scenes and has a total runtime of {formatDuration(video.total_duration_seconds)}.
                            </p>
                        </div>

                        {/* Side Stats / Actions */}
                        <div className="w-full md:w-auto flex flex-col gap-4 min-w-[250px]">

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl bg-[#18181B] border border-white/5 flex flex-col items-center justify-center text-center">
                                    <Clock className="w-5 h-5 text-pink-500 mb-2" />
                                    <div className="text-lg font-bold text-white">{formatDuration(video.total_duration_seconds)}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">Duration</div>
                                </div>
                                <div className="p-4 rounded-xl bg-[#18181B] border border-white/5 flex flex-col items-center justify-center text-center">
                                    <Layers className="w-5 h-5 text-pink-500 mb-2" />
                                    <div className="text-lg font-bold text-white">{video.scenes.length}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">Scenes</div>
                                </div>
                            </div>

                            {/* Delete Action */}
                            <div className="space-y-4">
                                {/* Render Button */}
                                <div>
                                    <button
                                        onClick={handleRender}
                                        disabled={renderState === 'rendering'}
                                        className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-2 py-4">
                                            {renderState === 'rendering' ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span>PROCESSING...</span>
                                                </>
                                            ) : renderState === 'done' ? (
                                                <>
                                                    <Download className="w-3 h-3" />
                                                    <span>DOWNLOAD READY</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                                    <span>DOWNLOAD VIDEO</span>
                                                    <ArrowRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                                </>
                                            )}
                                        </div>
                                    </button>

                                    {/* Re-download Button (Only visible when done) */}
                                    {renderState === 'done' && (
                                        <motion.button
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[10px] font-bold tracking-widest uppercase group hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 mt-3"
                                            onClick={handleReRender}
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-2 py-3">
                                                <Layers className="w-3 h-3" />
                                                <span>DOWNLOAD AGAIN</span>
                                            </div>
                                        </motion.button>
                                    )}
                                </div>

                                {/* Delete Action */}
                                <div>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-2 py-4">
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span>DELETING...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                                    <span>DELETE VIDEO</span>
                                                    <ArrowRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
