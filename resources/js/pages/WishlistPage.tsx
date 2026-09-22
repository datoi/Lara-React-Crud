import { useEffect, useState } from 'react';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { getAuthToken } from '../hooks/useAuth';

interface WishlistProduct {
    id: number;
    name: string;
    price: number;
    images: string[];
    tailor_name: string | null;
}

export default function WishlistPage() {
    const { t } = useTranslation();
    const token = getAuthToken();
    const [products, setProducts] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<number | null>(null);

    useEffect(() => {
        fetch('/api/wishlist', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then((data) => setProducts(data.products ?? []))
            .finally(() => setLoading(false));
    }, [token]);

    const remove = async (id: number) => {
        setRemoving(id);
        const response = await fetch(`/api/wishlist/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (response.ok) setProducts((current) => current.filter((product) => product.id !== id));
        setRemoving(null);
    };

    return (
        <div className="min-h-screen bg-[#F4F1E7] text-[#111111]">
            <Helmet><title>{t('wishlist.pageTitle')} | Kere</title></Helmet>
            <Navigation />
            <main className="mx-auto max-w-[1500px] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
                <h1 className="font-serif text-[clamp(2rem,4vw,4rem)] font-normal">{t('wishlist.pageTitle')}</h1>

                {loading ? (
                    <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin" /></div>
                ) : products.length === 0 ? (
                    <div className="py-24 text-center">
                        <Heart className="mx-auto mb-5 h-9 w-9 stroke-[1.2]" />
                        <p className="mb-6 text-sm">{t('wishlist.empty')}</p>
                        <Link to="/marketplace" className="border-b border-black pb-1 text-xs uppercase tracking-[0.08em]">
                            {t('wishlist.browse')}
                        </Link>
                    </div>
                ) : (
                    <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                        {products.map((product) => (
                            <article key={product.id} className="border border-black/15">
                                <div className="relative aspect-[4/5] bg-[#EEEAE0]">
                                    <Link to={`/product/${product.id}`}>
                                        <img src={product.images?.[0]} alt={product.name} className="h-full w-full object-contain p-5" />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => remove(product.id)}
                                        disabled={removing === product.id}
                                        aria-label={t('wishlist.remove')}
                                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-sm"
                                    >
                                        {removing === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="p-3">
                                    <Link to={`/product/${product.id}`} className="text-sm font-normal">{product.name}</Link>
                                    <div className="mt-2 flex justify-between text-xs text-black/60">
                                        <span>{product.tailor_name}</span><span>₾{product.price}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
