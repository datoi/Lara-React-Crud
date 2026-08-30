import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  sizes: string[] | null;
  tailor_name: string | null;
  category: {
    name: string;
    slug: string;
  };
  average_rating: number | null;
  reviews_count: number;
  isFallback?: boolean;
}

export function MarketplaceCarousel() {
  const { t } = useTranslation();
  // null = not decided yet; keeps the strip hidden until then so the fallback
  // products never flash-swap to real ones on load.
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [imageIndexes, setImageIndexes] = useState<Record<number, number>>({});
  const pressRef = useRef<{ pointerId: number; startX: number; scrollStart: number } | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetch('/api/products?per_page=20')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const list: Product[] = data.data ?? [];
        setProducts(list.slice(0, 12));
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const fallbackProducts: Product[] = [
    {
      id: -1,
      name: t('carousel.productPinkDress'),
      price: 210,
      images: ['/assets/hero/kere-look-1.jpeg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      tailor_name: 'Kere',
      category: {
        name: 'Dresses',
        slug: 'dresses',
      },
      average_rating: null,
      reviews_count: 0,
      isFallback: true,
    },
    {
      id: -2,
      name: t('carousel.productBlueDress'),
      price: 280,
      images: ['/assets/hero/kere-look-2.jpeg'],
      sizes: ['XS', 'S', 'M', 'L'],
      tailor_name: 'Kere',
      category: {
        name: 'Dresses',
        slug: 'dresses',
      },
      average_rating: null,
      reviews_count: 0,
      isFallback: true,
    },
    {
      id: -3,
      name: t('carousel.productBlueSuit'),
      price: 320,
      images: ['/assets/hero/kere-look-3.jpeg'],
      sizes: ['S', 'M', 'L', 'XL'],
      tailor_name: 'Kere',
      category: {
        name: 'Suits',
        slug: 'suits',
      },
      average_rating: null,
      reviews_count: 0,
      isFallback: true,
    },
    {
      id: -4,
      name: t('carousel.productGreenDress'),
      price: 260,
      images: ['/assets/hero/kere-look-4.jpeg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      tailor_name: 'Kere',
      category: {
        name: 'Dresses',
        slug: 'dresses',
      },
      average_rating: null,
      reviews_count: 0,
      isFallback: true,
    },
  ];

  const ready = products !== null;
  const displayedProducts = products && products.length > 0 ? products.slice(0, 8) : fallbackProducts;
  const categories = Array.from(
    new Map(displayedProducts.map((product) => [product.category.slug, product.category])).values(),
  );
  const filteredProducts = activeCategory === 'all'
    ? displayedProducts
    : displayedProducts.filter((product) => product.category.slug === activeCategory);

  const selectCategory = (slug: string) => {
    setActiveCategory(slug);
    stripRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const changeProductImage = (product: Product, direction: -1 | 1) => {
    if (product.images.length < 2) return;
    setImageIndexes((current) => {
      const index = current[product.id] ?? 0;
      return {
        ...current,
        [product.id]: (index + direction + product.images.length) % product.images.length,
      };
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Touch uses the browser's native horizontal scroll (with momentum); the
    // click-drag below is for mouse only, so the two never fight each other.
    if (event.pointerType !== 'mouse') return;
    if (!stripRef.current) return;

    pressRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollStart: stripRef.current.scrollLeft,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (!press || !stripRef.current) return;

    const distance = event.clientX - press.startX;

    // Capturing the pointer redirects the eventual click away from the card
    // links, so only enter drag mode once the pointer has clearly moved.
    if (!isDragging) {
      if (Math.abs(distance) < 6) return;
      setIsDragging(true);
      stripRef.current.setPointerCapture(press.pointerId);
    }

    stripRef.current.scrollLeft = press.scrollStart - distance;
  };

  const stopDragging = () => {
    pressRef.current = null;
    setIsDragging(false);
  };

  return (
    <section id="categories" className="overflow-hidden bg-white px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1500px]">
        <nav
          aria-label={t('carousel.categoriesLabel')}
          className="marketplace-scrollbar-none -mx-4 mb-7 flex gap-7 overflow-x-auto px-4 py-4 sm:mx-0 sm:justify-center sm:px-0"
          style={{ scrollbarWidth: 'none' }}
        >
          <button
            type="button"
            onClick={() => selectCategory('all')}
            className={`shrink-0 text-xs font-normal uppercase tracking-[0.08em] transition-opacity ${activeCategory === 'all' ? 'text-black' : 'text-black/45 hover:text-black'}`}
          >
            {t('marketplace.allCategories')}
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => selectCategory(category.slug)}
              className={`shrink-0 text-xs font-normal uppercase tracking-[0.08em] transition-opacity ${activeCategory === category.slug ? 'text-black' : 'text-black/45 hover:text-black'}`}
            >
              {category.name}
            </button>
          ))}
        </nav>

        <div className="relative">
          <div
            ref={stripRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onPointerLeave={stopDragging}
            className={[
              // On phones the strip goes full-bleed with an 11vw inset so each 78vw
              // card snaps dead-center (with a small symmetric peek); sm+ keeps the
              // original left-aligned multi-column layout.
              'marketplace-scrollbar-none -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[11vw] pb-5 select-none sm:mx-0 sm:px-0',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
            ].join(' ')}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              // 'auto' lets the browser scroll this strip horizontally on touch
              // while still letting a vertical swipe scroll the page.
              touchAction: 'auto',
              WebkitOverflowScrolling: 'touch',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          >
            {filteredProducts.map((product) => {
              const imageIndex = imageIndexes[product.id] ?? 0;
              const image = product.images?.[imageIndex];
              const productPath = product.isFallback ? '/marketplace' : `/product/${product.id}`;

              return (
                <article
                  key={product.id}
                  className="group block w-[78vw] shrink-0 snap-center sm:w-[46vw] sm:snap-start lg:w-[calc((100%_-_72px)/4)]"
                >
                  <div className="relative aspect-[0.78] overflow-hidden border border-black/20 bg-[#f4f4f2]">
                    {image ? (
                      <Link
                        to={productPath}
                        draggable={false}
                        className="block h-full w-full"
                        onClick={(event) => {
                          if (isDragging) event.preventDefault();
                        }}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${imageIndex + 1}`}
                          draggable={false}
                          loading="lazy"
                          className="h-full w-full object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                        />
                      </Link>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#b2b2b2]">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}

                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => changeProductImage(product, -1)}
                      aria-label={t('carousel.previous')}
                      disabled={product.images.length < 2}
                      className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-black opacity-0 shadow-sm transition-all hover:bg-black hover:text-white group-hover:opacity-100 group-focus-within:opacity-100 disabled:hidden"
                    >
                      <ChevronLeft className="h-5 w-5 stroke-[1.4]" />
                    </button>
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => changeProductImage(product, 1)}
                      aria-label={t('carousel.next')}
                      disabled={product.images.length < 2}
                      className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-black opacity-0 shadow-sm transition-all hover:bg-black hover:text-white group-hover:opacity-100 group-focus-within:opacity-100 disabled:hidden"
                    >
                      <ChevronRight className="h-5 w-5 stroke-[1.4]" />
                    </button>

                    <div className="marketplace-scrollbar-none absolute inset-x-0 bottom-0 z-10 flex min-h-11 translate-y-full items-center gap-5 overflow-x-auto border-t border-black/20 bg-white/95 px-4 text-[11px] font-normal uppercase text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 sm:justify-center">
                      {(product.sizes?.length ? product.sizes : ['XS', 'S', 'M', 'L', 'XL']).map((size) => (
                        <span key={size} className="shrink-0">{size}</span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={productPath}
                    draggable={false}
                    className="block pt-4"
                    onClick={(event) => {
                      if (isDragging) event.preventDefault();
                    }}
                  >
                    <h3 className="truncate text-sm font-bold uppercase tracking-normal text-[#111111] sm:text-base">
                      {product.name}
                    </h3>

                    <div className="mt-1 flex items-center justify-between gap-4">
                      <p className="text-sm text-[#777777]">₾{product.price}</p>

                      {product.tailor_name && (
                        <p className="truncate text-right text-[11px] uppercase tracking-[0.08em] text-[#9a9a9a]">
                          {product.tailor_name}
                        </p>
                      )}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="pointer-events-none absolute left-[72%] top-[31%] z-20 hidden w-32 -translate-x-1/2 -translate-y-1/2 md:block lg:left-[76%] lg:w-36">
            <img
              src="/assets/brand/kere-logo.png"
              alt="Kere"
              className="h-auto w-full shadow-[0_24px_70px_rgba(38,10,14,0.28)]"
            />
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/marketplace"
            className="inline-flex min-h-[50px] items-center justify-center border border-black/30 bg-transparent px-8 text-xs font-bold uppercase tracking-[0.12em] text-[#111111] transition-all duration-200 hover:bg-[#111111] hover:text-white"
          >
            {t('carousel.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
