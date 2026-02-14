/**
 * LearnPage - Video Library for learning from videos
 * 
 * This page shows the video library grid and handles adding new videos.
 * Video viewing is done on /learn/:videoId route.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Video,
    Plus,
    Loader2,
    Upload,
    Link2,
    Clock,
    Layers,
    Map,
    ArrowRight
} from 'lucide-react';
import {
    addVideo,
    uploadVideo,
    listLibraryVideos,
    formatTime,
} from '@/lib/videoAssistantApi';
import type { LibraryVideo } from '@/types';

// =============================================================================
// Component
// =============================================================================

export default function LearnPage() {
    const navigate = useNavigate();

    // Video library state
    const [videos, setVideos] = useState<LibraryVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Add video modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalTab, setModalTab] = useState<'youtube' | 'upload'>('youtube');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isAddingVideo, setIsAddingVideo] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load videos on mount
    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            setIsLoading(true);
            const data = await listLibraryVideos();
            setVideos(data);
        } catch (err) {
            console.error('Failed to load videos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVideo = async () => {
        if (!youtubeUrl.trim()) return;

        setIsAddingVideo(true);
        setAddError(null);

        try {
            const video = await addVideo(youtubeUrl.trim());
            setVideos((prev) => [video, ...prev]);
            setShowAddModal(false);
            setYoutubeUrl('');
            navigate(`/learn/${video.id}`);
        } catch (err) {
            setAddError(err instanceof Error ? err.message : 'Failed to add video');
        } finally {
            setIsAddingVideo(false);
        }
    };

    const handleUploadVideo = async () => {
        if (!uploadFile || !uploadTitle.trim()) return;

        setIsAddingVideo(true);
        setAddError(null);
        setUploadProgress(0);

        try {
            const video = await uploadVideo(
                uploadFile,
                uploadTitle.trim(),
                'en-US',
                undefined,
                (progress) => setUploadProgress(progress)
            );
            setVideos((prev) => [video, ...prev]);
            setShowAddModal(false);
            setUploadFile(null);
            setUploadTitle('');
            setUploadProgress(0);
            navigate(`/learn/${video.id}`);
        } catch (err) {
            setAddError(err instanceof Error ? err.message : 'Failed to upload video');
        } finally {
            setIsAddingVideo(false);
        }
    };

    const handleSelectVideo = (video: LibraryVideo) => {
        navigate(`/learn/${video.id}`);
    };

    return (
        <div className="min-h-screen bg-[#121212] relative overflow-hidden font-outfit">
            {/* Subtle Grid Pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col min-h-screen">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div>
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Learn with AI
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Master any subject with AI-assisted video learning.
                        </p>
                    </div>
                </motion.div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-40">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* 1. Existing Videos */}
                        <AnimatePresence mode="popLayout">
                            {videos.map((video, index) => (
                                <motion.div
                                    key={video.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleSelectVideo(video)}
                                    className="group relative h-full min-h-[300px] bg-[#18181B] border border-white/5 rounded-2xl flex flex-col overflow-hidden cursor-pointer hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20"
                                >
                                    {/* Video Thumbnail Placeholder (Top Section) */}
                                    <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden group-hover:brightness-110 transition-all">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <Video className="w-12 h-12 text-zinc-600 group-hover:text-red-500 transition-all duration-300" />

                                        {/* Stats Badge */}
                                        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/80 border border-white/10 text-white/90 text-xs font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-red-400" />
                                            {video.duration_seconds ? formatTime(video.duration_seconds) : '--:--'}
                                        </div>
                                    </div>

                                    {/* Video Info (Bottom Section) */}
                                    <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                        <h3 className="text-white font-semibold text-xl mb-2 line-clamp-1 group-hover:text-red-400 transition-colors">
                                            {video.title}
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                                            <div className="flex items-center gap-1.5">
                                                <Layers className="w-4 h-4" />
                                                <span>{video.segment_count} segments</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* 2. "Add New Video" Card (Always Append) */}
                        <motion.button
                            layout
                            onClick={() => setShowAddModal(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative h-full min-h-[300px] bg-[#18181B] border-2 border-dashed border-white/10 hover:border-red-500/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 text-left"
                        >
                            <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 group-hover:bg-red-500 group-hover:border-red-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-red">
                                    <Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-red-400 transition-colors">Add New Video</h3>
                                <p className="text-sm text-zinc-500">YouTube URL or Local Upload</p>
                            </div>
                        </motion.button>

                        {/* 3. Ghost Slots (Only if empty) */}
                        {videos.length === 0 && (
                            <>
                                <div className="h-full min-h-[300px] rounded-2xl border border-white/5 bg-[#121212] opacity-30 flex flex-col overflow-hidden pointer-events-none grayscale">
                                    <div className="flex-1 w-full bg-[#18181B/50] relative">
                                        <div className="absolute inset-x-12 top-12 bottom-0 bg-[#222228] rounded-t-xl opacity-50" />
                                    </div>
                                    <div className="p-6 border-t border-white/5 bg-[#121212]">
                                        <div className="h-5 w-3/4 bg-white/10 rounded mb-3" />
                                        <div className="h-4 w-1/2 bg-white/5 rounded" />
                                    </div>
                                </div>

                                <div className="h-full min-h-[300px] rounded-2xl border border-white/5 bg-[#121212] opacity-20 flex flex-col overflow-hidden pointer-events-none grayscale hidden md:flex">
                                    <div className="flex-1 w-full bg-[#18181B/50] relative">
                                        <div className="absolute inset-x-12 top-12 bottom-0 bg-[#222228] rounded-t-xl opacity-50" />
                                    </div>
                                    <div className="p-6 border-t border-white/5 bg-[#121212]">
                                        <div className="h-5 w-2/3 bg-white/10 rounded mb-3" />
                                        <div className="h-4 w-1/3 bg-white/5 rounded" />
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div >

            {/* Add Video Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg p-8 rounded-2xl bg-[#18181B] border-2 border-white/5 shadow-[0_0_50px_rgba(220,38,38,0.15)] overflow-hidden relative"
                        >
                            {/* Decorative Top Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-50" />

                            <div className="flex flex-col gap-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight uppercase mb-1">ADD LEARNING SOURCE</h2>
                                    <p className="text-zinc-500 text-sm font-medium tracking-wide">IMPORT VIDEO CONTENT FOR ANALYSIS</p>
                                </div>

                                {/* Tabs */}
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">SOURCE TYPE</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setModalTab('youtube')}
                                            className={`relative group bg-[#09090b] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${modalTab === 'youtube'
                                                ? 'border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                                                : 'border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <Link2 className={`w-5 h-5 ${modalTab === 'youtube' ? 'text-red-500' : 'text-zinc-500'}`} />
                                            <span className={`text-xs font-bold tracking-wider ${modalTab === 'youtube' ? 'text-white' : 'text-zinc-500'}`}>YOUTUBE URL</span>
                                        </button>

                                        <button
                                            onClick={() => setModalTab('upload')}
                                            className={`relative group bg-[#09090b] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${modalTab === 'upload'
                                                ? 'border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                                                : 'border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <Upload className={`w-5 h-5 ${modalTab === 'upload' ? 'text-red-500' : 'text-zinc-500'}`} />
                                            <span className={`text-xs font-bold tracking-wider ${modalTab === 'upload' ? 'text-white' : 'text-zinc-500'}`}>FILE UPLOAD</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-4">
                                    {modalTab === 'youtube' ? (
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">VIDEO LINK</label>
                                            <input
                                                type="text"
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                placeholder="https://youtube.com/..."
                                                className="w-full px-4 py-3 rounded-xl bg-[#09090b] border-2 border-white/5 text-white placeholder:text-zinc-700 outline-none focus:border-red-500/50 focus:shadow-[0_0_20px_rgba(220,38,38,0.1)] transition-all font-mono text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">CONTENT TITLE</label>
                                                <input
                                                    type="text"
                                                    value={uploadTitle}
                                                    onChange={(e) => setUploadTitle(e.target.value)}
                                                    placeholder="Enter a descriptive title..."
                                                    className="w-full px-4 py-3 rounded-xl bg-[#09090b] border-2 border-white/5 text-white placeholder:text-zinc-700 outline-none focus:border-red-500/50 focus:shadow-[0_0_20px_rgba(220,38,38,0.1)] transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">MEDIA FILE</label>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`w-full px-4 py-8 rounded-xl bg-[#09090b] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 group ${uploadFile ? 'border-red-500/50 bg-red-900/5' : 'border-white/10 hover:border-red-500/30 hover:bg-white/5'
                                                        }`}
                                                >
                                                    {uploadFile ? (
                                                        <>
                                                            <Video className="w-8 h-8 text-red-500" />
                                                            <span className="text-white font-medium">{uploadFile.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 text-zinc-600 group-hover:text-red-400 transition-colors" />
                                                            <span className="text-zinc-500 group-hover:text-zinc-300 text-sm">CLICK TO SELECT VIDEO</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            {isAddingVideo && uploadProgress > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-mono text-zinc-400">
                                                        <span>UPLOADING...</span>
                                                        <span>{Math.round(uploadProgress)}%</span>
                                                    </div>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {addError && (
                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono border-l-4 border-l-red-500">
                                            {'>'} ERROR: {addError}
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => setShowAddModal(false)}
                                            className="px-6 py-4 rounded-xl text-zinc-400 font-bold tracking-wide hover:text-white hover:bg-white/5 transition-colors uppercase text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={modalTab === 'youtube' ? handleAddVideo : handleUploadVideo}
                                            disabled={modalTab === 'youtube' ? !youtubeUrl.trim() || isAddingVideo : !uploadFile || !uploadTitle.trim() || isAddingVideo}
                                            className="flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold tracking-widest uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-2 py-4">
                                                {isAddingVideo ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>INITIALIZING...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                                        <span>{modalTab === 'youtube' ? 'IMPORT STREAM' : 'START UPLOAD'}</span>
                                                        <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
