import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import { FABRICS, type DesignConfig } from '../designer/config';
import { GarmentPreview } from './GarmentPreview';

interface CustomizationPanelProps {
    config:    DesignConfig;
    setConfig: (c: DesignConfig) => void;
    onContinue: () => void;
    onBack:     () => void;
}

export function CustomizationPanel({ config, setConfig, onContinue, onBack }: CustomizationPanelProps) {
    const update = <K extends keyof DesignConfig>(key: K, value: DesignConfig[K]) =>
        setConfig({ ...config, [key]: value });

    const canContinue = Boolean(config.fabric);

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Fabric & Colors</h2>
                <p className="text-slate-500">Choose your material and color palette.</p>
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
                    {config.fabric && (
                        <div className="pt-1 text-center">
                            <span className="text-xs font-medium text-slate-600">
                                {FABRICS.find(f => f.value === config.fabric)?.feel}
                            </span>
                        </div>
                    )}
                </motion.div>

                {/* Controls */}
                <div className="space-y-6">
                    {/* Fabric cards */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-slate-200 p-6"
                    >
                        <h3 className="font-bold text-slate-900 mb-4">Fabric</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {FABRICS.map(fabric => {
                                const selected = config.fabric === fabric.value;
                                return (
                                    <button
                                        key={fabric.value}
                                        onClick={() => update('fabric', fabric.value)}
                                        className={`relative text-left p-4 rounded-xl border transition-all ${
                                            selected
                                                ? 'border-slate-900 bg-slate-50 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-400'
                                        }`}
                                    >
                                        {selected && (
                                            <span className="absolute top-2 right-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </span>
                                        )}
                                        <div className="font-semibold text-slate-900 text-sm pr-5">{fabric.label}</div>
                                        <div className="text-xs text-slate-400 mt-0.5 leading-snug">{fabric.description}</div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                {fabric.feel}
                                            </span>
                                            {fabric.premium > 0 && (
                                                <span className="text-[10px] text-slate-400">+₾{fabric.premium}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.section>

                    {/* Color pickers */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-white rounded-2xl border border-slate-200 p-6"
                    >
                        <h3 className="font-bold text-slate-900 mb-4">Colors</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {([
                                { label: 'Base Color',   key: 'baseColor'   as const, hint: 'Main fabric color' },
                                { label: 'Accent Color', key: 'accentColor' as const, hint: 'Collar, trim, details' },
                            ] as const).map(({ label, key, hint }) => (
                                <div key={key}>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                                        {label}
                                    </label>
                                    <p className="text-xs text-slate-400 mb-2">{hint}</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={config[key] || '#000000'}
                                            onChange={e => update(key, e.target.value)}
                                            className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={config[key]}
                                            onChange={e => update(key, e.target.value)}
                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-xs text-slate-400">Preview:</span>
                            {[config.baseColor, config.accentColor].filter(Boolean).map((c, i) => (
                                <div
                                    key={i}
                                    className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </motion.section>

                    <button
                        onClick={onContinue}
                        disabled={!canContinue}
                        className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {canContinue ? 'Continue to Customize →' : 'Select a fabric to continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
