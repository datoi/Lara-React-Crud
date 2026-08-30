import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { LayerOption } from '../../types/customizer';

interface OptionSwatchProps {
    option: LayerOption;
    isSelected: boolean;
    onSelect: () => void;
}

export default function OptionSwatch({ option, isSelected, onSelect }: OptionSwatchProps) {
    // Attribute options (fit, neckline, sleeves…) are labelled choices with no
    // artwork yet. They render as a text tile so the panel never shows a broken
    // image — dropping a photo in later turns the same option into a picture tile.
    const artwork = option.thumbnail_url;

    return (
        <motion.button
            onClick={onSelect}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            aria-pressed={isSelected}
            aria-label={`${option.name}${option.price_modifier !== 0 ? ` — ${option.price_modifier > 0 ? '+' : ''}₾${option.price_modifier}` : ''}`}
            className={[
                'relative flex cursor-pointer flex-col items-center gap-1.5 border p-2 transition-colors',
                artwork ? '' : 'min-h-[64px] justify-center px-3 py-3',
                isSelected
                    ? 'border-[#111111] bg-[#F2F1ED]'
                    : 'border-[#111111]/20 bg-transparent hover:border-[#111111]/60',
            ].join(' ')}
        >
            {/* Neutral warm-white background matches the canvas bg for real PNG layers */}
            {artwork && (
                <div className="relative aspect-square w-full overflow-hidden bg-[#F2F1ED]">
                    <img
                        src={artwork}
                        alt={option.name}
                        className="absolute inset-0 w-full h-full object-contain"
                    />
                </div>
            )}

            <span className="line-clamp-2 text-center text-xs font-medium leading-tight text-[#514843]">
                {option.name}
            </span>

            {option.price_modifier !== 0 && (
                <span className="text-[10px] text-slate-400">
                    {option.price_modifier > 0 ? '+' : ''}₾{option.price_modifier}
                </span>
            )}

            {/* Selected check badge */}
            {isSelected && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center bg-[#111111]">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
            )}
        </motion.button>
    );
}
