import { motion } from 'framer-motion'

// Layout constants
const HEX_WIDTH = 250;
const HEX_HEIGHT = 290; // Approx 250 * 1.15
const GAP = 15;
const VERTICAL_OFFSET = HEX_HEIGHT * 0.75 + GAP;
const HORIZONTAL_OFFSET = HEX_WIDTH / 2 + GAP;

const features = [
    {
        title: 'Live AI Interview',
        details: ['Performance Analysis', 'Real-time feedback', 'Interactive Agent'],
        position: { top: 30, left: 160 },
        // Violet: Dark -> Light -> Dark
        gradient: 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 50%, #7C3AED 100%)',
        trailColor: '#7C3AED',
    },
    {
        title: 'Job Discovery',
        details: ['6-Agent Pipeline', 'Market Analysis', 'Resume Scoring'],
        position: { top: VERTICAL_OFFSET + 30, left: 160 - HORIZONTAL_OFFSET },
        // Blue: Dark -> Light -> Dark (Matches Primary Button)
        gradient: 'linear-gradient(90deg, #0284C7 0%, #60A5FA 50%, #0284C7 100%)',
        trailColor: '#0284C7',
    },
    {
        title: 'Generative Courses',
        details: ['Interactive Content', 'Courses Expansion', 'Multi-modal Learning'],
        position: { top: VERTICAL_OFFSET + 30, left: 160 + HORIZONTAL_OFFSET },
        // Mint: Dark -> Light -> Dark
        gradient: 'linear-gradient(90deg, #059669 0%, #34D399 50%, #059669 100%)',
        trailColor: '#059669',
    },
    {
        title: 'Career Roadmaps',
        details: ['Dependency Graphs', 'Skill Visualization', 'Resource Linking'],
        position: { top: (VERTICAL_OFFSET * 2) + 30, left: 160 },
        // Teal: Dark -> Light -> Dark
        gradient: 'linear-gradient(90deg, #0D9488 0%, #2DD4BF 50%, #0D9488 100%)',
        trailColor: '#0D9488',
    },
    {
        title: 'Video Intelligence',
        details: ['Text-to-Video', 'Chat with YouTube', 'Socratic Tutor'],
        position: { top: 30, left: 160 + HEX_WIDTH + GAP },
        // Amber: Dark -> Light -> Dark
        gradient: 'linear-gradient(90deg, #D97706 0%, #FBBF24 50%, #D97706 100%)',
        trailColor: '#D97706',
    },
    {
        title: 'Collaborative Notes',
        details: ['Real-time Sync', 'Rich Media Plugins', 'Export Options'],
        position: { top: (VERTICAL_OFFSET * 2) + 30, left: 160 + HORIZONTAL_OFFSET + HORIZONTAL_OFFSET },
        // Red: Dark -> Light -> Dark (Matches Secondary Button)
        gradient: 'linear-gradient(90deg, #DC2626 0%, #F87171 50%, #DC2626 100%)',
        trailColor: '#DC2626',
    },
]

// Hexagon Path for SVG
const hexPath = "M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z";

export function Features() {
    const containerHeight = VERTICAL_OFFSET * 2 + HEX_HEIGHT + 100;

    return (
        <section id="features" className="relative py-8 px-6 overflow-hidden">
            {/* Background Mesh */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 2px, transparent 2px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

                    {/* Left - New Hexagon Grid Layout */}
                    <div className="relative w-full lg:w-1/2 flex justify-center lg:justify-start">
                        <div
                            className="relative w-[600px] scale-90 sm:scale-100 origin-top-left transition-transform duration-500"
                            style={{ height: `${containerHeight}px` }}
                        >
                            {features.map((feature, index) => {
                                return (
                                    <div
                                        key={feature.title}
                                        className="absolute group cursor-pointer transition-all duration-500 ease-out hover:z-50"
                                        style={{
                                            width: `${HEX_WIDTH}px`,
                                            height: `${HEX_HEIGHT}px`,
                                            top: `${feature.position.top}px`,
                                            left: `${feature.position.left}px`,
                                            zIndex: index === 3 ? 40 : index === 0 ? 10 : 20,
                                        }}
                                    >
                                        <div
                                            className="w-full h-full relative transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2"
                                            style={{
                                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                                filter: `drop-shadow(0px 10px 20px rgba(0,0,0,0.3))`,
                                            }}
                                        >
                                            {/* 
                                                Solid Gradient Base 
                                                Directly uses the vivid symmetrical gradient.
                                            */}
                                            <div
                                                className="absolute inset-0 transition-all duration-300"
                                                style={{
                                                    background: feature.gradient,
                                                }}
                                            />

                                            {/* 
                                                Glass Shine Overlay 
                                                Adds a premium glossy finish like the buttons.
                                            */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                                            {/* 
                                                Hover Glow Overlay
                                                Brighter on hover.
                                            */}
                                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />

                                            {/* Content */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white z-10">
                                                {/* Large Title */}
                                                <h3 className="text-3xl font-black mb-6 tracking-tight leading-none drop-shadow-md">
                                                    {feature.title.split(' ').map((word, i) => (
                                                        <span key={i} className="block">{word}</span>
                                                    ))}
                                                </h3>

                                                {/* Bullets */}
                                                <div className="space-y-2">
                                                    {feature.details.map((detail, i) => (
                                                        <p key={i} className="text-sm font-bold text-white/90 flex items-center justify-center gap-2 drop-shadow-sm">
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                                                            />
                                                            {detail}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right side - Text content */}
                    <div className="w-full lg:w-1/2 text-center lg:text-left pt-12 lg:pt-0">

                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight animate-reveal" style={{ animationDelay: '0.1s' }}>
                            Seven tools, <br /><span className="gradient-text">One ecosystem</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 animate-reveal" style={{ animationDelay: '0.2s' }}>
                            Lumina unifies the fragmented education stack. Knowledge management, course creation, collaboration, and video intelligence—all connected.
                        </p>

                        <div className="space-y-6 animate-reveal" style={{ animationDelay: '0.3s' }}>
                            {/* Removed Why Lumina block as requested previously */}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
