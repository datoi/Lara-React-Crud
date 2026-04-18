/**
 * DesignerApp — Sumissura-style 3-panel clothing design studio
 *
 * Layout:  [ Controls ] [ Mannequin Preview ] [ Summary / CTA ]
 * Mobile:  stacked vertically (preview → controls → summary)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Check, Info, ChevronDown, ChevronUp, Ruler } from 'lucide-react';

import {
    INITIAL_CONFIG, calcPrice, getGarment,
    GARMENTS, FABRICS, COMPONENTS, DESIGN_DETAILS, SIZE_OPTIONS,
    type DesignConfig, type GarmentType,
} from '../designer/config';
import { getAuthToken, saveReturnTo, savePendingOrder, clearPendingOrder, getPendingOrder } from '../hooks/useAuth';
import { GarmentSVG } from '../components/designer/GarmentSVG';
import { MeasurementGuideModal, type MeasurementKey } from '../components/MeasurementGuideModal';
import { measurementWarning } from '../utils/measurementSanity';

// ─── Pending order restore ─────────────────────────────────────────────────────

function restoreConfig(raw: Record<string, unknown>): DesignConfig {
    return {
        ...INITIAL_CONFIG,
        garmentType:  (raw.garmentType ?? raw.clothingType ?? null) as GarmentType | null,
        style:        String(raw.style        ?? raw.subcategory  ?? ''),
        fabric:       String(raw.fabric       ?? ''),
        baseColor:    String(raw.baseColor    ?? INITIAL_CONFIG.baseColor),
        accentColor:  String(raw.accentColor  ?? raw.additionalColor ?? INITIAL_CONFIG.accentColor),
        components: {
            neckline: String((raw.components as Record<string,string>)?.neckline ?? raw.neckline ?? ''),
            sleeves:  String((raw.components as Record<string,string>)?.sleeves  ?? raw.sleeves  ?? ''),
            length:   String((raw.components as Record<string,string>)?.length   ?? raw.length   ?? ''),
        },
        details:     Array.isArray(raw.details) ? raw.details as string[] : [],
        sizeStandard: String(raw.sizeStandard ?? 'M'),
        sizeCm: {
            chest:  String((raw.sizeCm as Record<string,string>)?.chest  ?? ''),
            waist:  String((raw.sizeCm as Record<string,string>)?.waist  ?? ''),
            hips:   String((raw.sizeCm as Record<string,string>)?.hips   ?? ''),
            length: String((raw.sizeCm as Record<string,string>)?.length ?? ''),
            inseam: String((raw.sizeCm as Record<string,string>)?.inseam ?? ''),
        },
        height: String(raw.height ?? ''),
        notes:  String(raw.notes  ?? ''),
    };
}

// ─── Sub-components: option pickers ──────────────────────────────────────────

interface PickerOption { value: string; label: string; hint?: string; emoji?: string }

function OptionChip({
    option, active, onClick,
}: { option: PickerOption; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={option.hint}
            className={`
                relative px-3 py-2 rounded-xl border text-sm font-medium transition-all
                ${active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                }
            `}
        >
            {option.emoji && <span className="mr-1.5">{option.emoji}</span>}
            {option.label}
            {active && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 block" />
                </span>
            )}
        </button>
    );
}

function OptionRow({
    label, options, value, onChange,
}: { label: string; options: PickerOption[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
            <div className="flex flex-wrap gap-2">
                {options.map(o => (
                    <OptionChip
                        key={o.value}
                        option={o}
                        active={value === o.value}
                        onClick={() => onChange(value === o.value ? '' : o.value)}
                    />
                ))}
            </div>
        </div>
    );
}

// Collapsible section wrapper
function Section({ title, defaultOpen = true, children }: {
    title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between py-3.5 text-left"
            >
                <span className="text-sm font-semibold text-slate-800">{title}</span>
                {open
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                }
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-5 space-y-5">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Controls panel (left) ────────────────────────────────────────────────────

interface ControlsProps {
    config: DesignConfig;
    setConfig: (c: DesignConfig) => void;
    onOpenMeasureGuide: (key: MeasurementKey) => void;
}

function ControlsPanel({ config, setConfig, onOpenMeasureGuide }: ControlsProps) {
    const set = useCallback(<K extends keyof DesignConfig>(key: K, val: DesignConfig[K]) => {
        setConfig({ ...config, [key]: val });
    }, [config, setConfig]);

    const setComp = useCallback((k: keyof DesignConfig['components'], v: string) => {
        setConfig({ ...config, components: { ...config.components, [k]: v } });
    }, [config, setConfig]);

    const setCm = useCallback((k: keyof DesignConfig['sizeCm'], v: string) => {
        setConfig({ ...config, sizeCm: { ...config.sizeCm, [k]: v } });
    }, [config, setConfig]);

    const toggleDetail = useCallback((v: string) => {
        const next = config.details.includes(v)
            ? config.details.filter(d => d !== v)
            : [...config.details, v];
        set('details', next);
    }, [config, set]);

    const garment = getGarment(config.garmentType);
    const allowed = garment?.allowedComponents ?? [];

    // Garment styles as options
    const styleOptions: PickerOption[] = (garment?.styles ?? []).map(s => ({
        value: s.value, label: s.label, hint: s.description,
    }));

    // Neckline options (only for garments that allow neckline)
    const necklineOptions: PickerOption[] = COMPONENTS.neckline.map(c => ({
        value: c.value, label: c.label, hint: c.hint,
    }));
    const sleevesOptions: PickerOption[] = COMPONENTS.sleeves.map(c => ({
        value: c.value, label: c.label, hint: c.hint,
    }));
    const lengthOptions: PickerOption[] = COMPONENTS.length.map(c => ({
        value: c.value, label: c.label, hint: c.hint,
    }));

    return (
        <div className="space-y-0 overflow-y-auto h-full pr-1">

            {/* Garment type */}
            <Section title="Garment Type">
                <div className="grid grid-cols-3 gap-2">
                    {GARMENTS.map(g => (
                        <button
                            key={g.type}
                            onClick={() => setConfig({ ...INITIAL_CONFIG, garmentType: g.type })}
                            className={`
                                flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all
                                ${config.garmentType === g.type
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                }
                            `}
                        >
                            <span className="text-xl">{g.emoji}</span>
                            <span className="text-[11px] font-medium leading-tight">{g.label}</span>
                        </button>
                    ))}
                </div>
            </Section>

            {/* Style */}
            {styleOptions.length > 0 && (
                <Section title="Style">
                    <OptionRow
                        label=""
                        options={styleOptions}
                        value={config.style}
                        onChange={v => set('style', v)}
                    />
                </Section>
            )}

            {/* Components */}
            {(allowed.includes('neckline') || allowed.includes('sleeves') || allowed.includes('length')) && (
                <Section title="Cut & Shape">
                    {allowed.includes('neckline') && (
                        <OptionRow label="Neckline" options={necklineOptions} value={config.components.neckline} onChange={v => setComp('neckline', v)} />
                    )}
                    {allowed.includes('sleeves') && (
                        <OptionRow label="Sleeves" options={sleevesOptions} value={config.components.sleeves} onChange={v => setComp('sleeves', v)} />
                    )}
                    {allowed.includes('length') && (
                        <OptionRow label="Length" options={lengthOptions} value={config.components.length} onChange={v => setComp('length', v)} />
                    )}
                </Section>
            )}

            {/* Fabric */}
            <Section title="Fabric">
                <div className="grid grid-cols-2 gap-2">
                    {FABRICS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => set('fabric', f.value)}
                            className={`
                                relative text-left p-3 rounded-xl border transition-all
                                ${config.fabric === f.value
                                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                    : 'border-slate-200 hover:border-slate-400'
                                }
                            `}
                        >
                            <div className="font-semibold text-slate-900 text-xs leading-tight">{f.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{f.description}</div>
                            <div className="mt-2 flex items-center gap-1.5">
                                <span className="text-[9px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{f.feel}</span>
                                {f.premium > 0 && <span className="text-[9px] text-slate-400">+₾{f.premium}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </Section>

            {/* Color */}
            <Section title="Colors">
                <div className="space-y-4">
                    {([
                        { key: 'baseColor'   as const, label: 'Main Color',   hint: 'Fabric color' },
                        { key: 'accentColor' as const, label: 'Accent Color', hint: 'Trim & details' },
                    ]).map(({ key, label, hint }) => (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-slate-700">{label}</span>
                                <span className="text-[10px] text-slate-400">{hint}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer">
                                    <input
                                        type="color"
                                        value={config[key] || '#000000'}
                                        onChange={e => set(key, e.target.value)}
                                        className="sr-only"
                                    />
                                    <div
                                        className="w-9 h-9 rounded-xl border-2 border-white shadow-md cursor-pointer ring-1 ring-slate-200"
                                        style={{ backgroundColor: config[key] }}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={config[key]}
                                    onChange={e => set(key, e.target.value)}
                                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                    ))}

                    {/* Quick-pick swatches */}
                    <div>
                        <p className="text-[10px] text-slate-400 mb-2">Quick picks</p>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                '#1E293B','#334155','#64748B','#E2E8F0',
                                '#7C3AED','#2563EB','#059669','#DC2626',
                                '#D97706','#EC4899','#F8FAFC','#0F172A',
                            ].map(c => (
                                <button
                                    key={c}
                                    onClick={() => set('baseColor', c)}
                                    className={`
                                        w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110
                                        ${config.baseColor === c ? 'border-slate-900 scale-110' : 'border-white shadow-sm'}
                                    `}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* Design Details */}
            <Section title="Design Details" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2">
                    {DESIGN_DETAILS.map(d => {
                        const on = config.details.includes(d.value);
                        return (
                            <button
                                key={d.value}
                                onClick={() => toggleDetail(d.value)}
                                title={d.description}
                                className={`
                                    flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all
                                    ${on
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                    }
                                `}
                            >
                                <span className="text-sm">{d.icon}</span>
                                <div>
                                    <div className="text-xs font-medium">{d.label}</div>
                                    {d.priceAddon > 0 && (
                                        <div className={`text-[9px] ${on ? 'text-white/60' : 'text-slate-400'}`}>+₾{d.priceAddon}</div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Section>

            {/* Size & Measurements */}
            <Section title="Size & Measurements" defaultOpen={false}>
                {/* Standard size */}
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Standard Size</p>
                    <div className="flex gap-2 flex-wrap">
                        {SIZE_OPTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => set('sizeStandard', s)}
                                className={`
                                    px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                    ${config.sizeStandard === s
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                    }
                                `}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom cm */}
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                        Custom Measurements <span className="font-normal normal-case text-slate-300">cm · optional</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {(['chest', 'waist', 'hips', 'length', 'inseam'] as const).map(key => {
                            const val = config.sizeCm[key] ?? '';
                            const warn = measurementWarning(key, val);
                            return (
                                <div key={key}>
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="text-[10px] text-slate-400 capitalize">{key}</span>
                                        {key !== 'inseam' && (
                                            <button
                                                onClick={() => onOpenMeasureGuide(key as MeasurementKey)}
                                                className="text-slate-300 hover:text-slate-500"
                                            >
                                                <Ruler className="w-2.5 h-2.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="—"
                                            value={val}
                                            onChange={e => setCm(key, e.target.value)}
                                            className={`
                                                w-full border rounded-lg px-2 py-1.5 text-xs pr-6
                                                focus:outline-none focus:ring-2 focus:ring-slate-900
                                                ${warn ? 'border-amber-300' : 'border-slate-200'}
                                            `}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">cm</span>
                                    </div>
                                    {warn && <p className="text-[9px] text-amber-500 mt-0.5">{warn}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Height */}
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Your Height</p>
                    <div className="relative max-w-[110px]">
                        <input
                            type="number"
                            placeholder="e.g. 168"
                            value={config.height}
                            onChange={e => set('height', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs pr-7 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">cm</span>
                    </div>
                </div>
            </Section>

            {/* Notes */}
            <Section title="Notes for Tailor" defaultOpen={false}>
                <textarea
                    rows={3}
                    placeholder="Any special instructions, references, or details…"
                    value={config.notes}
                    onChange={e => set('notes', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
            </Section>
        </div>
    );
}

// ─── Preview panel (center) ────────────────────────────────────────────────────

function PreviewPanel({ config }: { config: DesignConfig }) {
    const garment = getGarment(config.garmentType);
    const fabric  = FABRICS.find(f => f.value === config.fabric);

    const activeBadges = [
        config.components.neckline,
        config.components.sleeves,
        config.components.length,
        config.style,
    ].filter(Boolean) as string[];

    return (
        <div className="flex flex-col h-full">
            {/* Preview viewport */}
            <div
                className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden"
                style={{
                    background: config.baseColor
                        ? `radial-gradient(ellipse at 50% 30%, ${config.baseColor}18 0%, #F8FAFC 65%)`
                        : '#F8FAFC',
                }}
            >
                <motion.div
                    key={`${config.garmentType}-${config.style}-${config.baseColor}-${config.components.neckline}-${config.components.sleeves}-${config.components.length}`}
                    initial={{ opacity: 0.7, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[280px] mx-auto px-4 py-4"
                >
                    <GarmentSVG config={config} size="full" />
                </motion.div>
            </div>

            {/* Active config badges */}
            {activeBadges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                    {activeBadges.map(b => (
                        <span
                            key={b}
                            className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                        >
                            {b}
                        </span>
                    ))}
                    {fabric && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-900 text-white">
                            {fabric.label}
                        </span>
                    )}
                </div>
            )}

            {!config.garmentType && (
                <p className="text-center text-xs text-slate-400 mt-4">
                    ← Select a garment type to begin
                </p>
            )}
        </div>
    );
}

// ─── Summary panel (right) ────────────────────────────────────────────────────

interface SummaryProps {
    config:     DesignConfig;
    submitting: boolean;
    submitted:  boolean;
    error:      string;
    onSubmit:   () => void;
}

function SummaryPanel({ config, submitting, submitted, error, onSubmit }: SummaryProps) {
    const { base, fabric: fabricAddon, details: detailsAddon, total } = useMemo(
        () => calcPrice(config), [config]
    );

    const garment     = getGarment(config.garmentType);
    const fabricLabel = FABRICS.find(f => f.value === config.fabric)?.label ?? '';

    // Build a dynamic product title  e.g. "Wrap Dress — Sleeveless, V-Neck"
    const styleParts = [
        config.style
            ? garment?.styles.find(s => s.value === config.style)?.label
            : null,
        garment?.label,
    ].filter(Boolean).join(' ');

    const compParts = [
        config.components.sleeves
            ? COMPONENTS.sleeves.find(c => c.value === config.components.sleeves)?.label
            : null,
        config.components.neckline
            ? COMPONENTS.neckline.find(c => c.value === config.components.neckline)?.label
            : null,
        config.components.length
            ? COMPONENTS.length.find(c => c.value === config.components.length)?.label + ' length'
            : null,
    ].filter(Boolean).join(', ');

    const productName = styleParts || 'Custom Garment';

    function SpecLine({ label, value }: { label: string; value: string }) {
        if (!value) return null;
        return (
            <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs font-medium text-slate-800 text-right max-w-[60%] truncate">{value}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 h-full overflow-y-auto">

            {/* Product name */}
            <div>
                <motion.h2
                    key={productName}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    className="text-lg font-bold text-slate-900 leading-snug"
                >
                    {productName}
                </motion.h2>
                {compParts && (
                    <motion.p
                        key={compParts}
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-slate-500 mt-0.5"
                    >
                        {compParts}
                    </motion.p>
                )}
            </div>

            {/* Color preview */}
            {(config.baseColor || config.accentColor) && (
                <div className="flex gap-2 items-center">
                    {[
                        { c: config.baseColor,   label: 'Main'   },
                        { c: config.accentColor, label: 'Accent' },
                    ].filter(x => x.c).map(x => (
                        <div key={x.label} className="flex items-center gap-1.5">
                            <div
                                className="w-7 h-7 rounded-lg border border-slate-200 shadow-sm"
                                style={{ backgroundColor: x.c }}
                            />
                            <span className="text-[10px] text-slate-400">{x.label}</span>
                        </div>
                    ))}
                    {fabricLabel && (
                        <span className="ml-auto text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                            {fabricLabel}
                        </span>
                    )}
                </div>
            )}

            {/* Spec summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <SpecLine label="Garment"  value={garment?.label ?? ''} />
                <SpecLine label="Style"    value={garment?.styles.find(s => s.value === config.style)?.label ?? ''} />
                <SpecLine label="Fabric"   value={fabricLabel} />
                <SpecLine label="Neckline" value={COMPONENTS.neckline.find(c => c.value === config.components.neckline)?.label ?? ''} />
                <SpecLine label="Sleeves"  value={COMPONENTS.sleeves.find(c => c.value === config.components.sleeves)?.label ?? ''} />
                <SpecLine label="Length"   value={COMPONENTS.length.find(c => c.value === config.components.length)?.label ?? ''} />
                <SpecLine label="Size"     value={config.sizeStandard} />
                {config.details.length > 0 && (
                    <SpecLine
                        label="Details"
                        value={config.details.map(v => DESIGN_DETAILS.find(d => d.value === v)?.label ?? v).join(', ')}
                    />
                )}
            </div>

            {/* Price breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1">
                    Estimated Price
                    <Info className="w-3 h-3 text-slate-300" title="Final price confirmed by tailor before work begins" />
                </p>

                {config.garmentType ? (
                    <>
                        <div className="space-y-2 text-sm text-slate-500">
                            <div className="flex justify-between">
                                <span>Base ({garment?.label ?? ''})</span>
                                <span className="font-medium text-slate-700">₾{base}</span>
                            </div>
                            {fabricAddon > 0 && (
                                <div className="flex justify-between">
                                    <span>{fabricLabel}</span>
                                    <span className="font-medium text-slate-700">+₾{fabricAddon}</span>
                                </div>
                            )}
                            {detailsAddon > 0 && (
                                <div className="flex justify-between">
                                    <span>Details ({config.details.length})</span>
                                    <span className="font-medium text-slate-700">+₾{detailsAddon}</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-baseline">
                            <span className="text-sm font-semibold text-slate-900">Total</span>
                            <motion.span
                                key={total}
                                initial={{ scale: 0.92, opacity: 0.6 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-2xl font-bold text-slate-900 tabular-nums"
                            >
                                ₾{total}
                            </motion.span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                            Tailor confirms exact price before starting
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-slate-400">Select a garment to see pricing</p>
                )}
            </div>

            {/* Trust note */}
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Your design goes to a tailor who confirms all details with you first. No payment now.</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* CTA */}
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
                onClick={onSubmit}
                disabled={submitting || !config.garmentType}
                className={`
                    w-full flex items-center justify-center gap-2 font-semibold py-4 rounded-2xl
                    transition-all active:scale-[0.98] text-sm
                    ${config.garmentType
                        ? 'bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }
                `}
            >
                {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    : <><Send className="w-4 h-4" /> Submit to Tailor</>
                }
            </button>
        </div>
    );
}

// ─── Success overlay ──────────────────────────────────────────────────────────

function SuccessOverlay() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl"
        >
            <div className="text-center px-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"
                >
                    <Check className="w-10 h-10 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Design Submitted!</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    A tailor will review your design and reach out to confirm the details.
                </p>
                <p className="text-xs text-slate-400 mt-4">Redirecting to your dashboard…</p>
            </div>
        </motion.div>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DesignerApp() {
    const navigate = useNavigate();

    const [config, setConfig] = useState<DesignConfig>(() => {
        const pending = getPendingOrder();
        if (pending?.type === 'custom' && pending.design) {
            return restoreConfig(pending.design as Record<string, unknown>);
        }
        return INITIAL_CONFIG;
    });

    const [submitting,  setSubmitting]  = useState(false);
    const [submitted,   setSubmitted]   = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [guideStep,   setGuideStep]   = useState<MeasurementKey | null>(null);

    const { total } = useMemo(() => calcPrice(config), [config]);

    const handleSubmit = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            savePendingOrder({ type: 'custom', design: config as unknown as Record<string, unknown> });
            saveReturnTo('/design');
            navigate('/signin');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch('/api/orders', {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept':        'application/json',
                },
                body: JSON.stringify({ order_type: 'custom', custom_design_data: config }),
            });
            if (!res.ok) {
                const err = await res.json();
                setSubmitError(err.message ?? 'Something went wrong.');
                return;
            }
            clearPendingOrder();
            setSubmitted(true);
            setTimeout(() => navigate('/customer-dashboard'), 3000);
        } catch {
            setSubmitError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }, [config, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Helmet>
                <title>Design Studio | Kere</title>
                <meta name="description" content="Design your custom garment. Choose style, fabric, and measurements — a local Georgian tailor will craft it for you." />
            </Helmet>

            {/* ── Studio header ── */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <Link to="/" className="text-lg font-bold text-slate-900 hover:text-slate-700 transition-colors shrink-0">
                        Kere
                    </Link>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 hidden sm:block">Custom Design Studio</span>

                        {config.garmentType && (
                            <motion.div
                                key={total}
                                initial={{ scale: 0.94, opacity: 0.7 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-slate-900 text-white text-sm font-bold px-4 py-1.5 rounded-xl tabular-nums"
                            >
                                ₾{total}
                            </motion.div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── 3-panel studio ── */}
            <div className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 h-full lg:h-[calc(100vh-7rem)]">

                    {/* LEFT — Controls */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900">Customize</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Pick your style, fabric and details</p>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-2 min-h-0">
                            <ControlsPanel
                                config={config}
                                setConfig={setConfig}
                                onOpenMeasureGuide={k => setGuideStep(k)}
                            />
                        </div>
                    </div>

                    {/* CENTER — Preview */}
                    <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col p-5 lg:p-8 min-h-[400px]">
                        <PreviewPanel config={config} />
                        <AnimatePresence>
                            {submitted && <SuccessOverlay />}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT — Summary */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900">Order Summary</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Review your design before submitting</p>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 flex flex-col">
                            <SummaryPanel
                                config={config}
                                submitting={submitting}
                                submitted={submitted}
                                error={submitError}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* Measurement guide modal */}
            <MeasurementGuideModal
                open={guideStep !== null}
                onClose={() => setGuideStep(null)}
                initialStep={guideStep ?? 'chest'}
            />
        </div>
    );
}
