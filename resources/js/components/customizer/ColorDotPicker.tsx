import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { OptionColor } from '../../types/customizer';

interface ColorDotPickerProps {
    label: string;
    colors: OptionColor[];
    selectedId: number | undefined;
    onSelect: (colorId: number) => void;
}

/**
 * Colour swatches for the photographed garment.
 *
 * Square rather than round, with the colour inset behind a white frame, so they
 * read as fabric chips against the panel and sit square with everything else on
 * the page — the customizer has no rounded corners anywhere.
 */
export default function ColorDotPicker({ label, colors, selectedId, onSelect }: ColorDotPickerProps) {
    if (colors.length === 0) return null;

    const selected = colors.find(c => c.id === selectedId) ?? colors[0];

    return (
        <div>
            <div className="mb-3.5 flex items-baseline justify-between gap-4">
                <span className="font-serif text-[18px] font-semibold text-[#111111]">{label}</span>
                {selected && <span className="text-sm text-[#655D55]">{selected.name}</span>}
            </div>

            <div className="flex flex-wrap gap-2.5">
                {colors.map(color => {
                    const isSelected = color.id === selected?.id;
                    return (
                        <motion.button
                            key={color.id}
                            type="button"
                            onClick={() => onSelect(color.id)}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            aria-label={color.name}
                            aria-pressed={isSelected}
                            title={color.name}
                            className={[
                                'h-11 w-11 cursor-pointer bg-white p-[3px] transition-colors',
                                isSelected
                                    ? 'border border-[#111111]'
                                    : 'border border-[#111111]/[0.16] hover:border-[#111111]/60',
                            ].join(' ')}
                        >
                            <span
                                className="flex h-full w-full items-center justify-center"
                                style={{ backgroundColor: color.color_hex }}
                            >
                                {isSelected && (
                                    <Check
                                        className="h-[13px] w-[13px]"
                                        strokeWidth={3}
                                        style={{ color: isLight(color.color_hex) ? '#111111' : '#ffffff' }}
                                    />
                                )}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
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
