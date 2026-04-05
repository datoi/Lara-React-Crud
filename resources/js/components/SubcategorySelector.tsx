import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

type ClothingType = 'dress' | 'pants' | 'shirt' | 'hat' | 'scarf' | 'jacket';

interface SubcategorySelectorProps {
    clothingType: ClothingType;
    onSelect: (subcategory: string) => void;
    onBack: () => void;
}

const subcategories: Record<ClothingType, { label: string; description: string }[]> = {
    dress: [
        { label: 'Maxi', description: 'Floor-length, flowing silhouette' },
        { label: 'Mini', description: 'Above the knee, casual or dressy' },
        { label: 'A-Line', description: 'Fitted at top, flared at bottom' },
        { label: 'Wrap', description: 'Cross-front adjustable style' },
        { label: 'Bodycon', description: 'Form-fitting, sleek silhouette' },
        { label: 'Shirt Dress', description: 'Casual shirt-inspired style' },
    ],
    pants: [
        { label: 'Jeans', description: 'Denim, straight or slim fit' },
        { label: 'Chinos', description: 'Cotton twill, smart casual' },
        { label: 'Dress Pants', description: 'Formal, tailored finish' },
        { label: 'Wide Leg', description: 'Relaxed, flowing silhouette' },
        { label: 'Joggers', description: 'Comfortable, casual fit' },
        { label: 'Shorts', description: 'Above-the-knee, summer style' },
    ],
    shirt: [
        { label: 'Button-Down', description: 'Classic collared shirt' },
        { label: 'T-Shirt', description: 'Casual crew-neck tee' },
        { label: 'Polo', description: 'Smart casual, collared' },
        { label: 'Blouse', description: 'Soft, feminine top' },
        { label: 'Henley', description: 'Collarless button placket' },
        { label: 'Tank Top', description: 'Sleeveless, warm weather' },
    ],
    hat: [
        { label: 'Baseball Cap', description: 'Structured, six-panel cap' },
        { label: 'Beanie', description: 'Knit, winter warmth' },
        { label: 'Fedora', description: 'Brimmed, classic style' },
        { label: 'Bucket Hat', description: 'Soft, round downward brim' },
        { label: 'Beret', description: 'Soft, flat-crowned hat' },
        { label: 'Snapback', description: 'Flat-brim, adjustable snap' },
    ],
    scarf: [
        { label: 'Winter Scarf', description: 'Thick, warm wool or fleece' },
        { label: 'Silk Scarf', description: 'Lightweight, elegant drape' },
        { label: 'Infinity Scarf', description: 'Looped, no ends' },
        { label: 'Pashmina', description: 'Ultra-soft cashmere-like wrap' },
        { label: 'Bandana', description: 'Square, versatile wear' },
    ],
    jacket: [
        { label: 'Bomber', description: 'Cropped, ribbed cuffs' },
        { label: 'Blazer', description: 'Smart, structured tailoring' },
        { label: 'Puffer', description: 'Insulated, quilted warmth' },
        { label: 'Denim Jacket', description: 'Classic, casual jean jacket' },
        { label: 'Trench', description: 'Long, belted, timeless' },
        { label: 'Windbreaker', description: 'Light, water-resistant shell' },
    ],
};

export function SubcategorySelector({ clothingType, onSelect, onBack }: SubcategorySelectorProps) {
    const options = subcategories[clothingType];

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    What style of {clothingType}?
                </h2>
                <p className="text-slate-500">Pick the specific style you want to design.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {options.map((item, i) => (
                    <motion.button
                        key={item.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(item.label)}
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
