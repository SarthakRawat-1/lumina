import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Youtube,
    FileText,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Search
} from 'lucide-react';
import { courseApi } from '@/lib/courseApi';

interface UploadMaterialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    onUploadComplete?: () => void;
}

type InputMode = 'file' | 'youtube';

export function UploadMaterialsModal({
    isOpen,
    onClose,
    courseId,
    onUploadComplete
}: UploadMaterialsModalProps) {
    const [inputMode, setInputMode] = useState<InputMode>('file');
    const [file, setFile] = useState<File | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setPreview(null);
            setResult(null);
        }
    };

    const handlePreview = async () => {
        if (inputMode === 'file' && !file) return;
        if (inputMode === 'youtube' && !youtubeUrl) return;

        setIsProcessing(true);
        setError(null);

        try {
            if (inputMode === 'file' && file) {
                const response = await courseApi.previewMaterialUpload(courseId, file);
                setPreview(response);
            }
            // YouTube doesn't have separate preview, just show URL validation
            if (inputMode === 'youtube') {
                setPreview({ summary: `Ready to process: ${youtubeUrl}`, new_topics: [] });
            }
        } catch (err) {
            setError('Failed to preview material. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpload = async () => {
        if (inputMode === 'file' && !file) return;
        if (inputMode === 'youtube' && !youtubeUrl) return;

        setIsProcessing(true);
        setError(null);

        try {
            let response;
            if (inputMode === 'file' && file) {
                response = await courseApi.uploadMaterial(courseId, file);
            } else if (inputMode === 'youtube') {
                response = await courseApi.processYouTubeUrl(courseId, youtubeUrl);
            }
            setResult(response);
            onUploadComplete?.();
        } catch (err) {
            setError('Failed to process material. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const acceptedTypes = ".pdf,.mp4,.mov,.avi,.webm";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-[#18181B] border-2 border-white/5 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden"
                    >
                        {/* Decorative Top Line - Green Gradient for Course Context */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 opacity-80" />

                        <div className="p-8 flex flex-col gap-6">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight uppercase mb-1">
                                        ADD MATERIAL
                                    </h2>
                                    <p className="text-zinc-500 text-sm font-medium tracking-wide">
                                        EXPAND YOUR KNOWLEDGE GRAPH
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Mode Selection */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">SOURCE TYPE</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { setInputMode('file'); setError(null); setPreview(null); setResult(null); }}
                                        className={`relative group bg-[#09090b] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${inputMode === 'file'
                                            ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                            : 'border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <Upload className={`w-5 h-5 ${inputMode === 'file' ? 'text-emerald-500' : 'text-zinc-500'}`} />
                                        <span className={`text-xs font-bold tracking-wider ${inputMode === 'file' ? 'text-white' : 'text-zinc-500'}`}>UPLOAD FILE</span>
                                    </button>

                                    <button
                                        onClick={() => { setInputMode('youtube'); setError(null); setPreview(null); setResult(null); }}
                                        className={`relative group bg-[#09090b] border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${inputMode === 'youtube'
                                            ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                            : 'border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <Youtube className={`w-5 h-5 ${inputMode === 'youtube' ? 'text-emerald-500' : 'text-zinc-500'}`} />
                                        <span className={`text-xs font-bold tracking-wider ${inputMode === 'youtube' ? 'text-white' : 'text-zinc-500'}`}>YOUTUBE URL</span>
                                    </button>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="min-h-[160px]">
                                <AnimatePresence mode="wait">
                                    {inputMode === 'file' ? (
                                        <motion.div
                                            key="file"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-4"
                                        >
                                            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group text-center cursor-pointer relative">
                                                <input
                                                    type="file"
                                                    accept={acceptedTypes}
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                                    <FileText className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400" />
                                                </div>
                                                <p className="text-white font-medium mb-1">
                                                    {file ? file.name : "Click to browse or drag file"}
                                                </p>
                                                <p className="text-xs text-zinc-500 uppercase tracking-wider">
                                                    PDF, MP4, MOV, AVI, WEBM
                                                </p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="youtube"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">
                                                VIDEO URL
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="url"
                                                    value={youtubeUrl}
                                                    onChange={(e) => { setYoutubeUrl(e.target.value); setError(null); setPreview(null); setResult(null); }}
                                                    placeholder="https://youtube.com/watch?v=..."
                                                    className="w-full pl-4 pr-4 py-3 rounded-xl bg-[#09090b] border-2 border-white/5 text-white placeholder:text-zinc-700 outline-none focus:border-emerald-500/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-emerald-400 mt-3 font-medium flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3 h-3" />
                                                USES YOUTUBE CAPTIONS FOR TRANSCRIPTION
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Status Messages */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {preview && !result && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                                >
                                    <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Search className="w-3 h-3" />
                                        Analysis Preview
                                    </h3>
                                    <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
                                        {preview.summary}
                                    </p>
                                    {preview.new_topics?.length > 0 && (
                                        <div className="space-y-1">
                                            {preview.new_topics.slice(0, 3).map((topic: any, i: number) => (
                                                <div key={i} className="text-xs text-zinc-500 flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                    {topic.title}
                                                </div>
                                            ))}
                                            {preview.new_topics.length > 3 && (
                                                <div className="text-xs text-zinc-600 pl-3">
                                                    + {preview.new_topics.length - 3} more topics
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {result && result.success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="text-white font-bold mb-1">Success!</h3>
                                    <p className="text-sm text-zinc-400">
                                        Added <span className="text-emerald-400 font-bold">{result.new_nodes_count}</span> new topics to your course.
                                    </p>
                                </motion.div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                {result?.success ? (
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold tracking-widest uppercase text-sm hover:bg-emerald-500 transition-colors"
                                    >
                                        Done
                                    </button>
                                ) : (
                                    <>
                                        {inputMode === 'file' && (
                                            <button
                                                onClick={handlePreview}
                                                disabled={!file || isProcessing}
                                                className="px-6 py-4 rounded-xl text-zinc-400 font-bold tracking-wide hover:text-white hover:bg-white/5 transition-colors uppercase text-sm disabled:opacity-50"
                                            >
                                                {isProcessing ? 'Analyzing...' : 'Preview'}
                                            </button>
                                        )}
                                        <button
                                            onClick={handleUpload}
                                            disabled={(inputMode === 'file' && !file) || (inputMode === 'youtube' && !youtubeUrl) || isProcessing}
                                            className="flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold tracking-widest uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-2 py-4">
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>PROCESSING...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {inputMode === 'youtube' ? 'PROCESS VIDEO' : 'UPLOAD & EXPAND'}
                                                        <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
