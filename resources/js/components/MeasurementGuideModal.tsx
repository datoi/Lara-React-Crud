import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

export type MeasurementKey = 'chest' | 'waist' | 'hips' | 'length' | 'chart';

interface Props {
    open: boolean;
    onClose: () => void;
    initialStep?: MeasurementKey;
}

const SIZE_CHART = [
    { size: 'XS', chest: '78–82',  waist: '60–64',  hips: '84–88',  length: '58–60' },
    { size: 'S',  chest: '82–86',  waist: '64–68',  hips: '88–92',  length: '60–62' },
    { size: 'M',  chest: '86–90',  waist: '68–72',  hips: '92–96',  length: '62–64' },
    { size: 'L',  chest: '90–94',  waist: '72–76',  hips: '96–100', length: '64–66' },
    { size: 'XL', chest: '94–100', waist: '76–82',  hips: '100–106', length: '66–68' },
];

/* ── SVG diagrams ─────────────────────────────────────────── */

function ChestSvg() {
    return (
        <svg viewBox="0 0 120 160" className="w-32 h-40 mx-auto" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="60" cy="28" rx="16" ry="18" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M44 44 C30 50 22 72 24 110 L96 110 C98 72 90 50 76 44" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M44 50 C36 56 30 80 32 100" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M76 50 C84 56 90 80 88 100" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="24" y1="65" x2="96" y2="65" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="24" cy="65" r="3" fill="#1e293b" />
            <circle cx="96" cy="65" r="3" fill="#1e293b" />
            <path d="M28 62 L24 65 L28 68" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M92 62 L96 65 L92 68" stroke="#1e293b" strokeWidth="1.5" />
        </svg>
    );
}

function WaistSvg() {
    return (
        <svg viewBox="0 0 120 160" className="w-32 h-40 mx-auto" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="60" cy="28" rx="16" ry="18" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M44 44 C30 50 22 72 24 110 L96 110 C98 72 90 50 76 44" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M44 50 C36 56 30 80 32 100" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M76 50 C84 56 90 80 88 100" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="28" y1="84" x2="92" y2="84" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="28" cy="84" r="3" fill="#1e293b" />
            <circle cx="92" cy="84" r="3" fill="#1e293b" />
            <path d="M32 81 L28 84 L32 87" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M88 81 L92 84 L88 87" stroke="#1e293b" strokeWidth="1.5" />
        </svg>
    );
}

function HipsSvg() {
    return (
        <svg viewBox="0 0 120 180" className="w-32 h-40 mx-auto" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="60" cy="28" rx="16" ry="18" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M44 44 C28 54 20 80 22 120 C22 140 40 152 60 152 C80 152 98 140 98 120 C100 80 92 54 76 44" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="22" y1="112" x2="98" y2="112" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="22" cy="112" r="3" fill="#1e293b" />
            <circle cx="98" cy="112" r="3" fill="#1e293b" />
            <path d="M26 109 L22 112 L26 115" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M94 109 L98 112 L94 115" stroke="#1e293b" strokeWidth="1.5" />
        </svg>
    );
}

function LengthSvg() {
    return (
        <svg viewBox="0 0 120 200" className="w-32 h-44 mx-auto" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="60" cy="22" rx="14" ry="16" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M46 36 C36 44 30 70 32 120 L50 120 L54 160 L66 160 L70 120 L88 120 C90 70 84 44 74 36" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="45" cy="42" r="3" fill="#1e293b" />
            <line x1="38" y1="42" x2="38" y2="160" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="38" cy="160" r="3" fill="#1e293b" />
            <path d="M35 46 L38 42 L41 46" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M35 156 L38 160 L41 156" stroke="#1e293b" strokeWidth="1.5" />
        </svg>
    );
}

/* ── Main modal ─────────────────────────────────────────────── */

