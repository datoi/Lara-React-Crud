import { motion } from 'motion/react';
import type { LayerCategory } from '../../types/customizer';

interface CategoryTabsProps {
    categories: LayerCategory[];
    activeId: number | null;
    onSelect: (id: number) => void;
}

export default function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
    return (
        <div
            className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide"
            role="tablist"
            aria-label="Customization categories"
        >
            {categories.map(cat => {
                const isActive = cat.id === activeId;
                return (
                    <button
                        key={cat.id}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${cat.id}`}
                        onClick={() => onSelect(cat.id)}
                        className={[
                            'relative shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                            isActive
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
                        ].join(' ')}
                    >
                        {cat.name}
                        {isActive && (
                            <motion.span
                                layoutId="tab-indicator"
                                className="absolute inset-0 rounded-lg bg-slate-900 -z-10"
                                transition={{ duration: 0.25 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
