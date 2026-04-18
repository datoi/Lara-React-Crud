import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getGarment, type GarmentType } from '../designer/config';

interface SubcategorySelectorProps {
    garmentType: GarmentType;
    onSelect:    (style: string) => void;
    onBack:      () => void;
}

export function SubcategorySelector({ garmentType, onSelect, onBack }: SubcategorySelectorProps) {
    const garment = getGarment(garmentType);
    const styles  = garment?.styles ?? [];

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-10">
                <div className="text-3xl mb-2">{garment?.emoji}</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    What style of {garment?.label.toLowerCase()}?
                </h2>
                <p className="text-slate-500">Pick the specific style you want to design.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {styles.map((item, i) => (
                    <motion.button
                        key={item.value}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(item.value)}
                        className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-slate-900 hover:shadow-md transition-all"
                    >
                        <div className="font-semibold text-slate-900">{item.label}</div>
                        <div className="text-sm text-slate-400 mt-1">{item.description}</div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
