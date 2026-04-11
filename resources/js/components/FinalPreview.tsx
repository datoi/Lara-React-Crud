import { motion } from 'motion/react';
import { ArrowLeft, Download, Send, Check, Loader2, Info } from 'lucide-react';
import { GarmentPreview } from './GarmentPreview';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { getAuthToken, saveReturnTo, savePendingOrder, clearPendingOrder } from '../hooks/useAuth';

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

interface FinalPreviewProps {
    design: DesignState;
    onBack: () => void;
}

const BASE_PRICE: Record<string, number> = {
    dress: 180, shirt: 90, trousers: 120, jacket: 250,
    coat: 320, skirt: 100, suit: 450, blouse: 85,
};
const FABRIC_PREMIUM: Record<string, number> = {
    silk: 80, cashmere: 120, wool: 60, linen: 20, cotton: 0, denim: 15, velvet: 70, leather: 200,
};
function getPriceBreakdown(design: DesignState) {
    const base = BASE_PRICE[design.clothingType ?? ''] ?? 150;
    const fabric = FABRIC_PREMIUM[design.fabric?.toLowerCase() ?? ''] ?? 0;
    const cuts = (design.designElements?.cuts?.length ?? 0) * 15;
    return { base, fabric, cuts, total: base + fabric + cuts };
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

export function FinalPreview({ design, onBack }: FinalPreviewProps) {
    const navigate = useNavigate();
    const { base, fabric, cuts, total } = getPriceBreakdown(design);
    const [submitted, setSubmitted]     = useState(false);
    const [submitting, setSubmitting]   = useState(false);
    const [submitError, setSubmitError] = useState('');
    const handleDownload = () => {
        const content = [
            `KERE DESIGN SPECIFICATION`,
            `========================`,
            `Generated: ${new Date().toLocaleString()}`,
            ``,
            `GARMENT`,
            `Type: ${design.clothingType}`,
            `Style: ${design.subcategory}`,
            ``,
            `STYLE DETAILS`,
            `Length: ${design.length}`,
            `Sleeves: ${design.sleeves}`,
            `Neckline: ${design.neckline}`,
            `Fabric: ${design.fabric}`,
            `Texture: ${design.textureMaterial}`,
            ``,
            `COLORS`,
            `Base Color: ${design.baseColor}`,
            `Lighter Shade: ${design.lighterShade}`,
            `Darker Shade: ${design.darkerShade}`,
            `Accent Color: ${design.additionalColor}`,
            ``,
            `SIZE`,
            `Standard: ${design.sizeStandard}`,
            `Chest: ${design.sizeCm.chest || '-'} cm`,
            `Waist: ${design.sizeCm.waist || '-'} cm`,
            `Hips: ${design.sizeCm.hips || '-'} cm`,
            `Length: ${design.sizeCm.length || '-'} cm`,
            `Inseam: ${design.sizeCm.inseam || '-'} cm`,
            ``,
            `DESIGN ELEMENTS`,
            `Cuts: ${design.designElements.cuts.join(', ') || 'None'}`,
            `Customer Height: ${design.designElements.height || '-'} cm`,
            ``,
            `NOTES`,
            design.designElements.customNotes || 'None',
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kere-design-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSubmit = async () => {
        const token = getAuthToken();
        if (!token) {
            // Freeze the full design state before going to login
            savePendingOrder({ type: 'custom', design: design as unknown as Record<string, unknown> });
            saveReturnTo('/design');
            navigate('/signin');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    order_type: 'custom',
                    custom_design_data: design,
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
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Design Summary</h2>
                <p className="text-slate-500">Review everything before submitting to a tailor.</p>
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
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Design Submitted!</h3>
                    <p className="text-slate-500">A tailor will review your design and reach out within 24 hours.</p>
                    <p className="text-sm text-slate-400 mt-4">Taking you to your orders…</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Garment preview hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 p-4">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Your Design</div>
                            <GarmentPreview design={design} size="full" />
                        </div>

                        {/* Color palette */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Color Palette</div>
                            <div className="flex gap-3">
                                {[
                                    { label: 'Base',   color: design.baseColor },
                                    { label: 'Light',  color: design.lighterShade },
                                    { label: 'Dark',   color: design.darkerShade },
                                    { label: 'Accent', color: design.additionalColor },
                                ].filter(c => c.color).map(c => (
                                    <div key={c.label} className="flex flex-col items-center gap-1.5">
                                        <div className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm" style={{ backgroundColor: c.color }} />
                                        <span className="text-xs text-slate-400">{c.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Design elements */}
                        {design.designElements.cuts.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Design Elements</div>
                                <div className="flex flex-wrap gap-2">
                                    {design.designElements.cuts.map(cut => (
                                        <span key={cut} className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full">{cut}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {design.designElements.customNotes && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tailor Notes</div>
                                <p className="text-sm text-slate-600 leading-relaxed">{design.designElements.customNotes}</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Spec sheet */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="space-y-4"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Garment Specs</div>
                            <SpecRow label="Type" value={`${design.clothingType} — ${design.subcategory}`} />
                            <SpecRow label="Length" value={design.length} />
                            <SpecRow label="Sleeves" value={design.sleeves} />
                            <SpecRow label="Neckline" value={design.neckline} />
                            <SpecRow label="Fabric" value={design.fabric} />
                            <SpecRow label="Texture" value={design.textureMaterial} />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Size & Measurements</div>
                            <SpecRow label="Standard Size" value={design.sizeStandard} />
                            {design.sizeCm.chest && <SpecRow label="Chest" value={`${design.sizeCm.chest} cm`} />}
                            {design.sizeCm.waist && <SpecRow label="Waist" value={`${design.sizeCm.waist} cm`} />}
                            {design.sizeCm.hips && <SpecRow label="Hips" value={`${design.sizeCm.hips} cm`} />}
                            {design.sizeCm.length && <SpecRow label="Length" value={`${design.sizeCm.length} cm`} />}
                            {design.sizeCm.inseam && <SpecRow label="Inseam" value={`${design.sizeCm.inseam} cm`} />}
                            {design.designElements.height && <SpecRow label="Height" value={`${design.designElements.height} cm`} />}
                        </div>

                        {/* Price estimate */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                <span>Estimated Price</span>
                                <Info className="w-3.5 h-3.5 text-slate-400" title="Final price confirmed by tailor" />
                            </div>
                            <div className="space-y-1.5 text-sm text-slate-600">
                                <div className="flex justify-between">
                                    <span>Base ({design.clothingType ?? 'garment'})</span>
                                    <span>₾{base}</span>
                                </div>
                                {fabric > 0 && (
                                    <div className="flex justify-between">
                                        <span>Fabric ({design.fabric})</span>
                                        <span>+₾{fabric}</span>
                                    </div>
                                )}
                                {cuts > 0 && (
                                    <div className="flex justify-between">
                                        <span>Design elements ({design.designElements.cuts.length})</span>
                                        <span>+₾{cuts}</span>
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
                            {submitError && (
                                <p className="text-xs text-red-500 text-center">{submitError}</p>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Send className="w-4 h-4" />
                                }
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
