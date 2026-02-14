import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
    { label: 'Why Lumina', href: '#why-lumina' },
    { label: 'Features', href: '#features' },
    { label: 'The Creator', href: '#about' }, // Changed from About
    { label: 'Status', href: '#status' },
]

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className="fixed top-0 left-0 right-0 z-50">
            <div className="glass border-b border-border/30 px-6 py-3"> {/* Reduced py-4 to py-3 */}
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="Lumina Logo" className="h-10 w-auto object-contain" /> {/* Reduced from h-16 to h-10 */}
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm text-muted-foreground hover-glow-white transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" className="text-sm hover-glow-white hover:bg-transparent" asChild>
                            <Link to="/login">Sign In</Link>
                        </Button>
                        <Button className="btn-primary rounded-xl px-6" asChild>
                            <Link to="/register">Get Started</Link>
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden glass border-b border-border/30 p-6 animate-reveal">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-lg text-muted-foreground hover-glow-white transition-colors py-2"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                        <hr className="border-border/50 my-2" />
                        <Button variant="ghost" className="justify-start" asChild>
                            <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                        </Button>
                        <Button className="btn-primary rounded-full" asChild>
                            <Link to="/register" onClick={() => setIsOpen(false)}>Get Started</Link>
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    )
}

