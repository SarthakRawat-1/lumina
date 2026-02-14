import { Upload, Sparkles, BookOpen, Trophy } from 'lucide-react'

const steps = [
    {
        number: '01',
        icon: Upload,
        title: 'Upload Anything',
        description: 'Drop your documents, videos, or notes. We handle PDFs, videos, images, and plain text.',
    },
    {
        number: '02',
        icon: Sparkles,
        title: 'AI Transforms',
        description: 'Our AI extracts key concepts, builds connections, and generates study materials automatically.',
    },
    {
        number: '03',
        icon: BookOpen,
        title: 'Learn Your Way',
        description: 'Explore knowledge graphs, take adaptive quizzes, or collaborate with peers in real-time.',
    },
    {
        number: '04',
        icon: Trophy,
        title: 'Master Skills',
        description: 'Track your progress, earn achievements, and build a portfolio of verified skills.',
    },
]

export function HowItWorks() {
    return (
        <section id="how-it-works" className="relative py-32 px-6">
            {/* Background accent */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-lumina-purple/10 via-lumina-blue/10 to-lumina-teal/10 blur-3xl rounded-full" />
            </div>

            <div className="relative max-w-6xl mx-auto">
                {/* Section header */}
                <div className="text-center mb-20">
                    <span className="inline-block px-4 py-1 mb-4 text-sm font-medium rounded-full bg-secondary/10 text-secondary">
                        How It Works
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                        From content to <span className="gradient-text">mastery</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                        Four simple steps to transform how you learn forever.
                    </p>
                </div>

                {/* Steps - unique connected layout */}
                <div className="relative">
                    {/* Connecting line */}
                    <div className="hidden lg:block absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon
                            return (
                                <div key={step.number} className="relative text-center lg:text-left">
                                    {/* Step number - floating */}
                                    <div className="inline-flex items-center justify-center w-12 h-12 mb-6 rounded-full glass glow-purple">
                                        <span className="text-sm font-bold gradient-text">{step.number}</span>
                                    </div>

                                    {/* Icon */}
                                    <div className="mb-4">
                                        <Icon className="w-8 h-8 text-muted-foreground mx-auto lg:mx-0" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-semibold mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {step.description}
                                    </p>

                                    {/* Connector dot for desktop */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:block absolute top-24 right-0 translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
