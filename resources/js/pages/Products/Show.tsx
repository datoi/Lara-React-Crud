import { Head, Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart, Palette, Star, ChevronRight, Shirt, Check, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface Category { id: number; name: string; slug: string; }
interface Product {
    id: number; name: string; slug: string; price: number; description: string;
    colors: string[]; sizes: string[]; images: string[];
    is_customizable: boolean; is_featured: boolean;
    category: Category;
}
interface SharedData { auth: { user: { id: number; name: string } | null }; [key: string]: unknown; }

interface Props { product: Product; related: Product[]; }

const sizeLabel: Record<string, string> = { XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', '2XL': '2XL', '3XL': '3XL' };

export default function ProductShow({ product, related }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0] ?? '#000000');
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[2] ?? 'M');
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    const addToCart = () => {
        if (!auth.user) {
            router.visit('/login');
            return;
        }
        router.post('/cart', {
            product_id: product.id,
            color: selectedColor,
            size: selectedSize,
            quantity,
        }, {
            onSuccess: () => {
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 2000);
            },
        });
    };

    const openDesigner = () => {
        router.visit(`/designer?product=${product.id}`);
    };

    return (
        <>
            <Head title={`${product.name} — ThreadCraft`} />

            <div className="min-h-screen bg-black font-[Inter] text-white">
                {/* Nav */}
                <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                                <Shirt className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold">ThreadCraft</span>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Link href="/" className="hover:text-white">Home</Link>
                            <ChevronRight className="h-3 w-3" />
                            <Link href="/products" className="hover:text-white">Shop</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-white">{product.name}</span>
                        </div>
                    </div>
                </nav>

                <div className="mx-auto max-w-7xl px-6 pb-24 pt-24">
                    <Link href="/products" className="mb-8 flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
                        <ArrowLeft className="h-4 w-4" /> Back to Products
                    </Link>

                    <div className="grid gap-12 lg:grid-cols-2">
                        {/* Product Image */}
                        <div>
                            <div
                                className="relative flex h-[480px] items-center justify-center rounded-2xl border border-white/10 transition"
                                style={{ backgroundColor: selectedColor + '22' }}
                            >
                                <Shirt className="h-48 w-48 transition" style={{ color: selectedColor }} />
                                {product.is_customizable && (
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                        <span className="rounded-full bg-violet-600/80 px-3 py-1 text-xs backdrop-blur">Customizable</span>
                                    </div>
                                )}
                            </div>

                            {/* Color preview chips */}
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                                {product.colors?.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setSelectedColor(c)}
                                        className={`relative h-9 w-9 flex-shrink-0 rounded-full border-2 transition ${selectedColor === c ? 'border-violet-500 scale-110' : 'border-white/20'}`}
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    >
                                        {selectedColor === c && (
                                            <Check className="absolute inset-0 m-auto h-4 w-4 drop-shadow" style={{ color: c === '#FFFFFF' ? '#000' : '#fff' }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-col">
                            <div className="mb-2 text-sm text-violet-400">{product.category?.name}</div>
                            <h1 className="mb-4 text-3xl font-black md:text-4xl">{product.name}</h1>

                            <div className="mb-6 flex items-center gap-4">
                                <span className="text-4xl font-black text-violet-400">${product.price.toFixed(2)}</span>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                                    <span className="ml-1 text-sm text-gray-400">(128 reviews)</span>
                                </div>
                            </div>

                            <p className="mb-8 leading-relaxed text-gray-400">{product.description}</p>

                            {/* Color Picker */}
                            <div className="mb-6">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="text-sm font-semibold">Color</span>
                                    <span className="text-sm text-gray-400">{selectedColor}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.colors?.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setSelectedColor(c)}
                                            className={`relative h-9 w-9 rounded-full border-2 transition hover:scale-110 ${selectedColor === c ? 'border-violet-500 scale-110' : 'border-white/20'}`}
                                            style={{ backgroundColor: c }}
                                            title={c}
                                        >
                                            {selectedColor === c && (
                                                <Check className="absolute inset-0 m-auto h-4 w-4 drop-shadow" style={{ color: c === '#FFFFFF' ? '#000' : '#fff' }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size Picker */}
                            <div className="mb-6">
                                <div className="mb-3 text-sm font-semibold">
                                    Size <span className="ml-1 font-normal text-gray-400">{selectedSize}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes?.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${selectedSize === size ? 'border-violet-500 bg-violet-600 text-white' : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'}`}
                                        >
                                            {sizeLabel[size] ?? size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="mb-8">
                                <div className="mb-3 text-sm font-semibold">Quantity</div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 transition hover:bg-white/10"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-12 text-center text-lg font-bold">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 transition hover:bg-white/10"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={addToCart}
                                    className={`flex items-center justify-center gap-2 rounded-full py-4 text-base font-semibold transition active:scale-95 ${addedToCart ? 'bg-green-600 hover:bg-green-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                                >
                                    {addedToCart ? <><Check className="h-5 w-5" /> Added to Cart!</> : <><ShoppingCart className="h-5 w-5" /> Add to Cart</>}
                                </button>
                                {product.is_customizable && (
                                    <button
                                        onClick={openDesigner}
                                        className="flex items-center justify-center gap-2 rounded-full border border-violet-500/50 py-4 text-base font-semibold text-violet-400 transition hover:bg-violet-500/10 active:scale-95"
                                    >
                                        <Palette className="h-5 w-5" /> Customize This Item
                                    </button>
                                )}
                            </div>

                            {/* Perks */}
                            <div className="mt-8 grid grid-cols-2 gap-3">
                                {[
                                    { text: 'Free shipping over $75' },
                                    { text: '30-day returns' },
                                    { text: 'Premium print quality' },
                                    { text: 'Ships in 48 hours' },
                                ].map(p => (
                                    <div key={p.text} className="flex items-center gap-2 text-sm text-gray-400">
                                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                                        {p.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Related Products */}
                    {related.length > 0 && (
                        <div className="mt-20">
                            <h2 className="mb-8 text-2xl font-bold">You Might Also Like</h2>
                            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                                {related.map(p => (
                                    <Link
                                        key={p.id}
                                        href={`/products/${p.slug}`}
                                        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-violet-500/40"
                                    >
                                        <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                            <Shirt className="h-20 w-20 text-gray-600 transition group-hover:text-violet-500/70" />
                                        </div>
                                        <div className="p-4">
                                            <div className="font-semibold leading-tight">{p.name}</div>
                                            <div className="mt-2 text-violet-400 font-bold">${p.price.toFixed(2)}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
