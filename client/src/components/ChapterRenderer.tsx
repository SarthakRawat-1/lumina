import type { ContentSection } from '@/types';
import AiCodeWrapper from './AiCodeWrapper';

interface ChapterRendererProps {
    sections: ContentSection[];
}

export default function ChapterRenderer({ sections }: ChapterRendererProps) {
    return (
        <div className="space-y-12">
            {sections.map((section, index) => (
                <Section key={index} section={section} />
            ))}
        </div>
    );
}

function Section({ section }: { section: ContentSection }) {
    const sectionStyles: Record<string, string> = {
        introduction: 'border-l-4 border-emerald-500 pl-6',
        concept: '',
        case_study: 'bg-zinc-900/50 rounded-2xl p-6 border border-white/5',
        summary: 'bg-emerald-950/30 rounded-2xl p-6 border border-emerald-500/20',
    };

    const titleStyles: Record<string, string> = {
        introduction: 'text-3xl font-bold text-white mb-4',
        concept: 'text-2xl font-bold text-white mb-4',
        case_study: 'text-xl font-semibold text-amber-400 mb-4',
        summary: 'text-xl font-semibold text-emerald-400 mb-4',
    };

    return (
        <div className={sectionStyles[section.section_type] || ''}>
            <h2 className={titleStyles[section.section_type] || 'text-2xl font-bold text-white mb-4'}>
                {section.title}
            </h2>

            {/* Paragraphs */}
            <div className="space-y-4">
                {section.paragraphs.map((paragraph, idx) => (
                    <p key={idx} className="text-zinc-300 text-lg leading-relaxed">
                        {paragraph}
                    </p>
                ))}
            </div>

            {/* Diagram */}
            {section.diagram_code && (
                <div className="my-6 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                    <div className="bg-white/5 p-4">
                        <h3 className="text-lg font-semibold text-emerald-400 mb-2">Interactive Diagram</h3>
                    </div>
                    <div className="p-4">
                        <AiCodeWrapper>
                            {section.diagram_code}
                        </AiCodeWrapper>
                    </div>
                </div>
            )}

            {/* Image */}
            {section.image_url && (
                <div className="my-6 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                    <img
                        src={section.image_url}
                        alt={section.title}
                        className="w-full h-auto object-cover"
                    />
                </div>
            )}

            {/* Bullet Points */}
            {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-4 space-y-2 list-none">
                    {section.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-zinc-300">
                            <span className="w-2 h-2 mt-2.5 bg-emerald-500 rounded-full flex-shrink-0" />
                            <span className="text-lg leading-relaxed">{bullet}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Pro Tip */}
            {section.tip && (
                <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">Pro Tip</span>
                    </div>
                    <p className="mt-2 text-amber-200/80 leading-relaxed">{section.tip}</p>
                </div>
            )}
        </div>
    );
}
