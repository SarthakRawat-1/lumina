import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { WhyLumina } from '@/components/landing/WhyLumina'
import { About } from '@/components/landing/About'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { SystemStatus } from '@/components/landing/SystemStatus'

export default function LandingPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            {/* Noise texture overlay */}
            <div className="noise-overlay" />

            {/* Unique gradient mesh background - REMOVED */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
            </div>

            {/* Content */}
            <div className="relative z-10">
                <Navbar />
                <main>
                    <Hero />
                    <WhyLumina />
                    <Features />
                    <About />
                    <SystemStatus />
                </main>
                <Footer />
            </div>
        </div>
    )
}
