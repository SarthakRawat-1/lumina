import { AlertCircle, CheckCircle2, Lock } from 'lucide-react'

export function SystemStatus() {
    return (
        <section id="status" className="relative py-24 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 animate-reveal">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        Deployed Project <span className="gradient-text">Status</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
                        Generation latency is expected due to deep synthesis steps involving multiple LLM calls and RAG retrieval.
                    </p>
                </div>

                {/* Status Lists - Simplified Layout */}
                <div className="grid md:grid-cols-2 gap-12 lg:gap-24">

                    {/* Live Features Column */}
                    <div className="space-y-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                            <h3 className="text-xl font-bold text-emerald-400">Live & Operational</h3>
                            <span className="relative flex h-2 w-2 ml-auto">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        </div>

                        <ul className="space-y-4">
                            {[
                                'Course Generation',
                                'Flashcards AI',
                                'Smart Slides',
                                'Contextual Chat',
                                'Dynamic Roadmaps',
                                'Content Summaries'
                            ].map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-muted-foreground">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Restricted Mode Column */}
                    <div className="space-y-8 animate-reveal" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                            <h3 className="text-xl font-bold text-amber-400">Restricted Features</h3>
                            <Lock className="w-4 h-4 text-amber-500 ml-auto" />
                        </div>

                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    <span className="text-amber-400 font-medium">Cost Control:</span> High-compute features are currently disabled for the public demo.
                                </p>
                            </div>
                        </div>

                        <ul className="space-y-4">
                            {[
                                { name: 'Job Search', label: 'ATS Feeds Only' },
                                { name: 'Video Generation', label: 'Vertex AI Paused' },
                                { name: 'Collaborative Notes', label: 'Port Restricted' }
                            ].map((feature) => (
                                <li key={feature.name} className="flex items-start gap-3 text-muted-foreground/60">
                                    <Lock className="w-5 h-5 text-amber-500/50 flex-shrink-0 mt-0.5" />
                                    <span className="line-through decoration-amber-500/30">{feature.name}</span>
                                    <span className="text-xs text-amber-500/70 border border-amber-500/20 px-2 py-0.5 rounded ml-auto">
                                        {feature.label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    )
}
