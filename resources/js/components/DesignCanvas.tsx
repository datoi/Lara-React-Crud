import { useState } from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getGarment, COMPONENTS, DESIGN_DETAILS, SIZE_OPTIONS, type DesignConfig } from '../designer/config';
import { GarmentPreview } from './GarmentPreview';
import { MeasurementGuideModal, type MeasurementKey } from './MeasurementGuideModal';
import { measurementWarning } from '../utils/measurementSanity';

interface DesignCanvasProps {
    config:    DesignConfig;
    setConfig: (c: DesignConfig) => void;
    onContinue: () => void;
    onBack:     () => void;
}

export function DesignCanvas({ config, setConfig, onContinue, onBack }: DesignCanvasProps) {
    const [guideStep, setGuideStep] = useState<MeasurementKey | null>(null);

    const garment          = getGarment(config.garmentType);
    const allowedComponents = garment?.allowedComponents ?? [];

    const updateComponent = (key: keyof DesignConfig['components'], value: string) =>
        setConfig({ ...config, components: { ...config.components, [key]: value } });

    const toggleDetail = (value: string) => {
        const next = config.details.includes(value)
            ? config.details.filter(d => d !== value)
            : [...config.details, value];
        setConfig({ ...config, details: next });
    };

    const updateCm = (key: keyof DesignConfig['sizeCm'], value: string) =>
        setConfig({ ...config, sizeCm: { ...config.sizeCm, [key]: value } });

    const openGuide = (key: string) => {
        const valid: MeasurementKey[] = ['chest', 'waist', 'hips', 'length'];
        setGuideStep(valid.includes(key as MeasurementKey) ? (key as MeasurementKey) : 'chest');
    };

    // Component selector row
    const ComponentSelector = ({ label, componentKey }: { label: string; componentKey: keyof DesignConfig['components'] }) => {
        const options = COMPONENTS[componentKey];
        return (
            <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{label}</label>
                <div className="flex flex-wrap gap-2">
                    {options.map(opt => {
                        const active = config.components[componentKey] === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => updateComponent(componentKey, active ? '' : opt.value)}
                                title={opt.hint}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    active
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Customize your {garment?.label.toLowerCase()}
                </h2>
                <p className="text-slate-500">Add design elements, style details, and your measurements.</p>
            </div>

            <div className="grid md:grid-cols-[240px_1fr] gap-8 max-w-4xl mx-auto items-start">
                {/* Live preview — sticky */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="md:sticky md:top-6 bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
                >
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Preview</div>
                    <GarmentPreview config={config} size="compact" />
                    {[config.components.length, config.components.sleeves, config.components.neckline].filter(Boolean).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                            {[config.components.length, config.components.sleeves, config.components.neckline]
                                .filter(Boolean)
                                .map(v => (
                                    <span key={v} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {v}
                                    </span>
                                ))}
                        </div>
                    )}
                </motion.div>

                {/* Controls */}
                <div className="space-y-6">
                    {/* Style components */}
                    {allowedComponents.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
                        >
                            <h3 className="font-bold text-slate-900">Style Components</h3>
                            {allowedComponents.includes('neckline') && (
                                <ComponentSelector label="Neckline" componentKey="neckline" />
                            )}
                            {allowedComponents.includes('sleeves') && (
                                <ComponentSelector label="Sleeves" componentKey="sleeves" />
                            )}
                            {allowedComponents.includes('length') && (
                                <ComponentSelector label="Length" componentKey="length" />
                            )}
                        </motion.section>
                    )}

                    {/* Design details */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 }}
                        className="bg-white rounded-2xl border border-slate-200 p-6"
                    >
                        <h3 className="font-bold text-slate-900 mb-4">Design Details</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {DESIGN_DETAILS.map(detail => {
                                const active = config.details.includes(detail.value);
                                return (
                                    <button
                                        key={detail.value}
                                        onClick={() => toggleDetail(detail.value)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all text-left ${
                                            active
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                        }`}
                                    >
                                        <span className="text-base leading-none">{detail.icon}</span>
                                        <div>
                                            <div className="font-medium text-xs">{detail.label}</div>
                                            {detail.priceAddon > 0 && (
                                                <div className={`text-[10px] ${active ? 'text-white/60' : 'text-slate-400'}`}>
                                                    +₾{detail.priceAddon}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.section>

                    {/* Size */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="bg-white rounded-2xl border border-slate-200 p-6"
                    >
                        <h3 className="font-bold text-slate-900 mb-4">Size & Measurements</h3>

                        {/* Standard size */}
                        <div className="mb-5">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Standard Size</label>
                            <div className="flex gap-2 flex-wrap">
                                {SIZE_OPTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setConfig({ ...config, sizeStandard: s })}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                            config.sizeStandard === s
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom cm measurements */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                                Custom Measurements (cm) <span className="font-normal normal-case text-slate-400">— optional</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                                {(['chest', 'waist', 'hips', 'length', 'inseam'] as const).map(key => {
                                    const val     = config.sizeCm[key] ?? '';
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
                                                    className={`w-full border rounded-lg px-2 py-2 text-sm pr-6 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                                                        warning ? 'border-amber-400' : 'border-slate-200'
                                                    }`}
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

                    {/* Height + notes */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Your Height (cm) <span className="font-normal text-slate-400">— helps the tailor proportion the garment</span>
                            </label>
                            <div className="relative max-w-[140px]">
                                <input
                                    type="number"
                                    placeholder="e.g. 168"
                                    value={config.height}
                                    onChange={e => setConfig({ ...config, height: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Notes for Tailor</label>
                            <textarea
                                rows={3}
                                placeholder="Any special instructions, references, or details you want the tailor to know…"
                                value={config.notes}
                                onChange={e => setConfig({ ...config, notes: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                    </motion.section>

                    <button
                        onClick={onContinue}
                        className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98]"
                    >
                        Review Design →
                    </button>
                </div>
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
