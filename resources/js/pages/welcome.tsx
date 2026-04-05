import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ShoppingCart, Palette, Package, Star, ChevronRight, Shirt, ArrowRight, CheckCircle, Truck, RotateCcw, Shield } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    products_count: number;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    colors: string[];
    images: string[];
    is_customizable: boolean;
    category: { name: string; slug: string };
}

interface Props {
    featured: Product[];
    categories: Category[];
}

const categoryEmojis: Record<string, string> = {
    't-shirts': '👕',
    hoodies: '🧥',
    jackets: '🧣',
    pants: '👖',
    hats: '🧢',
    accessories: '👜',
};

function NavBar({ user }: { user: SharedData['auth']['user'] | null }) {
    return (
        <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                        <Shirt className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">ThreadCraft</span>
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    <Link href="/products" className="text-sm text-gray-300 transition hover:text-white">Shop</Link>
                    <Link href="/designer" className="text-sm text-gray-300 transition hover:text-white">Designer</Link>
                    <Link href="/products?category=hoodies" className="text-sm text-gray-300 transition hover:text-white">Hoodies</Link>
                    <Link href="/products?category=t-shirts" className="text-sm text-gray-300 transition hover:text-white">T-Shirts</Link>
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Link href="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white">
                                <ShoppingCart className="h-5 w-5" />
                            </Link>
                            <Link href="/dashboard" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700">
                                Dashboard
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm text-gray-300 transition hover:text-white">Sign in</Link>
                            <Link href="/register" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default function Welcome({ featured, categories }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="ThreadCraft — Custom Clothing Design">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-black font-[Inter] text-white">
                <NavBar user={auth.user} />

                {/* Hero */}
                <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-black to-black" />
                    <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

                    <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
                            <Palette className="h-3.5 w-3.5" />
                            Design. Customize. Wear.
                        </div>
                        <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight md:text-7xl">
                            Your Style,
                            <br />
                            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                                Your Rules
                            </span>
                        </h1>
                        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 md:text-xl">
                            Design custom clothing from scratch or personalize our premium blanks.
                            From t-shirts to hoodies — make it uniquely yours.
                        </p>
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <Link
                                href="/designer"
                                className="flex items-center gap-2 rounded-full bg-violet-600 px-8 py-4 text-base font-semibold transition hover:bg-violet-700 active:scale-95"
                            >
                                <Palette className="h-5 w-5" />
                                Start Designing
                            </Link>
                            <Link
                                href="/products"
                                className="flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-semibold transition hover:bg-white/10"
                            >
                                Browse Products
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="mt-20 grid grid-cols-3 gap-8 border-t border-white/10 pt-12">
                            {[
                                { value: '50K+', label: 'Designs Created' },
                                { value: '99%', label: 'Satisfaction Rate' },
                                { value: '48hr', label: 'Fast Delivery' },
                            ].map(s => (
                                <div key={s.label}>
                                    <div className="text-2xl font-black text-violet-400 md:text-4xl">{s.value}</div>
                                    <div className="mt-1 text-sm text-gray-500">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Categories */}
                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-12 text-center">
                            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Shop by Category</h2>
                            <p className="text-gray-400">Every garment is a blank canvas waiting for your creativity.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                            {categories.map(cat => (
                                <Link
                                    key={cat.id}
                                    href={`/products?category=${cat.slug}`}
                                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition hover:border-violet-500/50 hover:bg-violet-500/10"
                                >
                                    <div className="mb-3 text-4xl">{categoryEmojis[cat.slug] ?? '👗'}</div>
                                    <div className="font-semibold">{cat.name}</div>
                                    <div className="mt-1 text-xs text-gray-500">{cat.products_count} items</div>
                                    <div className="absolute inset-0 rounded-2xl ring-1 ring-violet-500 opacity-0 transition group-hover:opacity-100" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Featured Products */}
                {featured.length > 0 && (
                    <section className="py-24">
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="mb-12 flex items-end justify-between">
                                <div>
                                    <h2 className="mb-2 text-3xl font-bold md:text-4xl">Featured Products</h2>
                                    <p className="text-gray-400">Our most popular customizable pieces.</p>
                                </div>
                                <Link href="/products" className="flex items-center gap-1 text-sm text-violet-400 transition hover:text-violet-300">
                                    View all <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                {featured.map(product => (
                                    <Link
                                        key={product.id}
                                        href={`/products/${product.slug}`}
                                        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-violet-500/40"
                                    >
                                        <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                            <Shirt className="h-24 w-24 text-gray-600 transition group-hover:text-violet-500" />
                                            {product.is_customizable && (
                                                <span className="absolute right-3 top-3 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium">
                                                    Customizable
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="mb-1 text-xs text-gray-500">{product.category?.name}</div>
                                            <div className="font-semibold leading-tight">{product.name}</div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-lg font-bold text-violet-400">${product.price.toFixed(2)}</span>
                                                <div className="flex gap-1">
                                                    {(product.colors ?? []).slice(0, 4).map(c => (
                                                        <div key={c} className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* How It Works */}
                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-16 text-center">
                            <h2 className="mb-3 text-3xl font-bold md:text-4xl">How It Works</h2>
                            <p className="text-gray-400">From idea to doorstep in three simple steps.</p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            {[
                                { step: '01', icon: <Palette className="h-8 w-8" />, title: 'Choose & Customize', desc: 'Pick a garment, choose your colors, add text or upload your artwork using our intuitive designer tool.' },
                                { step: '02', icon: <Package className="h-8 w-8" />, title: 'We Print & Pack', desc: 'Our team uses premium printing techniques to bring your design to life with exceptional quality.' },
                                { step: '03', icon: <Truck className="h-8 w-8" />, title: 'Fast Delivery', desc: 'Your custom order ships within 48 hours and arrives at your door in 3-7 business days.' },
                            ].map(item => (
                                <div key={item.step} className="relative rounded-2xl border border-white/10 bg-white/5 p-8">
                                    <div className="mb-6 flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
                                            {item.icon}
                                        </div>
                                        <span className="text-5xl font-black text-white/5">{item.step}</span>
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features / Trust */}
                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid gap-6 md:grid-cols-4">
                            {[
                                { icon: <Shield className="h-6 w-6" />, title: 'Premium Quality', desc: 'Only the finest fabrics and printing materials.' },
                                { icon: <Truck className="h-6 w-6" />, title: 'Free Shipping', desc: 'On orders over $75. Always.' },
                                { icon: <RotateCcw className="h-6 w-6" />, title: '30-Day Returns', desc: 'Not happy? We\'ll make it right.' },
                                { icon: <Star className="h-6 w-6" />, title: '5-Star Reviews', desc: 'Trusted by over 50,000 customers.' },
                            ].map(f => (
                                <div key={f.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                                    <div className="mt-0.5 flex-shrink-0 text-violet-400">{f.icon}</div>
                                    <div>
                                        <div className="mb-1 font-semibold">{f.title}</div>
                                        <div className="text-sm text-gray-400">{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-12 text-center">
                            <h2 className="mb-3 text-3xl font-bold md:text-4xl">What Our Customers Say</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {[
                                { name: 'Sarah K.', role: 'Graphic Designer', review: 'The designer tool is incredibly easy to use. I created a full merch line for my brand in one afternoon. Quality is stunning!', rating: 5 },
                                { name: 'Marcus T.', role: 'Team Captain', review: 'Ordered custom jerseys for our whole team. They arrived in 4 days and looked exactly like the preview. Everyone was thrilled.', rating: 5 },
                                { name: 'Priya M.', role: 'Small Business Owner', review: 'ThreadCraft has become my go-to for client gifts. The print quality and turnaround time are unmatched anywhere else.', rating: 5 },
                            ].map(t => (
                                <div key={t.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                    <div className="mb-4 flex gap-1">
                                        {Array.from({ length: t.rating }).map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="mb-6 leading-relaxed text-gray-300">"{t.review}"</p>
                                    <div>
                                        <div className="font-semibold">{t.name}</div>
                                        <div className="text-sm text-gray-500">{t.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-purple-800 p-12 text-center">
                            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                            <div className="relative">
                                <h2 className="mb-4 text-3xl font-black md:text-5xl">Ready to Create Something Amazing?</h2>
                                <p className="mb-8 text-lg text-violet-200">Join thousands of creators who design their own clothing with ThreadCraft.</p>
                                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                    <Link href="/designer" className="flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-violet-700 transition hover:bg-violet-50">
                                        <Palette className="h-5 w-5" />
                                        Open Designer
                                    </Link>
                                    <Link href="/products" className="flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 font-semibold transition hover:bg-white/10">
                                        Browse Shop <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Newsletter */}
                <section className="py-16">
                    <div className="mx-auto max-w-xl px-6 text-center">
                        <h3 className="mb-3 text-2xl font-bold">Stay in the Loop</h3>
                        <p className="mb-6 text-gray-400">New drops, exclusive deals, and design inspiration — delivered to your inbox.</p>
                        <form className="flex gap-3" onSubmit={e => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm outline-none ring-0 focus:border-violet-500 focus:bg-white/10"
                            />
                            <button type="submit" className="rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold transition hover:bg-violet-700">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/10 py-12">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid gap-8 md:grid-cols-4">
                            <div>
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                                        <Shirt className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="font-bold">ThreadCraft</span>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed">Premium custom clothing. Designed by you, crafted by us.</p>
                            </div>
                            {[
                                { title: 'Shop', links: [{ label: 'All Products', href: '/products' }, { label: 'T-Shirts', href: '/products?category=t-shirts' }, { label: 'Hoodies', href: '/products?category=hoodies' }, { label: 'Accessories', href: '/products?category=accessories' }] },
                                { title: 'Design', links: [{ label: 'Designer Tool', href: '/designer' }, { label: 'Upload Artwork', href: '/designer' }, { label: 'Size Guide', href: '#' }] },
                                { title: 'Account', links: [{ label: 'Sign In', href: '/login' }, { label: 'Register', href: '/register' }, { label: 'My Orders', href: '/orders' }, { label: 'Settings', href: '/settings' }] },
                            ].map(col => (
                                <div key={col.title}>
                                    <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">{col.title}</div>
                                    <ul className="space-y-2">
                                        {col.links.map(l => (
                                            <li key={l.label}><Link href={l.href} className="text-sm text-gray-500 transition hover:text-white">{l.label}</Link></li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-gray-600">
                            © {new Date().getFullYear()} ThreadCraft. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
