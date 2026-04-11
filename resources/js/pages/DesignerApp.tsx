import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router';
import { getPendingOrder } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { ClothingTypeSelector } from '../components/ClothingTypeSelector';
import { SubcategorySelector } from '../components/SubcategorySelector';
import { CustomizationPanel } from '../components/CustomizationPanel';
import { DesignCanvas } from '../components/DesignCanvas';
import { FinalPreview } from '../components/FinalPreview';

type Step = 'type' | 'subcategory' | 'customize' | 'design' | 'preview';
interface DesignState {
    clothingType: string | null;
    subcategory: string | null;
    length: string;
    sleeves: string;
    neckline: string;
    fabric: string;
    baseColor: string;
    lighterShade: string;
    darkerShade: string;
    additionalColor: string;
    textureMaterial: string;
    sizeStandard: string;
    sizeCm: { chest?: string; waist?: string; hips?: string; length?: string; inseam?: string };
    designElements: { cuts: string[]; height: string; customNotes: string };
}

const INITIAL_DESIGN: DesignState = {
    clothingType: null,
    subcategory: null,
    length: '',
    sleeves: '',
    neckline: '',
    fabric: '',
    baseColor: '#475569',
    lighterShade: '#94A3B8',
    darkerShade: '#1E293B',
    additionalColor: '#E2E8F0',
    textureMaterial: '',
    sizeStandard: 'M',
    sizeCm: {},
    designElements: { cuts: [], height: '', customNotes: '' },
};

const STEP_ORDER: Step[] = ['type', 'subcategory', 'customize', 'design', 'preview'];
const STEP_LABELS: Record<Step, string> = {
    type: 'Choose Type',
    subcategory: 'Select Style',
    customize: 'Customize',
    design: 'Design',
    preview: 'Review & Order',
};

// Base prices by clothing type (₾)
const BASE_PRICE: Record<string, number> = {
    dress: 180, shirt: 90, trousers: 120, jacket: 250,
    coat: 320, skirt: 100, suit: 450, blouse: 85,
};
const FABRIC_PREMIUM: Record<string, number> = {
    silk: 80, cashmere: 120, wool: 60, linen: 20, cotton: 0, denim: 15, velvet: 70, leather: 200,
};
function estimatePrice(design: DesignState): number {
    const base = BASE_PRICE[design.clothingType ?? ''] ?? 150;
    const fabric = FABRIC_PREMIUM[design.fabric?.toLowerCase() ?? ''] ?? 0;
    const cutAddon = (design.designElements?.cuts?.length ?? 0) * 15;
    return base + fabric + cutAddon;
}

export default function DesignerApp() {
    const [step, setStep] = useState<Step>('type');
    const [design, setDesign] = useState<DesignState>(() => {
        // ── Thaw: restore design state saved before login redirect ──
        const pending = getPendingOrder();
        if (pending?.type === 'custom' && pending.design) {
            return { ...INITIAL_DESIGN, ...(pending.design as Partial<DesignState>) };
        }
        return INITIAL_DESIGN;
    });

    // If we restored a design, jump to preview step so user can submit directly
    useEffect(() => {
        const pending = getPendingOrder();
        if (pending?.type === 'custom' && pending.design) {
            setStep('preview');
            // Don't clear yet — FinalPreview will clear after successful submit
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stepIndex = STEP_ORDER.indexOf(step);

    const estimatedPrice = estimatePrice(design);

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>Design Your Custom Garment | Kere</title>
                <meta name="description" content="Create a bespoke garment from scratch. Choose fabric, color, style and measurements — then a local Georgian tailor will craft it for you." />
            </Helmet>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <Link to="/" className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors shrink-0">
                        Kere
                    </Link>

                    {/* Step indicators — numbered with labels */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                        {STEP_ORDER.map((s, i) => (
                            <div key={s} className="flex items-center gap-1 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                                            i < stepIndex
                                                ? 'bg-slate-900 text-white'
                                                : i === stepIndex
                                                ? 'bg-slate-900 text-white ring-2 ring-slate-900/20 ring-offset-1'
                                                : 'bg-slate-200 text-slate-400'
                                        }`}
                                    >
                                        {i < stepIndex ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-xs font-medium hidden sm:inline transition-colors ${
                                        i === stepIndex ? 'text-slate-900' : i < stepIndex ? 'text-slate-500' : 'text-slate-300'
                                    }`}>
                                        {STEP_LABELS[s]}
                                    </span>
                                </div>
                                {i < STEP_ORDER.length - 1 && (
                                    <div className={`w-5 h-px mx-1 ${i < stepIndex ? 'bg-slate-900' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Live price estimate */}
                    {design.clothingType && (
                        <motion.div
                            key={estimatedPrice}
                            initial={{ scale: 0.95, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0 text-right"
                        >
                            <p className="text-[10px] text-slate-400 leading-none mb-0.5">Est. price</p>
                            <p className="text-base font-bold text-slate-900 leading-none">₾{estimatedPrice}</p>
                        </motion.div>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        {step === 'type' && (
                            <ClothingTypeSelector
                                onSelect={(type) => {
                                    setDesign({ ...INITIAL_DESIGN, clothingType: type });
                                    setStep('subcategory');
                                }}
                            />
                        )}
                        {step === 'subcategory' && design.clothingType && (
                            <SubcategorySelector
                                clothingType={design.clothingType}
                                onSelect={(sub) => {
                                    setDesign({ ...design, subcategory: sub });
                                    setStep('customize');
                                }}
                                onBack={() => setStep('type')}
                            />
                        )}
                        {step === 'customize' && (
                            <CustomizationPanel
                                design={design}
                                setDesign={setDesign}
                                onContinue={() => setStep('design')}
                                onBack={() => setStep('subcategory')}
                            />
                        )}
                        {step === 'design' && (
                            <DesignCanvas
                                design={design}
                                setDesign={setDesign}
                                onContinue={() => setStep('preview')}
                                onBack={() => setStep('customize')}
                            />
                        )}
                        {step === 'preview' && (
                            <FinalPreview
                                design={design}
                                onBack={() => setStep('design')}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Floating back to home */}
            <Link
                to="/"
                className="fixed bottom-6 left-6 bg-white border border-slate-200 text-slate-600 text-sm px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
                ← Back to Home
            </Link>
        </div>
    );
}
