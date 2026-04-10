import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { GarmentPreview } from './GarmentPreview';

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

interface DesignCanvasProps {
    design: DesignState;
    setDesign: (d: DesignState) => void;
    onContinue: () => void;
    onBack: () => void;
}

const CUT_OPTIONS = ['Pocket', 'Zipper', 'Buttons', 'Pleats', 'Ruffle', 'Belt loop', 'Embroidery', 'Lace trim'];

export function DesignCanvas({ design, setDesign, onContinue, onBack }: DesignCanvasProps) {
    const update = (key: keyof DesignState['designElements'], value: unknown) =>
        setDesign({ ...design, designElements: { ...design.designElements, [key]: value } });

    const toggleCut = (cut: string) => {
        const current = design.designElements.cuts;
        update('cuts', current.includes(cut) ? current.filter(c => c !== cut) : [...current, cut]);
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Design your {design.subcategory}</h2>
                <p className="text-slate-500">Add design elements and refine the details.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* Visual preview */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4"
                >
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Preview</div>
                    <GarmentPreview design={design} size="compact" />
                    {/* CM measurements */}
                    {Object.entries(design.sizeCm).some(([, v]) => v) && (
                        <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-100">
                            {Object.entries(design.sizeCm).map(([k, v]) => v ? (
                                <div key={k} className="flex justify-between">
                                    <span className="capitalize">{k}</span>
                                    <span className="font-medium text-slate-600">{v} cm</span>
                                </div>
                            ) : null)}
                        </div>
                    )}
                </motion.div>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                >
                    {/* Design cuts */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="text-sm font-semibold text-slate-700 mb-3">Design Elements</div>
                        <div className="grid grid-cols-2 gap-2">
                            {CUT_OPTIONS.map(cut => (
                                <button
                                    key={cut}
                                    onClick={() => toggleCut(cut)}
                                    className={`px-3 py-2 rounded-lg text-sm border transition-all text-left ${
                                        design.designElements.cuts.includes(cut)
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                    }`}
                                >
                                    {cut}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Height */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Your Height (cm)</label>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="e.g. 168"
                                value={design.designElements.height}
                                onChange={e => update('height', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                        </div>
                    </div>

                    {/* Custom notes */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Notes for Tailor</label>
                        <textarea
                            rows={4}
                            placeholder="Any special instructions, references, or details you want the tailor to know…"
                            value={design.designElements.customNotes}
                            onChange={e => update('customNotes', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                    </div>

                    <button
                        onClick={onContinue}
                        className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98]"
                    >
                        Review Design →
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
