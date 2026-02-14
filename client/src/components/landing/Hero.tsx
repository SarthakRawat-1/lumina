import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
            <div className="max-w-5xl mx-auto text-center">

                {/* Main headline - unique stacked typography */}
                <div className="space-y-2 mb-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight py-4">
                        <span className="block text-foreground glow-top">Where</span>
                        <span className="block text-shine">
                            <span className="glow-point">K</span>nowledg<span className="glow-point">e</span>
                        </span>
                        <span className="block text-foreground glow-bottom">Illuminates</span>
                    </h1>
                </div>

                {/* Subheadline */}
                <p
                    className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-12 animate-reveal"
                    style={{ animationDelay: '0.4s' }}
                >
                    Six powerful tools, one unified platform. Generate AI courses,
                    visualize learning roadmaps, create and learn from videos, discover
                    jobs, and collaborate in real-time—all designed for the modern learner.
                </p>

                {/* CTA Buttons - unique pill style */}
                <div
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-reveal"
                    style={{ animationDelay: '0.6s' }}
                >
                    <Button
                        size="lg"
                        className="btn-primary px-8 py-6 text-lg rounded-xl font-medium"
                    >
                        Start Learning Free
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button
                        size="lg"
                        className="btn-demo px-8 py-6 text-lg rounded-xl font-medium"
                        onClick={() => window.open("https://vimeo.com/1160817143?share=copy", "_blank")}
                    >
                        Watch Demo
                    </Button>
                </div>

            </div>
        </section>
    )
}
