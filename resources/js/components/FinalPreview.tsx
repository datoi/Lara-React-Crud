import { motion } from 'motion/react';
import { ArrowLeft, Download, Send, Check, Loader2, Info } from 'lucide-react';
import { GarmentPreview } from './GarmentPreview';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { getAuthToken, saveReturnTo, savePendingOrder, clearPendingOrder } from '../hooks/useAuth';
import { calcPrice, getGarment, DESIGN_DETAILS, FABRICS, type DesignConfig } from '../designer/config';

interface FinalPreviewProps {
    config: DesignConfig;
    onBack: () => void;
}

function SpecRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
            <span className="text-sm font-medium text-slate-900 text-right">{value}</span>
        </div>
    );
}

export function FinalPreview({ config, onBack }: FinalPreviewProps) {
    const navigate = useNavigate();
    const { base, fabric: fabricAddon, details: detailsAddon, total } = calcPrice(config);

    const [submitted,   setSubmitted]   = useState(false);
    const [submitting,  setSubmitting]  = useState(false);
    const [submitError, setSubmitError] = useState('');

    const garment     = getGarment(config.garmentType);
    const fabricLabel = FABRICS.find(f => f.value === config.fabric)?.label ?? '';

    const handleDownload = () => {
        const detailLabels = config.details
            .map(v => DESIGN_DETAILS.find(d => d.value === v)?.label ?? v)
            .join(', ');

        const lines = [
            'KERE DESIGN SPECIFICATION',
            '=========================',
            `Generated: ${new Date().toLocaleString()}`,
            '',
            'GARMENT',
            `Type:  ${garment?.label ?? config.garmentType}`,
            `Style: ${config.style}`,
            '',
            'STYLE COMPONENTS',
            `Neckline: ${config.components.neckline || '—'}`,
            `Sleeves:  ${config.components.sleeves  || '—'}`,
            `Length:   ${config.components.length   || '—'}`,
            '',
            'FABRIC & COLOR',
            `Fabric:       ${fabricLabel}`,
            `Base Color:   ${config.baseColor}`,
            `Accent Color: ${config.accentColor}`,
            '',
            'DESIGN DETAILS',
            detailLabels || 'None',
            '',
            'SIZE',
            `Standard: ${config.sizeStandard}`,
            `Chest:    ${config.sizeCm.chest  || '—'} cm`,
            `Waist:    ${config.sizeCm.waist  || '—'} cm`,
            `Hips:     ${config.sizeCm.hips   || '—'} cm`,
            `Length:   ${config.sizeCm.length || '—'} cm`,
            `Inseam:   ${config.sizeCm.inseam || '—'} cm`,
            `Height:   ${config.height        || '—'} cm`,
            '',
            'NOTES',
            config.notes || 'None',
            '',
            'ESTIMATED PRICE',
            `Base:    ₾${base}`,
            fabricAddon  > 0 ? `Fabric:  +₾${fabricAddon}`  : '',
            detailsAddon > 0 ? `Details: +₾${detailsAddon}` : '',
            `Total:   ₾${total}`,
        ].filter(l => l !== undefined).join('\n');

        const blob = new Blob([lines], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `kere-design-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSubmit = async () => {
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
                body: JSON.stringify({
                    order_type:         'custom',
                    custom_design_data: config,
                }),
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
    };

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Design Summary</h2>
                <p className="text-slate-500 mb-3">Review everything before submitting to a tailor.</p>
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    Your design will be sent to a tailor who will confirm details with you before starting
                </div>
            </div>

            {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
                    >
                        <Check className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Design submitted successfully!</h3>
                    <p className="text-slate-500">A tailor will review your design and contact you to confirm details before starting.</p>
                    <p className="text-sm text-slate-400 mt-4">Taking you to your dashboard…</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Preview + palette + details */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 p-4">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Your Design</div>
                            <GarmentPreview config={config} size="full" />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Color Palette</div>
                            <div className="flex gap-3">
                                {[
                                    { label: 'Base',   color: config.baseColor },
                                    { label: 'Accent', color: config.accentColor },
                                ].filter(c => c.color).map(c => (
                                    <div key={c.label} className="flex flex-col items-center gap-1.5">
                                        <div className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm" style={{ backgroundColor: c.color }} />
                                        <span className="text-xs text-slate-400">{c.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {config.details.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Design Details</div>
                                <div className="flex flex-wrap gap-2">
                                    {config.details.map(val => {
                                        const d = DESIGN_DETAILS.find(x => x.value === val);
                                        return d ? (
                                            <span key={val} className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                                                {d.icon} {d.label}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {config.notes && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tailor Notes</div>
                                <p className="text-sm text-slate-600 leading-relaxed">{config.notes}</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Spec sheet + price + actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="space-y-4"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Garment Specs</div>
                            <SpecRow label="Type"     value={garment?.label ?? (config.garmentType ?? '')} />
                            <SpecRow label="Style"    value={config.style} />
                            <SpecRow label="Fabric"   value={fabricLabel} />
                            <SpecRow label="Neckline" value={config.components.neckline} />
                            <SpecRow label="Sleeves"  value={config.components.sleeves} />
                            <SpecRow label="Length"   value={config.components.length} />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Size & Measurements</div>
                            <SpecRow label="Standard Size" value={config.sizeStandard} />
                            {config.sizeCm.chest  && <SpecRow label="Chest"  value={`${config.sizeCm.chest} cm`}  />}
                            {config.sizeCm.waist  && <SpecRow label="Waist"  value={`${config.sizeCm.waist} cm`}  />}
                            {config.sizeCm.hips   && <SpecRow label="Hips"   value={`${config.sizeCm.hips} cm`}   />}
                            {config.sizeCm.length && <SpecRow label="Length" value={`${config.sizeCm.length} cm`} />}
                            {config.sizeCm.inseam && <SpecRow label="Inseam" value={`${config.sizeCm.inseam} cm`} />}
                            {config.height        && <SpecRow label="Height" value={`${config.height} cm`}        />}
                        </div>

                        {/* Price estimate */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                <span>Estimated Price</span>
                                <Info className="w-3.5 h-3.5 text-slate-400" title="Final price confirmed by tailor" />
                            </div>
                            <div className="space-y-1.5 text-sm text-slate-600">
                                <div className="flex justify-between">
                                    <span>Base ({garment?.label ?? config.garmentType})</span>
                                    <span>₾{base}</span>
                                </div>
                                {fabricAddon > 0 && (
                                    <div className="flex justify-between">
                                        <span>Fabric ({fabricLabel})</span>
                                        <span>+₾{fabricAddon}</span>
                                    </div>
                                )}
                                {detailsAddon > 0 && (
                                    <div className="flex justify-between">
                                        <span>Design details ({config.details.length})</span>
                                        <span>+₾{detailsAddon}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                                <span className="font-semibold text-slate-900">Total estimate</span>
                                <span className="text-xl font-bold text-slate-900">₾{total}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2">Tailor confirms final price before starting work.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <p className="text-xs text-slate-400 text-center">
                                You can adjust details later with your tailor. No payment required now.
                            </p>
                            {submitError && (
                                <p className="text-xs text-red-500 text-center">{submitError}</p>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {submitting ? 'Submitting…' : 'Submit to Tailor'}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-medium py-3.5 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download Design Specs
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
