import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { LayerOption } from '../../types/customizer';

interface OptionSwatchProps {
    option: LayerOption;
    isSelected: boolean;
    onSelect: () => void;
}

export default function OptionSwatch({ option, isSelected, onSelect }: OptionSwatchProps) {
    return (
        <motion.button
            onClick={onSelect}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            aria-pressed={isSelected}
            aria-label={`${option.name}${option.price_modifier !== 0 ? ` — ${option.price_modifier > 0 ? '+' : ''}₾${option.price_modifier}` : ''}`}
            className={[
                'relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-colors cursor-pointer',
                isSelected
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-400',
            ].join(' ')}
        >
            {/* Neutral warm-white background matches the canvas bg for real PNG layers */}
            <div className="w-full aspect-square rounded-lg overflow-hidden relative bg-[#F5F0EB]">
                <img
                    src={option.thumbnail_url}
                    alt={option.name}
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>

            <span className="text-xs font-medium text-slate-700 text-center leading-tight line-clamp-2">
                {option.name}
            </span>

            {option.price_modifier !== 0 && (
                <span className="text-[10px] text-slate-400">
                    {option.price_modifier > 0 ? '+' : ''}₾{option.price_modifier}
                </span>
            )}

            {/* Selected check badge */}
            {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
            )}
        </motion.button>
    );
}
