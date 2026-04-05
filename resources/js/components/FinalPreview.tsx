import { motion } from 'motion/react';
import { ArrowLeft, Download, Send, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

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
    const [submitted, setSubmitted] = useState(false);

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

    const handleSubmit = () => {
        setSubmitted(true);
        setTimeout(() => navigate('/'), 2500);
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
                    <p className="text-sm text-slate-400 mt-4">Returning to home…</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Color palette preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Color Palette</div>
                            <div className="flex gap-3">
                                {[
                                    { label: 'Base', color: design.baseColor },
                                    { label: 'Light', color: design.lighterShade },
                                    { label: 'Dark', color: design.darkerShade },
                                    { label: 'Accent', color: design.additionalColor },
                                ].filter(c => c.color).map(c => (
                                    <div key={c.label} className="flex flex-col items-center gap-1.5">
                                        <div className="w-12 h-12 rounded-xl border border-slate-200 shadow-sm" style={{ backgroundColor: c.color }} />
                                        <span className="text-xs text-slate-400">{c.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Design elements */}
                        {design.designElements.cuts.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
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
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
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

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSubmit}
                                className="flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98]"
                            >
                                <Send className="w-4 h-4" />
                                Submit to Tailor
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
