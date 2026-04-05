import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

const TABS = ['Dresses', 'Shirts', 'Pants', 'Jackets', 'Scarves', 'Hats'];

const CATEGORY_ITEMS: Record<string, { image: string; label: string }[]> = {
    Dresses: [
        { image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80', label: 'Floral Wrap Dress' },
        { image: 'https://images.unsplash.com/photo-1566479179817-e0a0b22b5ef3?w=600&q=80', label: 'Summer Maxi Dress' },
        { image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80', label: 'A-Line Midi Dress' },
    ],
    Shirts: [
        { image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&q=80', label: 'Linen Button Shirt' },
        { image: 'https://images.unsplash.com/photo-1598032895455-f6fc4c8db9e6?w=600&q=80', label: 'Silk Blouse' },
        { image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80', label: 'Embroidered Shirt' },
    ],
    Pants: [
        { image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4d2f?w=600&q=80', label: 'Wide Leg Trousers' },
        { image: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=600&q=80', label: 'Tailored Chinos' },
        { image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80', label: 'Linen Pants' },
    ],
    Jackets: [
        { image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', label: 'Wool Blazer' },
        { image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', label: 'Trench Coat' },
        { image: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=80', label: 'Denim Jacket' },
    ],
    Scarves: [
        { image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&q=80', label: 'Silk Scarf' },
        { image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80', label: 'Wool Wrap' },
        { image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80', label: 'Printed Bandana' },
    ],
    Hats: [
        { image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', label: 'Straw Hat' },
        { image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80', label: 'Wool Cap' },
        { image: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600&q=80', label: 'Beanie' },
    ],
};

export function CategoriesSection() {
    const [activeTab, setActiveTab] = useState('Dresses');
    const items = CATEGORY_ITEMS[activeTab] ?? [];

    return (
        <section id="categories" className="py-16 md:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Browse by Category</h2>
                    <p className="text-slate-500 text-lg">Hundreds of tailor-made designs across every style.</p>
                </motion.div>

                {/* Pill filter tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-2 mb-10"
                >
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </motion.div>

                {/* 3-column image cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="relative rounded-2xl overflow-hidden aspect-[3/4] group cursor-pointer"
                        >
                            <img
                                src={item.image}
                                alt={item.label}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Dark overlay */}
                            <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/55 transition-colors" />

                            {/* Card content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-6">
                                <h3 className="text-white font-semibold text-lg mb-3">{item.label}</h3>
                                <Link
                                    to={`/marketplace?category=${activeTab.toLowerCase()}`}
                                    className="inline-flex items-center justify-center border border-white text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white hover:text-slate-900 transition-colors w-fit"
                                >
                                    Design Yours
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
