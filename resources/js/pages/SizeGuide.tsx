import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';

const measurements = [
    {
        key: 'Chest',
        emoji: '📏',
        steps: [
            'Wrap the tape measure around the fullest part of your chest, directly under your armpits.',
            'Keep the tape parallel to the floor.',
            "Breathe normally and don't pull the tape too tight — it should rest snugly without compressing.",
            'Note the measurement in centimetres.',
        ],
        tip: 'For a relaxed fit add 4–6 cm. For a fitted look, use your exact measurement.',
    },
    {
        key: 'Waist',
        emoji: '📐',
        steps: [
            'Find your natural waist — the narrowest part of your torso, typically 2–3 cm above your navel.',
            'Wrap the tape all the way around, keeping it parallel to the floor.',
            "Don't hold your breath or suck in your stomach.",
            'Note the measurement in centimetres.',
        ],
        tip: 'If you prefer a looser waistband, add 2–4 cm to the measurement you provide.',
    },
    {
        key: 'Hips',
        emoji: '📏',
        steps: [
            'Stand with your feet together.',
            'Place the tape around the fullest part of your hips and seat — usually 18–22 cm below your natural waist.',
            "Keep the tape parallel to the floor and don't pull it tight.",
            'Note the measurement in centimetres.',
        ],
        tip: 'For trousers and skirts, hip measurement is critical. When in doubt, go 2 cm larger.',
    },
    {
        key: 'Length',
        emoji: '📐',
        steps: [
            'For dresses and tops: measure from the top of your shoulder (where a seam would sit) straight down to where you want the garment to end.',
            'For trousers: measure from your natural waist down to your ankle bone.',
            'Stand straight and have someone else take this measurement if possible.',
            'Note the measurement in centimetres.',
        ],
        tip: 'Specify if you want the garment hemmed at knee, midi, or full length when ordering.',
    },
];

const sizeChart = [
    { size: 'XS', chest: '76–84', waist: '60–68', hips: '84–92' },
    { size: 'S',  chest: '84–92', waist: '68–76', hips: '92–100' },
    { size: 'M',  chest: '92–100', waist: '76–84', hips: '100–108' },
    { size: 'L',  chest: '100–108', waist: '84–92', hips: '108–116' },
    { size: 'XL', chest: '108–116', waist: '92–100', hips: '116–124' },
    { size: 'XXL', chest: '116–124', waist: '100–108', hips: '124–132' },
];

export default function SizeGuide() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero */}
            <section className="py-16 md:py-24 bg-slate-900 text-white text-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Size & Fit</p>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">Measurement Guide</h1>
                        <p className="text-slate-300 max-w-xl mx-auto">
                            Accurate measurements mean a perfect fit. Follow these steps to measure yourself at home in under 5 minutes.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* What you need */}
            <section className="py-10 bg-slate-50 border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-6 items-center">
                        <p className="font-semibold text-slate-900 text-sm">What you'll need:</p>
                        {['A soft measuring tape', 'Light-fitting clothing or measure directly on skin', 'A mirror or a friend to help'].map(item => (
                            <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Measurement steps */}
            <section className="py-16 md:py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                    {measurements.map((m, i) => (
                        <motion.div
                            key={m.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            className="grid md:grid-cols-5 gap-8 pb-10 border-b border-slate-100 last:border-0"
                        >
                            <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-100 rounded-2xl aspect-square text-5xl">
                                {m.emoji}
                            </div>
                            <div className="md:col-span-4">
                                <h2 className="text-2xl font-black text-slate-900 mb-4">{m.key}</h2>
                                <ol className="space-y-2 mb-4">
                                    {m.steps.map((step, si) => (
                                        <li key={si} className="flex gap-3 text-sm text-slate-600">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                                                {si + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                                    <span className="font-semibold">Tip: </span>{m.tip}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Size chart */}
            <section className="py-16 md:py-24 bg-slate-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-10 text-center"
                    >
                        <h2 className="text-3xl font-black text-slate-900 mb-3">Standard Size Chart</h2>
                        <p className="text-slate-500 text-sm">All measurements in centimetres. These are body measurements, not garment measurements.</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-6 py-4 text-left font-semibold">Size</th>
                                    <th className="px-6 py-4 text-left font-semibold">Chest (cm)</th>
                                    <th className="px-6 py-4 text-left font-semibold">Waist (cm)</th>
                                    <th className="px-6 py-4 text-left font-semibold">Hips (cm)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sizeChart.map((row, i) => (
                                    <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="px-6 py-3.5 font-bold text-slate-900">{row.size}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{row.chest}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{row.waist}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{row.hips}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                    <p className="text-xs text-slate-400 mt-4 text-center">
                        Not sure which size fits? Enter your exact measurements when ordering — your tailor will cut to your measurements directly.
                    </p>
                </div>
            </section>
        <Footer />
        </div>
    );
}
