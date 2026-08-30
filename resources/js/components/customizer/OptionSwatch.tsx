import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { LayerOption } from '../../types/customizer';

interface OptionSwatchProps {
    option: LayerOption;
    isSelected: boolean;
    onSelect: () => void;
}

/**
 * A photographed option. Attributes whose options are labels rather than
 * pictures use OptionTile instead, so this always has artwork to show — but it
 * still degrades to a text tile if a photo has not been uploaded yet.
 */
export default function OptionSwatch({ option, isSelected, onSelect }: OptionSwatchProps) {
    const artwork = option.thumbnail_url;

    return (
        <motion.button
            type="button"
            onClick={onSelect}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            aria-pressed={isSelected}
            aria-label={`${option.name}${option.price_modifier !== 0 ? ` — ${option.price_modifier > 0 ? '+' : ''}₾${option.price_modifier}` : ''}`}
            className={[
                'relative flex cursor-pointer flex-col items-center gap-1.5 bg-white p-2 transition-colors',
                artwork ? '' : 'min-h-[56px] justify-center px-3.5 py-3',
                isSelected
                    ? 'border border-[#111111] shadow-[inset_0_0_0_1px_#111111]'
                    : 'border border-[#111111]/[0.16] hover:border-[#111111]',
            ].join(' ')}
        >
            {artwork && (
                <div className="relative aspect-square w-full overflow-hidden bg-white">
                    <img
                        src={artwork}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        className="absolute inset-0 h-full w-full select-none object-contain"
                    />
                </div>
            )}

            <span className="line-clamp-2 text-center text-xs font-medium leading-tight text-[#111111]">
                {option.name}
            </span>

            {option.price_modifier !== 0 && (
                <span className="text-[11px] text-[#655D55]">
                    {option.price_modifier > 0 ? '+' : ''}₾{option.price_modifier}
                </span>
            )}

            {isSelected && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center bg-[#111111]">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
            )}
        </motion.button>
    );
}
