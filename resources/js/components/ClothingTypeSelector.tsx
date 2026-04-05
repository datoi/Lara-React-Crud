import { motion } from 'motion/react';

type ClothingType = 'dress' | 'pants' | 'shirt' | 'hat' | 'scarf' | 'jacket';

interface ClothingTypeSelectorProps {
    onSelect: (type: ClothingType) => void;
}

const types: { type: ClothingType; emoji: string; label: string; description: string }[] = [
    { type: 'dress', emoji: '👗', label: 'Dress', description: 'Maxi, mini, wrap, and more' },
    { type: 'pants', emoji: '👖', label: 'Pants', description: 'Jeans, chinos, dress pants' },
    { type: 'shirt', emoji: '👔', label: 'Shirt', description: 'Blouses, button-downs, tees' },
    { type: 'hat', emoji: '🧢', label: 'Hat', description: 'Caps, beanies, fedoras' },
    { type: 'scarf', emoji: '🧣', label: 'Scarf', description: 'Winter, silk, infinity scarves' },
    { type: 'jacket', emoji: '🧥', label: 'Jacket', description: 'Bomber, blazer, trench coats' },
];

export function ClothingTypeSelector({ onSelect }: ClothingTypeSelectorProps) {
    return (
        <div>
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">What are you designing?</h2>
                <p className="text-slate-500">Choose the type of clothing you want to create.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {types.map((item, i) => (
                    <motion.button
                        key={item.type}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.06 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(item.type)}
                        className="bg-white border border-slate-200 rounded-2xl p-6 text-left hover:border-slate-900 hover:shadow-md transition-all group"
                    >
                        <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">{item.emoji}</span>
                        <div className="font-bold text-slate-900">{item.label}</div>
                        <div className="text-sm text-slate-400 mt-1">{item.description}</div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
