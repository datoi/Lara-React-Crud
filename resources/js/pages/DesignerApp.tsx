import { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ClothingTypeSelector } from '../components/ClothingTypeSelector';
import { SubcategorySelector } from '../components/SubcategorySelector';
import { CustomizationPanel } from '../components/CustomizationPanel';
import { DesignCanvas } from '../components/DesignCanvas';
import { FinalPreview } from '../components/FinalPreview';

type Step = 'type' | 'subcategory' | 'customize' | 'design' | 'preview';
type ClothingType = 'dress' | 'pants' | 'shirt' | 'hat' | 'scarf' | 'jacket';

interface DesignState {
    clothingType: ClothingType | null;
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
    preview: 'Review',
};

export default function DesignerApp() {
    const [step, setStep] = useState<Step>('type');
    const [design, setDesign] = useState<DesignState>(INITIAL_DESIGN);

    const stepIndex = STEP_ORDER.indexOf(step);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>

                    {/* Step indicators */}
                    <div className="flex items-center gap-2">
                        {STEP_ORDER.map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        i < stepIndex
                                            ? 'bg-slate-900 scale-100'
                                            : i === stepIndex
                                            ? 'bg-slate-900 scale-125 ring-2 ring-slate-900/20'
                                            : 'bg-slate-200'
                                    }`}
                                    title={STEP_LABELS[s]}
                                />
                                {i < STEP_ORDER.length - 1 && (
                                    <div className={`w-4 h-px ${i < stepIndex ? 'bg-slate-900' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-sm text-slate-400">
                        Step {stepIndex + 1} of {STEP_ORDER.length} — {STEP_LABELS[step]}
                    </div>
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
