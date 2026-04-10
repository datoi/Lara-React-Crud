import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { Star, MapPin, CheckCircle } from 'lucide-react';

const tailors = [
    {
        name: 'Nino Beridze',
        specialty: 'Dresses & Evening Wear',
        location: 'Vake, Tbilisi',
        experience: '12 years',
        rating: 4.9,
        reviews: 87,
        bio: 'Nino trained at the Tbilisi State Academy of Arts and specializes in flowing silhouettes and intricate embroidery. Her evening dresses have been worn at Georgian fashion events across Europe.',
        emoji: '👗',
    },
    {
        name: 'Giorgi Maisuradze',
        specialty: 'Suits & Tailored Trousers',
        location: 'Saburtalo, Tbilisi',
        experience: '18 years',
        rating: 5.0,
        reviews: 142,
        bio: "Giorgi learned the craft from his father and grandfather. He specializes in structured menswear and precision-cut women's trousers. Every seam is finished by hand.",
        emoji: '🧥',
    },
    {
        name: 'Tamar Kvanchilashvili',
        specialty: 'Linen & Summer Wear',
        location: 'Vera, Tbilisi',
        experience: '8 years',
        rating: 4.8,
        reviews: 63,
        bio: 'Tamar focuses on breathable natural fabrics — linen, cotton, and silk. Her designs are rooted in Georgian craft traditions while staying firmly modern and wearable.',
        emoji: '🌿',
    },
    {
        name: 'Levan Gogishvili',
        specialty: 'Jackets & Outerwear',
        location: 'Didube, Tbilisi',
        experience: '15 years',
        rating: 4.7,
        reviews: 59,
        bio: 'Levan built his reputation crafting wool coats and lined blazers. His workshop is known for immaculate finishing — buttonholes sewn by hand, full canvas construction on every jacket.',
        emoji: '🧶',
    },
    {
        name: 'Ana Jishkariani',
        specialty: 'Scarves & Accessories',
        location: 'Old Town, Tbilisi',
        experience: '10 years',
        rating: 4.9,
        reviews: 41,
        bio: 'Ana hand-weaves silk and wool scarves on a traditional loom. Each piece takes 2–3 days to complete and is unique. She also creates custom headwear and shawls.',
        emoji: '🧣',
    },
    {
        name: 'Mari Tsereteli',
        specialty: 'Shirts & Blouses',
        location: 'Gldani, Tbilisi',
        experience: '6 years',
        rating: 4.8,
        reviews: 34,
        bio: 'Mari combines traditional Georgian needlework patterns with contemporary blouse silhouettes. Her embroidered shirts have become a signature style among Kere customers.',
        emoji: '✂️',
    },
];

export default function OurTailors() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero */}
            <section className="py-16 md:py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">The Makers</p>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">Meet Our Tailors</h1>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                            Every piece on Kere is made by a real person with a real skill. Get to know the craftspeople
                            behind your next favourite garment.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Tailors grid */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tailors.map((tailor, i) => (
                            <motion.div
                                key={tailor.name}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {/* Avatar area */}
                                <div className="bg-slate-100 h-40 flex items-center justify-center text-6xl">
                                    {tailor.emoji}
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{tailor.name}</h3>
                                            <p className="text-sm text-slate-500">{tailor.specialty}</p>
                                        </div>
                                        <CheckCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{tailor.bio}</p>
                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{tailor.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            <span className="font-medium text-slate-700">{tailor.rating}</span>
                                            <span className="text-slate-400">({tailor.reviews})</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-400">{tailor.experience} experience</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Join CTA */}
            <section className="py-16 md:py-24 bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Are you a tailor?</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Join Kere and reach customers across Georgia. Set up your storefront, list your products,
                            and start receiving orders — all through a single dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link to="/register/tailor" className="bg-slate-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-700 transition-colors">
                                Apply as a Tailor
                            </Link>
                            <Link to="/marketplace" className="border border-slate-300 text-slate-700 font-semibold px-8 py-3 rounded-full hover:border-slate-500 transition-colors">
                                Browse the Marketplace
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        <Footer />
        </div>
    );
}
