/**
 * RoadmapAITutor - Floating AI tutor chat for roadmaps
 * 
 * A context-aware chat assistant that helps users learn from their roadmap.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2, MessageCircle } from 'lucide-react';
import { sendRoadmapChatMessage, getSuggestedQuestions } from '@/lib/roadmapApi';
import type { ChatMessage } from '@/lib/roadmapApi';

interface RoadmapAITutorProps {
    roadmapId: string;
    roadmapTitle: string;
}

export function RoadmapAITutor({ roadmapId, roadmapTitle }: RoadmapAITutorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load suggestions when panel opens
    useEffect(() => {
        if (isOpen && suggestions.length === 0) {
            loadSuggestions();
        }
    }, [isOpen]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const questions = await getSuggestedQuestions(roadmapId);
            setSuggestions(questions);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSend = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        // Add user message
        const userMessage: ChatMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendRoadmapChatMessage(
                roadmapId,
                text,
                messages
            );

            // Add assistant response
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.message
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed !fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full btn-primary text-white font-medium shadow-2xl hover:scale-105 transition-all"
                    >
                        <span>AI Tutor</span>
                        <span className="text-white/70">|</span>
                        <span className="text-sm text-white/80">Have a question?</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-2xl h-[500px] bg-[#0c0c14]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0c0c14]">
                            <div className="flex items-center gap-3">

                                <div>
                                    <h3 className="text-white font-semibold">AI Tutor</h3>
                                    <p className="text-xs text-white/50 truncate max-w-[200px]">{roadmapTitle}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Initial greeting */}
                            {messages.length === 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                            <MessageCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-white/5 rounded-xl rounded-tl-none p-4 max-w-[80%]">
                                            <p className="text-white/90">
                                                Hello! 👋 I'm your AI tutor for this roadmap. Ask me anything about the topics, learning order, or concepts you need help with.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Suggested Questions */}
                                    {loadingSuggestions ? (
                                        <div className="flex items-center gap-2 text-white/50 text-sm pl-11">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading suggestions...
                                        </div>
                                    ) : suggestions.length > 0 && (
                                        <div className="pl-11 space-y-2">
                                            <p className="text-white/50 text-sm">Try asking:</p>
                                            {suggestions.map((question, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSend(question)}
                                                    className="block w-full text-left px-4 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-white/80 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-sm"
                                                >
                                                    {question}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Chat Messages */}
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                        ? 'bg-white/10'
                                        : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <span className="text-xs font-bold text-white">You</span>
                                        ) : (
                                            <MessageCircle className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <div className={`rounded-xl p-4 max-w-[80%] ${msg.role === 'user'
                                        ? 'bg-cyan-500/20 rounded-tr-none'
                                        : 'bg-white/5 rounded-tl-none'
                                        }`}>
                                        <p className="text-white/90 whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    </div>
                                    <div className="bg-white/5 rounded-xl rounded-tl-none p-4">
                                        <p className="text-white/50">Thinking...</p>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-[#0c0c14]">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about this roadmap..."
                                    disabled={isLoading}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all disabled:opacity-50"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
