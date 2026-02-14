import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Clock, Search, ArrowRight, Loader2, Calendar } from "lucide-react";
import { documentsApi, type DocumentMeta } from "@/lib/documentsApi";

export default function NotesPage() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<DocumentMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadNotes();
    }, []);

    // Creator Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateNote = async () => {
        if (!newNoteTitle.trim()) return;
        setIsCreating(true);
        // Simulate checking or just navigate
        // In this app, it seems we just navigate to /app/:slug
        // and the doc is created on the fly or exists.
        // Waiting a bit for effect
        await new Promise(resolve => setTimeout(resolve, 500));
        // Replace whitespaces with hyphens for the URL
        const noteSlug = newNoteTitle.trim().replace(/\s+/g, '-');
        navigate(`/notes/${noteSlug}`);
        setIsCreating(false);
        setShowCreateModal(false);
    };

    const loadNotes = async () => {
        try {
            setIsLoading(true);
            const data = await documentsApi.getAll();
            setNotes(data || []);
        } catch (error) {
            console.error("Failed to load notes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="relative min-h-screen bg-[#121212] overflow-y-auto font-outfit text-white">
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

            <div className="relative z-10 w-full min-h-screen flex flex-col p-8 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6"
                >
                    <div>
                        <h1 className="text-5xl font-bold text-white mb-2">
                            My Notes
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Collaborative workspaces for your thoughts and research.
                        </p>
                    </div>
                </motion.div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center py-40">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* 1. Existing Notes */}
                        <AnimatePresence mode="popLayout">
                            {notes.map((note, index) => (
                                <motion.div
                                    key={note.name}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => navigate(`/notes/${note.name}`)}
                                    className="group relative h-full min-h-[300px] bg-[#18181B] border border-white/5 rounded-2xl flex flex-col overflow-hidden cursor-pointer hover:border-amber-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20"
                                >
                                    {/* Visual Top Section */}
                                    <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden group-hover:brightness-110 transition-all">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <FileText className="w-16 h-16 text-zinc-600 group-hover:text-amber-500/80 transition-colors duration-300" />

                                        {/* View Overlay */}

                                    </div>

                                    {/* Info Section */}
                                    <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                        <h3 className="text-white font-semibold text-xl line-clamp-1 group-hover:text-amber-400 transition-colors mb-2">
                                            {note.name}
                                        </h3>

                                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 mt-auto pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-1.5 font-sans">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDate(note.updatedAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-sans ml-auto">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Edited recently</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* 2. "Start New Note" Card */}
                        <motion.button
                            layout
                            onClick={() => setShowCreateModal(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative h-full min-h-[300px] bg-[#18181B] border-2 border-dashed border-white/10 hover:border-amber-500/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 text-left"
                        >
                            <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 group-hover:bg-amber-600 group-hover:border-amber-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-amber">
                                    <Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-amber-400 transition-colors">Start New Note</h3>
                                <p className="text-sm text-zinc-500">Create an interactive workspace</p>
                            </div>
                        </motion.button>

                        {/* 3. Ghost Slots */}
                        {notes.length === 0 && (
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
                            </>
                        )}
                    </motion.div>
                )}
                {/* Create Note Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                            onClick={() => setShowCreateModal(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-lg p-8 rounded-2xl bg-[#18181B] border-2 border-white/5 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden relative"
                            >
                                {/* Decorative Top Line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-50" />

                                <div className="flex flex-col gap-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white tracking-tight uppercase mb-1">CREATE NEW NOTE</h2>
                                        <p className="text-zinc-500 text-sm font-medium tracking-wide">START A NEW DOCUMENT</p>
                                    </div>

                                    {/* Inputs */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">NOTE TITLE</label>
                                            <input
                                                type="text"
                                                value={newNoteTitle}
                                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
                                                placeholder="e.g. Project Alpha Documentation"
                                                className="w-full px-4 py-3 rounded-xl bg-[#09090b] border-2 border-white/5 text-white placeholder:text-zinc-700 outline-none focus:border-amber-500/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => setShowCreateModal(false)}
                                                className="px-6 py-4 rounded-xl text-zinc-400 font-bold tracking-wide hover:text-white hover:bg-white/5 transition-colors uppercase text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleCreateNote}
                                                disabled={!newNoteTitle.trim() || isCreating}
                                                className="flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold tracking-widest uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300"
                                            >
                                                <div className="relative z-10 flex items-center justify-center gap-2 py-4">
                                                    {isCreating ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>INITIALIZING...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                                            <span>CREATE NOTE</span>
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
            </div>
        </div>
    );
}
