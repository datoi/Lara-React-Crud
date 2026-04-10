import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type MeasurementKey = 'chest' | 'waist' | 'hips' | 'length' | 'chart';

interface Props {
    open: boolean;
    onClose: () => void;
    initialStep?: MeasurementKey;
}

const STEPS: { key: MeasurementKey; label: string }[] = [
    { key: 'chest',  label: 'Chest'  },
    { key: 'waist',  label: 'Waist'  },
    { key: 'hips',   label: 'Hips'   },
    { key: 'length', label: 'Length' },
    { key: 'chart',  label: 'Size Chart' },
];

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
            {/* body outline */}
            <ellipse cx="60" cy="28" rx="16" ry="18" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M44 44 C30 50 22 72 24 110 L96 110 C98 72 90 50 76 44" stroke="#94a3b8" strokeWidth="1.5" />
            {/* arms */}
            <path d="M44 50 C36 56 30 80 32 100" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M76 50 C84 56 90 80 88 100" stroke="#94a3b8" strokeWidth="1.5" />
            {/* chest measurement line */}
            <line x1="24" y1="65" x2="96" y2="65" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="24" cy="65" r="3" fill="#1e293b" />
            <circle cx="96" cy="65" r="3" fill="#1e293b" />
            {/* arrows */}
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
            {/* waist line — narrowest point */}
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
            {/* hips line */}
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
            {/* shoulder dot */}
            <circle cx="45" cy="42" r="3" fill="#1e293b" />
            {/* length arrow */}
            <line x1="38" y1="42" x2="38" y2="160" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="38" cy="160" r="3" fill="#1e293b" />
            <path d="M35 46 L38 42 L41 46" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M35 156 L38 160 L41 156" stroke="#1e293b" strokeWidth="1.5" />
        </svg>
    );
}

/* ── Step content ─────────────────────────────────────────── */

const STEP_CONTENT: Record<Exclude<MeasurementKey, 'chart'>, {
    title: string;
    tip: string;
    steps: string[];
    Diagram: () => JSX.Element;
}> = {
    chest: {
        title: 'Chest Measurement',
        tip: 'Wear a light shirt or no shirt for the most accurate result.',
        steps: [
            'Stand straight with arms relaxed at your sides.',
            'Wrap the measuring tape around the fullest part of your chest — usually at nipple level.',
            'Keep the tape horizontal and parallel to the floor.',
            'Breathe normally — do not suck in or expand your chest.',
            'Read the tape where it meets itself. That number in cm is your chest measurement.',
        ],
        Diagram: ChestSvg,
    },
    waist: {
        title: 'Waist Measurement',
        tip: 'Measure over bare skin or thin clothing for the best fit.',
        steps: [
            'Stand naturally with feet together.',
            'Locate your natural waist — the narrowest point of your torso, just above the belly button.',
            'Wrap the tape around this point, keeping it horizontal.',
            'The tape should be snug but not tight — you should be able to slide one finger under it.',
            'Read the measurement where the tape overlaps.',
        ],
        Diagram: WaistSvg,
    },
    hips: {
        title: 'Hips Measurement',
        tip: 'Stand with feet together for the widest hip reading.',
        steps: [
            'Stand with your feet together.',
            'Find the widest point of your hips and buttocks — usually about 20 cm below your natural waist.',
            'Wrap the tape around this widest point, keeping it level all the way around.',
            'Make sure the tape is not twisted and lies flat against your body.',
            'Record the measurement in cm.',
        ],
        Diagram: HipsSvg,
    },
    length: {
        title: 'Length Measurement',
        tip: 'Have a friend help for the most accurate reading.',
        steps: [
            'Stand upright with good posture.',
            'For tops: start at the highest point of your shoulder (where the seam would sit).',
            'For bottoms: start at your natural waist.',
            'Run the tape straight down to where you want the garment to end.',
            'Keep the tape straight — do not follow the curve of the body.',
        ],
        Diagram: LengthSvg,
    },
};

/* ── Main modal ─────────────────────────────────────────────── */

export function MeasurementGuideModal({ open, onClose, initialStep = 'chest' }: Props) {
    const [activeStep, setActiveStep] = useState<MeasurementKey>(initialStep);

    useEffect(() => {
        if (open) setActiveStep(initialStep);
    }, [open, initialStep]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

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
                    transition={{ duration: 0.2 }}
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
                            <h2 className="font-bold text-slate-900 text-base">Measurement Guide</h2>
                            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex overflow-x-auto border-b border-slate-100 px-2 gap-1 scrollbar-none">
                            {STEPS.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setActiveStep(s.key)}
                                    className={`flex-shrink-0 text-xs font-medium px-3 py-3 border-b-2 transition-colors ${
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
                                        transition={{ duration: 0.25 }}
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
                                        transition={{ duration: 0.25 }}
                                        className="p-5"
                                    >
                                        <p className="text-xs text-slate-500 mb-4">All measurements in <strong>cm</strong>. If you are between sizes, choose the larger one and let your tailor adjust.</p>
                                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-900 text-white">
                                                        {['Size', 'Chest', 'Waist', 'Hips', 'Length'].map(h => (
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
                                        <p className="text-xs text-slate-400 mt-3">Length refers to top/shirt length from shoulder seam. For trousers, provide inseam separately.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer nav */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={goPrev}
                                disabled={activeStep === 'chest'}
                                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            <span className="text-xs text-slate-400">
                                {activeStep === 'chart' ? '5 / 5' : `${currentIndex + 1} / 5`}
                            </span>
                            <button
                                onClick={goNext}
                                disabled={activeStep === 'chart'}
                                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
