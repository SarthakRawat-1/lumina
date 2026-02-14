/**
 * NodeDetailsDrawer - Slide-out panel showing node learning details
 * 
 * Displays description, key concepts, resources, and progress controls.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Check, Clock, SkipForward, Loader2 } from 'lucide-react';
import type { NodeDetails } from '@/lib/roadmapApi';


interface NodeDetailsDrawerProps {
    isOpen: boolean;
    nodeDetails: NodeDetails | null;
    isLoading: boolean;
    currentStatus?: 'pending' | 'in_progress' | 'completed' | 'skipped';
    onClose: () => void;
    onStatusChange: (status: 'in_progress' | 'completed' | 'skipped') => void;
}

import { createPortal } from 'react-dom';

export function NodeDetailsDrawer({
    isOpen,
    nodeDetails,
    isLoading,
    currentStatus = 'pending',
    onClose,
    onStatusChange,
}: NodeDetailsDrawerProps) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{ right: 0 }}
                        className="fixed top-0 bottom-0 h-screen w-full max-w-lg bg-[#0c0c14]/95 backdrop-blur-xl border-l border-white/10 z-[9999] overflow-y-auto shadow-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-[#0c0c14]/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-semibold text-white">
                                {isLoading ? 'Loading...' : nodeDetails?.title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                                    <p className="text-white/60">Generating content...</p>
                                </div>
                            ) : nodeDetails ? (
                                <>
                                    {/* Time Estimate */}
                                    <div className="flex items-center gap-2 text-sm text-white/60">
                                        <Clock className="w-4 h-4" />
                                        <span>Estimated time: {nodeDetails.estimated_time}</span>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wide">
                                            About
                                        </h3>
                                        <p className="text-white/80 leading-relaxed">
                                            {nodeDetails.description}
                                        </p>
                                    </div>

                                    {/* Key Concepts */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wide">
                                            Key Concepts
                                        </h3>
                                        <ul className="space-y-2">
                                            {nodeDetails.key_concepts.map((concept, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-start gap-2 text-white/80"
                                                >
                                                    <span className="text-cyan-400 mt-1">•</span>
                                                    <span>{concept}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Resources */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wide">
                                            Learning Resources
                                        </h3>
                                        <div className="space-y-2">
                                            {nodeDetails.resources.map((resource, index) => (
                                                <a
                                                    key={index}
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                                                >
                                                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                                                        {resource.type}
                                                    </span>
                                                    <span className="flex-1 text-white/80 group-hover:text-white">
                                                        {resource.title}
                                                    </span>
                                                    <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Progress Buttons */}
                                    <div className="pt-4 border-t border-white/10 space-y-3">
                                        <h3 className="text-sm font-medium text-white/60">
                                            Update Progress
                                        </h3>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => onStatusChange('in_progress')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold tracking-widest uppercase text-xs transition-all duration-300 ${currentStatus === 'in_progress'
                                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105'
                                                    : 'bg-zinc-800/50 text-zinc-500 border border-white/5 hover:bg-zinc-800 hover:text-zinc-400'
                                                    }`}
                                            >
                                                <Clock className={`w-4 h-4 ${currentStatus === 'in_progress' ? 'text-black' : 'text-zinc-600'}`} />
                                                In Progress
                                            </button>

                                            <button
                                                onClick={() => onStatusChange('completed')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold tracking-widest uppercase text-xs transition-all duration-300 ${currentStatus === 'completed'
                                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-105'
                                                    : 'bg-zinc-800/50 text-zinc-500 border border-white/5 hover:bg-zinc-800 hover:text-zinc-400'
                                                    }`}
                                            >
                                                <Check className={`w-4 h-4 ${currentStatus === 'completed' ? 'text-white' : 'text-zinc-600'}`} />
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-white/40">
                                    Select a node to view details
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
