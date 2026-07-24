import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
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
    <section id="categories" className="overflow-hidden bg-white px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-12 sm:mb-16">
          <h2 className="max-w-[620px] font-serif text-[clamp(1.75rem,3.2vw,3.25rem)] font-medium uppercase leading-[0.96] tracking-normal text-[#111111]">
            {t('carousel.title')}
          </h2>

          <p className="mt-7 max-w-xl text-sm leading-7 text-[#6f6f6f] sm:text-base">
            {t('carousel.subtitle')}
          </p>
        </div>

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
            {displayedProducts.map((product) => {
              const image = product.images?.[0];

              return (
                <Link
                  key={product.id}
                  to={product.isFallback ? '/marketplace' : `/product/${product.id}`}
                  draggable={false}
                  className="group block w-[78vw] shrink-0 snap-center sm:w-[46vw] sm:snap-start lg:w-[calc((100%_-_72px)/4)]"
                  onClick={(event) => {
                    if (isDragging) {
                      event.preventDefault();
                    }
                  }}
                >
                  <div className="relative aspect-[0.78] overflow-hidden border border-black/20 bg-[#f4f4f2]">
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        draggable={false}
                        loading="lazy"
                        className="h-full w-full object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#b2b2b2]">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}

                  </div>

                  <div className="pt-4">
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
                  </div>
                </Link>
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
