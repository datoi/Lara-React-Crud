/**
 * ColorDotPicker — round colour swatches for a style's colour variants.
 * Clicking a dot swaps the garment photos in the preview canvas.
 * Mirrors FabricPicker's dot styling.
 */
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { OptionColor } from '../../types/customizer';

interface ColorDotPickerProps {
    label: string;
    colors: OptionColor[];
    selectedId: number | undefined;
    onSelect: (colorId: number) => void;
}

export default function ColorDotPicker({ label, colors, selectedId, onSelect }: ColorDotPickerProps) {
    const selected = colors.find(c => c.id === selectedId);

    return (
        <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {label}
            </p>
            <div className="flex flex-wrap gap-2">
                {colors.map(color => {
                    const isSelected = color.id === selectedId;
                    return (
                        <motion.button
                            key={color.id}
                            onClick={() => onSelect(color.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            aria-label={color.name}
                            aria-pressed={isSelected}
                            title={color.name}
                            className="relative w-9 h-9 rounded-full border-2 transition-all"
                            style={{
                                backgroundColor: color.color_hex,
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
                                        color: isLight(color.color_hex) ? '#0f172a' : '#ffffff',
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
