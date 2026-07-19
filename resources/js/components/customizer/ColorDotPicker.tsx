/**
 * ColorDotPicker — round colour swatches for a layer category whose options
 * all carry a color_hex. Rendered under the preview canvas; clicking a dot
 * swaps the garment photo. Mirrors FabricPicker's dot styling.
 */
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { LayerCategory } from '../../types/customizer';

interface ColorDotPickerProps {
    category: LayerCategory;
    selectedId: number | undefined;
    onSelect: (optionId: number) => void;
}

export default function ColorDotPicker({ category, selectedId, onSelect }: ColorDotPickerProps) {
    const selected = category.options.find(o => o.id === selectedId);

    return (
        <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {category.name}
            </p>
            <div className="flex flex-wrap gap-2">
                {category.options.map(option => {
                    const isSelected = option.id === selectedId;
                    return (
                        <motion.button
                            key={option.id}
                            onClick={() => onSelect(option.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            aria-label={option.name}
                            aria-pressed={isSelected}
                            title={option.name}
                            className="relative w-9 h-9 rounded-full border-2 transition-all"
                            style={{
                                backgroundColor: option.color_hex ?? '#ffffff',
                                borderColor: isSelected ? '#0f172a' : '#e2e8f0',
                                boxShadow: isSelected
                                    ? '0 0 0 2px white, 0 0 0 4px #0f172a'
                                    : undefined,
                            }}
                        >
                            {isSelected && (
                                <Check
                                    className="absolute inset-0 m-auto w-4 h-4"
                                    style={{
                                        color: isLight(option.color_hex ?? '#ffffff') ? '#0f172a' : '#ffffff',
                                    }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {selected && (
                <p className="text-xs text-slate-400 mt-2">{selected.name}</p>
            )}
        </div>
    );
}

function isLight(hex: string): boolean {
    const clean = hex.replace('#', '');
    if (clean.length < 6) return true;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
