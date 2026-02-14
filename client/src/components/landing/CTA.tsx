import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTA() {
    return (
        <section className="relative py-32 px-6">
            <div className="max-w-4xl mx-auto text-center">
                {/* Decorative elements */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-r from-lumina-purple/20 via-lumina-blue/20 to-lumina-teal/20 blur-3xl" />
                </div>

                <div className="relative">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass">
                        <Sparkles className="w-4 h-4 text-lumina-purple" />
                        <span className="text-sm text-muted-foreground">
                            Free to start, upgrade anytime
                        </span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-4xl sm:text-6xl font-bold mb-6">
                        Ready to <span className="gradient-text">illuminate</span>
                        <br />your learning journey?
                    </h2>

                    <p className="max-w-xl mx-auto text-lg text-muted-foreground mb-10">
                        Join thousands of learners who have transformed how they acquire
                        knowledge. Start building your personal learning ecosystem today.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            className="btn-primary px-10 py-7 text-lg rounded-full font-medium glow-purple"
                        >
                            Get Started Free
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="px-10 py-7 text-lg rounded-full border-border/50 hover:bg-muted/50"
                        >
                            Schedule a Demo
                        </Button>
                    </div>

                    {/* Trust note */}
                    <p className="mt-8 text-sm text-muted-foreground">
                        No credit card required · Free forever plan available
                    </p>
                </div>
            </div>
        </section>
    )
}
