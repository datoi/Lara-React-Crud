import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

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

function GarmentPreview({ design }: { design: DesignState }) {
    const color = design.baseColor || '#E2E8F0';
    const lighter = design.lighterShade || '#F1F5F9';
    const darker = design.darkerShade || '#CBD5E1';
    const type = design.clothingType;

    return (
        <svg viewBox="0 0 200 240" className="w-full max-w-[240px] mx-auto drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
            {type === 'dress' && (
                <>
                    <path d="M70 30 Q100 20 130 30 L145 70 L160 220 L40 220 L55 70 Z" fill={color} stroke={darker} strokeWidth="1.5" />
                    <path d="M70 30 Q100 20 130 30 L120 55 Q100 65 80 55 Z" fill={lighter} stroke={darker} strokeWidth="1" />
                    <path d="M55 70 L30 90 L40 110 L65 95" fill={color} stroke={darker} strokeWidth="1.5" />
                    <path d="M145 70 L170 90 L160 110 L135 95" fill={color} stroke={darker} strokeWidth="1.5" />
                </>
            )}
            {type === 'shirt' && (
                <>
                    <path d="M70 30 Q100 20 130 30 L145 50 L165 70 L150 90 L135 75 L135 200 L65 200 L65 75 L50 90 L35 70 L55 50 Z" fill={color} stroke={darker} strokeWidth="1.5" />
                    <path d="M85 30 L100 55 L115 30" fill={lighter} stroke={darker} strokeWidth="1" />
                    <line x1="100" y1="55" x2="100" y2="200" stroke={darker} strokeWidth="0.8" strokeDasharray="3 3" />
                </>
            )}
            {type === 'pants' && (
                <>
                    <path d="M55 30 L145 30 L150 130 L115 130 L100 200 L85 200 L70 130 L50 130 Z" fill={color} stroke={darker} strokeWidth="1.5" />
                    <path d="M55 30 L145 30 L143 50 L57 50 Z" fill={lighter} stroke={darker} strokeWidth="1" />
                    <line x1="100" y1="50" x2="100" y2="200" stroke={darker} strokeWidth="0.8" />
                </>
            )}
            {type === 'jacket' && (
                <>
                    <path d="M65 25 Q100 15 135 25 L155 55 L175 75 L158 100 L140 80 L140 210 L60 210 L60 80 L42 100 L25 75 L45 55 Z" fill={color} stroke={darker} strokeWidth="1.5" />
                    <path d="M65 25 L80 70 L100 60 L120 70 L135 25" fill={lighter} stroke={darker} strokeWidth="1" />
                    <line x1="100" y1="60" x2="100" y2="210" stroke={darker} strokeWidth="1.5" />
                </>
            )}
            {(type === 'hat' || type === 'scarf') && (
                <>
                    {type === 'hat' && (
                        <>
                            <ellipse cx="100" cy="100" rx="70" ry="30" fill={lighter} stroke={darker} strokeWidth="1.5" />
                            <path d="M40 100 Q50 60 100 50 Q150 60 160 100" fill={color} stroke={darker} strokeWidth="1.5" />
                        </>
                    )}
                    {type === 'scarf' && (
                        <>
                            <path d="M40 60 Q100 40 160 60 Q165 100 155 130 Q130 145 100 140 Q70 145 45 130 Q35 100 40 60 Z" fill={color} stroke={darker} strokeWidth="1.5" />
                            <path d="M85 140 Q90 200 80 220 L100 225 L110 220 Q100 200 115 140" fill={color} stroke={darker} strokeWidth="1.5" />
                        </>
                    )}
                </>
            )}

            {/* Measurements overlay */}
            {design.sizeCm.chest && (
                <>
                    <line x1="55" y1="90" x2="145" y2="90" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="4 2" />
                    <text x="152" y="93" fontSize="8" fill="#94A3B8">{design.sizeCm.chest}cm</text>
                </>
            )}
            {design.sizeCm.waist && (
                <>
                    <line x1="60" y1="130" x2="140" y2="130" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="4 2" />
                    <text x="143" y="133" fontSize="8" fill="#94A3B8">{design.sizeCm.waist}cm</text>
                </>
            )}
        </svg>
    );
}

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
                    className="bg-white rounded-2xl border border-slate-200 p-6"
                >
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Preview</div>
                    <GarmentPreview design={design} />
                    {/* Applied design elements */}
                    {design.designElements.cuts.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {design.designElements.cuts.map(cut => (
                                <span key={cut} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cut}</span>
                            ))}
                        </div>
                    )}
                    {/* CM measurements */}
                    {Object.entries(design.sizeCm).some(([, v]) => v) && (
                        <div className="mt-4 text-xs text-slate-400 space-y-1">
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