export function MeasurementGuideModal({ open, onClose, initialStep = 'chest' }: Props) {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState<MeasurementKey>(initialStep);

    useEffect(() => {
        if (open) setActiveStep(initialStep);
    }, [open, initialStep]);

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const STEPS: { key: MeasurementKey; label: string }[] = [
        { key: 'chest',  label: t('measurementGuide.tabChest') },
        { key: 'waist',  label: t('measurementGuide.tabWaist') },
        { key: 'hips',   label: t('measurementGuide.tabHips') },
        { key: 'length', label: t('measurementGuide.tabLength') },
        { key: 'chart',  label: t('measurementGuide.tabSizeChart') },
    ];

    const STEP_CONTENT: Record<Exclude<MeasurementKey, 'chart'>, {
        title: string;
        tip: string;
        steps: string[];
        Diagram: () => JSX.Element;
    }> = {
        chest: {
            title: t('measurementGuide.chestTitle'),
            tip: t('measurementGuide.chestTip'),
            steps: [
                t('measurementGuide.chestStep1'),
                t('measurementGuide.chestStep2'),
                t('measurementGuide.chestStep3'),
                t('measurementGuide.chestStep4'),
                t('measurementGuide.chestStep5'),
            ],
            Diagram: ChestSvg,
        },
        waist: {
            title: t('measurementGuide.waistTitle'),
            tip: t('measurementGuide.waistTip'),
            steps: [
                t('measurementGuide.waistStep1'),
                t('measurementGuide.waistStep2'),
                t('measurementGuide.waistStep3'),
                t('measurementGuide.waistStep4'),
                t('measurementGuide.waistStep5'),
            ],
            Diagram: WaistSvg,
        },
        hips: {
            title: t('measurementGuide.hipsTitle'),
            tip: t('measurementGuide.hipsTip'),
            steps: [
                t('measurementGuide.hipsStep1'),
                t('measurementGuide.hipsStep2'),
                t('measurementGuide.hipsStep3'),
                t('measurementGuide.hipsStep4'),
                t('measurementGuide.hipsStep5'),
            ],
            Diagram: HipsSvg,
        },
        length: {
            title: t('measurementGuide.lengthTitle'),
            tip: t('measurementGuide.lengthTip'),
            steps: [
                t('measurementGuide.lengthStep1'),
                t('measurementGuide.lengthStep2'),
                t('measurementGuide.lengthStep3'),
                t('measurementGuide.lengthStep4'),
                t('measurementGuide.lengthStep5'),
            ],
            Diagram: LengthSvg,
        },
    };

    const measureSteps = STEPS.filter(s => s.key !== 'chart');
    const currentIndex = measureSteps.findIndex(s => s.key === activeStep);

    const goNext = () => {
        if (activeStep === 'chart') return;
        if (currentIndex < measureSteps.length - 1) {
            setActiveStep(measureSteps[currentIndex + 1].key);
        } else {
            setActiveStep('chart');
        }
    };

    const goPrev = () => {
        if (activeStep === 'chart') {
            setActiveStep(measureSteps[measureSteps.length - 1].key);
        } else if (currentIndex > 0) {
            setActiveStep(measureSteps[currentIndex - 1].key);
        }
    };

    const content = activeStep !== 'chart' ? STEP_CONTENT[activeStep] : null;
    const Diagram = content?.Diagram ?? null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="font-bold text-slate-900 text-base">{t('measurementGuide.title')}</h2>
                            <Button variant="ghost" size="sm" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Tabs */}
                        <div className="flex overflow-x-auto border-b border-slate-100 px-2 gap-1 scrollbar-none">
                            {STEPS.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setActiveStep(s.key)}
                                    className={`flex-shrink-0 text-xs font-medium px-3 py-3 border-b-2 transition-colors cursor-pointer ${
                                        activeStep === s.key
                                            ? 'border-slate-900 text-slate-900'
                                            : 'border-transparent text-slate-400 hover:text-slate-700'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="max-h-[65vh] overflow-y-auto">
                            <AnimatePresence mode="wait">
                                {activeStep !== 'chart' && content ? (
                                    <motion.div
                                        key={activeStep}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.5 }}
                                        className="p-5"
                                    >
                                        <div className="flex gap-5 items-start mb-5">
                                            <div className="bg-slate-50 rounded-2xl p-3 flex-shrink-0">
                                                {Diagram && <Diagram />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900 text-base mb-1">{content.title}</h3>
                                                <p className="text-xs text-slate-500 italic mb-3">{content.tip}</p>
                                                <ol className="space-y-2">
                                                    {content.steps.map((step, i) => (
                                                        <li key={i} className="flex gap-2.5 text-sm text-slate-600 leading-snug">
                                                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                {i + 1}
                                                            </span>
                                                            {step}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="chart"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.5 }}
                                        className="p-5"
                                    >
                                        <p className="text-xs text-slate-500 mb-4">{t('measurementGuide.chartNote')}</p>
                                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-900 text-white">
                                                        {[
                                                            t('measurementGuide.colSize'),
                                                            t('measurementGuide.colChest'),
                                                            t('measurementGuide.colWaist'),
                                                            t('measurementGuide.colHips'),
                                                            t('measurementGuide.colLength'),
                                                        ].map(h => (
                                                            <th key={h} className="px-3 py-2.5 text-xs font-semibold text-left">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {SIZE_CHART.map((row, i) => (
                                                        <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                            <td className="px-3 py-2.5 font-bold text-slate-900">{row.size}</td>
                                                            <td className="px-3 py-2.5 text-slate-600">{row.chest}</td>
                                                            <td className="px-3 py-2.5 text-slate-600">{row.waist}</td>
                                                            <td className="px-3 py-2.5 text-slate-600">{row.hips}</td>
                                                            <td className="px-3 py-2.5 text-slate-600">{row.length}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-3">{t('measurementGuide.chartFootnote')}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer nav */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goPrev}
                                disabled={activeStep === 'chest'}
                                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" /> {t('measurementGuide.prev')}
                            </Button>
                            <span className="text-xs text-slate-400">
                                {activeStep === 'chart' ? '5 / 5' : `${currentIndex + 1} / 5`}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goNext}
                                disabled={activeStep === 'chart'}
                                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                            >
                                {t('measurementGuide.next')} <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
