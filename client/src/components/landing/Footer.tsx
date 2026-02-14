import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

const footerLinks = {
    Product: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Changelog', href: '/changelog' },
        { label: 'Roadmap', href: '/roadmap' },
    ],
    Resources: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/api' },
        { label: 'Tutorials', href: '/tutorials' },
        { label: 'Blog', href: '/blog' },
    ],
    Company: [
        { label: 'About', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
        { label: 'Press Kit', href: '/press' },
    ],
    Legal: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Cookies', href: '/cookies' },
    ],
}

const socialLinks = [
    { icon: Github, href: 'https://github.com/SarthakRawat-1', label: 'GitHub' },
    { icon: Twitter, href: 'https://x.com/SarthakRawat_', label: 'Twitter' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/sarthak-rawat24/', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:sarthakrawat525@gmail.com', label: 'Email' },
]

export function Footer() {
    return (
        <footer className="relative py-16 px-6 border-t border-border/50">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
                    {/* Brand column */}
                    <div className="col-span-2">
                        <a href="/" className="flex items-center gap-3 mb-4">
                            <img src="/logo.png" alt="Lumina Logo" className="h-12 w-auto object-contain" />
                        </a>
                        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                            Illuminating the path to knowledge. Learn smarter, not harder.
                        </p>
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social) => {
                                const Icon = social.icon
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        aria-label={social.label}
                                        className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                )
                            })}
                        </div>
                    </div>

                    {/* Links columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="font-semibold mb-4">{category}</h4>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Lumina. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Privacy Policy
                        </a>
                        <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
