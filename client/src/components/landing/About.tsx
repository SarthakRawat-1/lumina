import { Github, Linkedin, Mail, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function About() {
    return (
        <section id="about" className="relative py-8 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">

                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        Built by <span className="gradient-text">Sarthak</span>
                    </h2>
                </div>

                {/* Profile - Animated Trail */}
                <div className="text-center">
                    <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
                        {/* Static Electric Blue Glow */}
                        <div className="absolute inset-0 bg-[#0EA5E9] rounded-full blur-2xl opacity-30" />



                        {/* Image container */}
                        <div className="w-32 h-32 rounded-full overflow-hidden relative border border-white/10 shadow-2xl z-10">
                            <img
                                src="/sarthak.jpg"
                                alt="Sarthak"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <p className="max-w-xl mx-auto text-lg text-muted-foreground mb-8 leading-relaxed">
                        Passionate about creating tools that make education accessible and engaging.
                        Building Lumina to revolutionize how people learn and grow.
                    </p>

                    {/* Social links */}
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg hover-glow-white hover:bg-transparent transition-colors"
                            asChild
                        >
                            <a href="https://github.com/SarthakRawat-1" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg hover-glow-white hover:bg-transparent transition-colors"
                            asChild
                        >
                            <a href="https://www.linkedin.com/in/sarthak-rawat24/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg hover-glow-white hover:bg-transparent transition-colors"
                            asChild
                        >
                            <a href="https://x.com/SarthakRawat_" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg hover-glow-white hover:bg-transparent transition-colors"
                            asChild
                        >
                            <a href="mailto:sarthakrawat525@gmail.com" aria-label="Email">
                                <Mail className="w-5 h-5" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
