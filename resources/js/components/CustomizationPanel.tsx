import { useState } from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { MeasurementGuideModal, type MeasurementKey } from './MeasurementGuideModal';
import { measurementWarning } from '../utils/measurementSanity';

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

interface CustomizationPanelProps {
    design: DesignState;
    setDesign: (d: DesignState) => void;
    onContinue: () => void;
    onBack: () => void;
}

const SELECT_OPTS = {
    length: ['Crop', 'Short', 'Knee-length', 'Midi', 'Maxi', 'Full-length'],
    sleeves: ['Sleeveless', 'Cap', 'Short', 'Three-quarter', 'Long', 'Bell'],
    neckline: ['V-neck', 'Crew', 'Scoop', 'Square', 'Boat', 'Turtleneck', 'Collar'],
    fabric: ['Cotton', 'Silk', 'Denim', 'Linen', 'Wool', 'Polyester', 'Velvet', 'Chiffon'],
    sizeStandard: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
};

function hexToLighter(hex: string): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + 60);
    const g = Math.min(255, ((num >> 8) & 0xff) + 60);
    const b = Math.min(255, (num & 0xff) + 60);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function hexToDarker(hex: string): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - 40);
    const g = Math.max(0, ((num >> 8) & 0xff) - 40);
    const b = Math.max(0, (num & 0xff) - 40);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
                <option value="">Select…</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

export function CustomizationPanel({ design, setDesign, onContinue, onBack }: CustomizationPanelProps) {
    const [guideStep, setGuideStep] = useState<MeasurementKey | null>(null);

    const update = (key: keyof DesignState, value: unknown) => setDesign({ ...design, [key]: value });
    const updateCm = (key: string, value: string) => setDesign({ ...design, sizeCm: { ...design.sizeCm, [key]: value } });

    const openGuide = (key: string) => {
        const valid: MeasurementKey[] = ['chest', 'waist', 'hips', 'length'];
        setGuideStep(valid.includes(key as MeasurementKey) ? (key as MeasurementKey) : 'chest');
    };

    const handleBaseColor = (color: string) => {
        setDesign({ ...design, baseColor: color, lighterShade: hexToLighter(color), darkerShade: hexToDarker(color) });
    };

    return (
        <>
        <div>
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Customize your {design.subcategory}</h2>
                <p className="text-slate-500">Define every detail of your garment.</p>
            </div>

            <div className="space-y-8 max-w-2xl mx-auto">
                {/* Style Details */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6"
                >
                    <h3 className="font-bold text-slate-900 mb-5">Style Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Length" value={design.length} options={SELECT_OPTS.length} onChange={v => update('length', v)} />
                        <Select label="Sleeves" value={design.sleeves} options={SELECT_OPTS.sleeves} onChange={v => update('sleeves', v)} />
                        <Select label="Neckline" value={design.neckline} options={SELECT_OPTS.neckline} onChange={v => update('neckline', v)} />
                        <Select label="Fabric" value={design.fabric} options={SELECT_OPTS.fabric} onChange={v => update('fabric', v)} />
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Texture / Material Details</label>
                        <input
                            type="text"
                            placeholder="e.g. smooth, textured, matte finish…"
                            value={design.textureMaterial}
                            onChange={e => update('textureMaterial', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                    </div>
                </motion.section>

                {/* Color Selection */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6"
                >
                    <h3 className="font-bold text-slate-900 mb-5">Colors</h3>
                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { label: 'Base Color', key: 'baseColor', value: design.baseColor, onChange: handleBaseColor },
                            { label: 'Lighter Shade', key: 'lighterShade', value: design.lighterShade, onChange: (v: string) => update('lighterShade', v) },
                            { label: 'Darker Shade', key: 'darkerShade', value: design.darkerShade, onChange: (v: string) => update('darkerShade', v) },
                            { label: 'Accent Color', key: 'additionalColor', value: design.additionalColor, onChange: (v: string) => update('additionalColor', v) },
                        ].map(c => (
                            <div key={c.key}>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{c.label}</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={c.value || '#000000'}
                                        onChange={e => c.onChange(e.target.value)}
                                        className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={c.value}
                                        onChange={e => c.onChange(e.target.value)}
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-3 items-center">
                        <span className="text-xs text-slate-500">Preview:</span>
                        {[design.baseColor, design.lighterShade, design.darkerShade, design.additionalColor].filter(Boolean).map((c, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </motion.section>

                {/* Size */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6"
                >
                    <h3 className="font-bold text-slate-900 mb-5">Size</h3>
                    <div className="mb-5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Standard Size</label>
                        <div className="flex gap-2 flex-wrap">
                            {SELECT_OPTS.sizeStandard.map(s => (
                                <button
                                    key={s}
                                    onClick={() => update('sizeStandard', s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                        design.sizeStandard === s
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Custom Measurements (cm)</label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                            {['chest', 'waist', 'hips', 'length', 'inseam'].map(key => {
                                const val = design.sizeCm[key as keyof typeof design.sizeCm] ?? '';
                                const warning = measurementWarning(key, val);
                                return (
                                    <div key={key}>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="text-xs text-slate-400 capitalize">{key}</label>
                                            {key !== 'inseam' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openGuide(key)}
                                                    className="text-slate-300 hover:text-slate-600 transition-colors"
                                                    aria-label={`Help for ${key}`}
                                                >
                                                    <HelpCircle className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={val}
                                                onChange={e => updateCm(key, e.target.value)}
                                                className={`w-full border rounded-lg px-2 py-2 text-sm pr-6 focus:outline-none focus:ring-2 focus:ring-slate-900 ${warning ? 'border-amber-400' : 'border-slate-200'}`}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                                        </div>
                                        {warning && (
                                            <p className="text-[10px] text-amber-600 mt-1 leading-tight">{warning}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.section>

                <button
                    onClick={onContinue}
                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98]"
                >
                    Continue to Design →
                </button>
            </div>
        </div>

        <MeasurementGuideModal
            open={guideStep !== null}
            onClose={() => setGuideStep(null)}
            initialStep={guideStep ?? 'chest'}
        />
        </>
    );
}
