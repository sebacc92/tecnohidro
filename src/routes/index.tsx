import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../db/client';
import { products, categories, siteContent, brands, instagramPosts } from '../db/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';
import { ContactButton } from '../components/ContactButton';
import { buttonVariants } from '../components/ui/button/button';
import { SocialFeed } from '../components/SocialFeed';
import { LuChevronLeft, LuChevronRight, LuTruck, LuPackage, LuPercent, LuTag } from '@qwikest/icons/lucide';

// ─── Imágenes del Slider (reemplazar con URLs reales cuando estén disponibles) ─────────────────
const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80&auto=format&fit=crop',
    alt: 'Instalaciones hidráulicas industriales - tuberías y conexiones',
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80&auto=format&fit=crop',
    alt: 'Almacén de materiales de plomería y construcción',
  },
  {
    url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80&auto=format&fit=crop',
    alt: 'Redes de agua potable y cañerías profesionales',
  },
];

// ─── Links de marcas ─────────────────────────────────────────────────────────────────────────
const BRAND_LINKS: Record<string, string> = {
  'genebre': 'https://www.genebre.es/',
  'tigre': 'https://www.tigre.com.ar/',
  'juntamas': 'https://www.juntamas.com.ar/',
  'latyn': 'https://www.latyn.net/',
  'pluvius': 'https://pluvius.com.ar/',
  'wavin': 'https://www.wavin.com/es-ar',
  'saladillo': 'https://www.saladillo.com.ar/',
  'waterplast': 'https://www.waterplast.com.ar/',
  'bosch': 'https://www.bosch-pt.com.ar/ar/es/',
  'irimo': 'https://www.irimo.com/',
  'barovo': 'https://www.barovo.com.ar/',
  'kushiro': 'https://kushiro.com.ar/',
};

function getBrandLink(brandName: string): string {
  const normalizedName = brandName.toLowerCase().trim();
  for (const [key, url] of Object.entries(BRAND_LINKS)) {
    if (normalizedName.includes(key)) return url;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(brandName)}`;
}

// ─── Componente: Ofertas Destacadas (horizontal scrollable) ───────────────────────────────────
export const OfferCarousel = component$(({ offers }: { offers: any[] }) => {
  const scrollRef = useSignal<HTMLDivElement>();
  const canScrollLeft = useSignal(false);
  const canScrollRight = useSignal(false);
  const timeLeft = useSignal<Record<string, { d: number; h: number; m: number; s: number }>>({});

  // Countdown timers
  useVisibleTask$(({ cleanup }) => {
    const update = () => {
      const now = Date.now();
      const next: Record<string, { d: number; h: number; m: number; s: number }> = {};
      offers.forEach((o) => {
        if (!o.offer_expires_at) return;
        const diff = new Date(o.offer_expires_at).getTime() - now;
        if (diff > 0) {
          next[o.id] = {
            d: Math.floor(diff / (1000 * 60 * 60 * 24)),
            h: Math.floor((diff / (1000 * 60 * 60)) % 24),
            m: Math.floor((diff / 1000 / 60) % 60),
            s: Math.floor((diff / 1000) % 60),
          };
        }
      });
      timeLeft.value = next;
    };
    update();
    const id = setInterval(update, 1000);
    cleanup(() => clearInterval(id));
  });

  // Check scroll overflow
  const checkScroll = $(() => {
    const el = scrollRef.value;
    if (!el) return;
    canScrollLeft.value = el.scrollLeft > 2;
    canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
  });

  useVisibleTask$(({ cleanup }) => {
    const el = scrollRef.value;
    if (!el) return;
    // Initial check
    const raf = requestAnimationFrame(() => {
      canScrollLeft.value = el.scrollLeft > 2;
      canScrollRight.value = el.scrollWidth > el.clientWidth + 2;
    });
    // Re-check on resize
    const ro = new ResizeObserver(() => {
      canScrollLeft.value = el.scrollLeft > 2;
      canScrollRight.value = el.scrollWidth > el.clientWidth + 2;
    });
    ro.observe(el);
    cleanup(() => { cancelAnimationFrame(raf); ro.disconnect(); });
  });

  const scrollBy = $((dir: number) => {
    const el = scrollRef.value;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  });

  if (offers.length === 0) return null;

  return (
    <div class="relative">
      <h3 class="text-xl font-bold text-slate-900 mb-5 px-1">🔥 Ofertas Relámpago</h3>

      {/* Left arrow */}
      {canScrollLeft.value && (
        <button
          onClick$={() => scrollBy(-1)}
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 bg-white rounded-full p-2.5 shadow-lg border border-slate-200 text-slate-600 hover:text-orange-600 hover:scale-110 transition-all"
          aria-label="Deslizar a la izquierda"
        >
          <LuChevronLeft class="w-5 h-5" />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight.value && (
        <button
          onClick$={() => scrollBy(1)}
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 bg-white rounded-full p-2.5 shadow-lg border border-slate-200 text-slate-600 hover:text-orange-600 hover:scale-110 transition-all"
          aria-label="Deslizar a la derecha"
        >
          <LuChevronRight class="w-5 h-5" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll$={checkScroll}
        class="flex gap-5 overflow-x-auto pb-2 scroll-smooth"
        style="scrollbar-width: none; -ms-overflow-style: none;"
      >
        <style>{`.offer-scroll::-webkit-scrollbar { display: none; }`}</style>

        {offers.map((offer) => {
          const timer = timeLeft.value[offer.id];
          const img = offer.images?.length > 0 ? offer.images[0] : 'https://placehold.co/500x500/f8fafc/94a3b8?text=Sin+Imagen';

          return (
            <div
              key={offer.id}
              class="flex-shrink-0 w-[280px] bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex flex-col hover:shadow-xl transition-shadow"
            >
              {/* Imagen del producto */}
              <div class="aspect-square bg-slate-50 rounded-xl mb-4 overflow-hidden relative group border border-slate-100">
                <Link href={`/productos/${offer.slug}`}>
                  <img src={img} alt={offer.name} width={500} height={500}
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </Link>
                {timer && (
                  <div class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow border border-slate-200/50 flex gap-1.5 text-center min-w-max">
                    {[{ v: timer.d, l: 'D' }, { v: timer.h, l: 'H' }, { v: timer.m, l: 'M' }, { v: timer.s, l: 'S' }].map((t, i) => (
                      <div key={i} class="flex items-center gap-1">
                        {i > 0 && <span class="text-red-300 font-bold text-xs">:</span>}
                        <div class="flex flex-col items-center">
                          <span class="text-sm font-bold text-red-600 leading-none">{t.v.toString().padStart(2, '0')}</span>
                          <span class="text-[9px] uppercase text-slate-500 font-semibold">{t.l}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info del producto */}
              <h4 class="font-semibold text-slate-800 mb-1 truncate text-sm" title={offer.name}>{offer.name}</h4>
              <div class="flex items-end gap-3 mb-3">
                <span class="text-xl font-bold text-orange-600">${(offer.price || 0).toLocaleString('es-AR')}</span>
              </div>
              <Link href={`/productos/${offer.slug}`} class={buttonVariants({ look: 'primary', size: 'sm', class: 'w-full mt-auto' })}>
                Aprovechar Oferta
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Componente: Hero Slider ──────────────────────────────────────────────────────────────────
export const HeroSlider = component$(() => {
  const current = useSignal(0);
  const isHovered = useSignal(false);

  // Auto-avance con pausa en hover
  useVisibleTask$(({ cleanup }) => {
    const tick = () => {
      if (!isHovered.value) {
        current.value = (current.value + 1) % HERO_SLIDES.length;
      }
    };
    const id = setInterval(tick, 6000);
    cleanup(() => clearInterval(id));
  });

  const goTo = $((idx: number) => { current.value = idx; });
  const goNext = $(() => { current.value = (current.value + 1) % HERO_SLIDES.length; });
  const goPrev = $(() => { current.value = (current.value - 1 + HERO_SLIDES.length) % HERO_SLIDES.length; });

  return (
    // Alturas: mobile 80vh, tablet 70vh, desktop 65vh
    <section
      class="relative w-full overflow-hidden bg-slate-900"
      style="height: 50vh;"
      onMouseEnter$={() => { isHovered.value = true; }}
      onMouseLeave$={() => { isHovered.value = false; }}
      aria-label="Carrusel de imágenes"
    >
      {/* Estilos responsivos de altura via CSS */}
      <style>{`
        @media (min-width: 768px) { .hero-slider { height: 45vh !important; } }
        @media (min-width: 1024px) { .hero-slider { height: 40vh !important; } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-up-1 { animation: fadeUp 800ms cubic-bezier(0.4,0,0.2,1) 200ms both; }
        .hero-fade-up-2 { animation: fadeUp 800ms cubic-bezier(0.4,0,0.2,1) 400ms both; }
        .hero-fade-up-3 { animation: fadeUp 800ms cubic-bezier(0.4,0,0.2,1) 600ms both; }
        @media (prefers-reduced-motion: reduce) {
          .hero-fade-up-1, .hero-fade-up-2, .hero-fade-up-3 { animation: none; opacity: 1; transform: none; }
        }
        .dot-active { width: 32px; border-radius: 6px; background-color: #FF5722; }
        .dot-inactive { width: 12px; border-radius: 50%; background-color: rgba(255,255,255,0.5); }
        .dot-inactive:hover { background-color: rgba(255,255,255,0.8); }
      `}</style>

      {/* CAPA 1: Imágenes del slider */}
      {HERO_SLIDES.map((slide, idx) => (
        <div
          key={slide.url}
          class="absolute inset-0 transition-opacity duration-[800ms] ease-in-out"
          style={{ opacity: current.value === idx ? '1' : '0', zIndex: current.value === idx ? '10' : '0' }}
        >
          <img
            src={slide.url}
            alt={slide.alt}
            class="w-full h-full object-cover"
            loading={idx === 0 ? 'eager' : 'lazy'}
            decoding={idx === 0 ? 'sync' : 'async'}
          />
        </div>
      ))}

      {/* CAPA 2: Overlay oscuro 40% */}
      <div class="absolute inset-0 bg-black/50" style="z-index: 20;" />

      {/* CAPA 3: Contenido central */}
      <div class="absolute inset-0 flex items-center justify-center px-8" style="z-index: 30;">
        <div class="text-center text-white max-w-[700px] w-full">
          {/* H1 */}
          <h1 class="hero-fade-up-1 font-extrabold text-white mb-6"
            style="font-size: clamp(2.2rem, 5vw, 3.5rem); line-height: 1.1;">
            Materiales para Redes de Agua y GAS
          </h1>

          {/* Subtitle */}
          <p class="hero-fade-up-2 font-normal text-white/95 mb-10"
            style="font-size: clamp(1rem, 2vw, 1.2rem); line-height: 1.6;">
            Distribuidores mayoristas especializados en agua potable, cloaca,
            desagües pluviales y gas. Más de 40 años de experiencia.
          </p>

          {/* CTA */}
          <div class="hero-fade-up-3 flex justify-center">
            <Link
              href="/productos"
              class="inline-block text-white font-semibold no-underline transition-all duration-300 hover:scale-105"
              style="background-color: #FF5722; padding: 1rem 3rem; border-radius: 12px; font-size: 1.1rem; max-width: 300px; box-shadow: 0 4px 15px rgba(255,87,34,0.4);"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </div>

      {/* CAPA 4a: Flechas de navegación (solo md+) */}
      <button
        onClick$={goPrev}
        class="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 items-center justify-center w-[50px] h-[50px] rounded-full text-white transition-all hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        style="z-index: 40; background-color: rgba(255,255,255,0.2); backdrop-filter: blur(4px);"
        aria-label="Imagen anterior"
      >
        <LuChevronLeft class="w-7 h-7" />
      </button>
      <button
        onClick$={goNext}
        class="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center justify-center w-[50px] h-[50px] rounded-full text-white transition-all hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        style="z-index: 40; background-color: rgba(255,255,255,0.2); backdrop-filter: blur(4px);"
        aria-label="Siguiente imagen"
      >
        <LuChevronRight class="w-7 h-7" />
      </button>

      {/* CAPA 4b: Dots indicadores */}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3" style="z-index: 40;">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick$={() => goTo(idx)}
            class={`h-3 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${current.value === idx ? 'dot-active' : 'dot-inactive'}`}
            aria-label={`Ir a imagen ${idx + 1}`}
            aria-current={current.value === idx ? 'true' : 'false'}
          />
        ))}
      </div>

      {/* Aria-live para lectores de pantalla */}
      <div class="sr-only" aria-live="polite">
        Imagen {current.value + 1} de {HERO_SLIDES.length}
      </div>
    </section>
  );
});

// ─── Route Loader ─────────────────────────────────────────────────────────────────────────────
export const useHomeData = routeLoader$(async ({ env }) => {
  try {
    const db = getDb(env);
    const contentData = await db.select().from(siteContent);
    const contentMap = contentData.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const featuredCategories = await db.select().from(categories).where(isNull(categories.parent_id)).limit(4);

    const featuredProducts = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      images: products.images,
      source: products.source,
      categoryName: categories.name,
    })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(and(eq(products.status, 'active'), eq(products.is_featured, true)))
      .limit(8);

    const nowMs = Date.now();
    const offerProducts = (await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      images: products.images,
      offer_expires_at: products.offer_expires_at,
    })
      .from(products)
      .where(and(eq(products.status, 'active'), eq(products.is_offer, true))))
      .filter((p) => !p.offer_expires_at || new Date(p.offer_expires_at).getTime() > nowMs)
      .slice(0, 5);

    const allBrands = await db.select().from(brands);

    const igPosts = await db.select().from(instagramPosts).orderBy(desc(instagramPosts.timestamp)).limit(6);
    const mappedIgPosts = igPosts.map((p) => ({
      id: p.id,
      mediaUrl: p.mediaUrl || '',
      permalink: p.permalink || '',
      caption: p.caption || undefined,
    }));

    return {
      heroTitle: contentMap['hero_title'] || 'Insumos de Calidad para Profesionales',
      heroDescription: contentMap['hero_desc'] || 'Distribuidora líder en insumos de agua, gas y cloacas.',
      homeHighlightPhrase: contentMap['home_highlight_phrase'] || 'Somos los principales referentes en el rubro de la distribución de materiales para la construcción, reparación y ampliación de redes de agua potable, cloaca, desagües pluviales y gas.',
      categories: featuredCategories,
      products: featuredProducts,
      offers: offerProducts,
      brands: allBrands,
      instagramPosts: mappedIgPosts,
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      heroTitle: 'Insumos de Calidad para Profesionales',
      heroDescription: 'Distribuidora líder en insumos de agua, gas y cloacas.',
      homeHighlightPhrase: '',
      categories: [],
      products: [],
      offers: [],
      brands: [],
      instagramPosts: [],
    };
  }
});

// ─── Página Principal ─────────────────────────────────────────────────────────────────────────
export default component$(() => {
  const data = useHomeData();

  return (
    <div>

      {/* ════════════════════════════════════════════════
          SECCIÓN 1: HERO SLIDER
      ════════════════════════════════════════════════ */}
      <HeroSlider />

      {/* ════════════════════════════════════════════════
          SECCIÓN 2: OFERTA DESTACADA (separada del hero)
      ════════════════════════════════════════════════ */}
      {data.value.offers.length > 0 && (
        <section class="bg-slate-100 py-12 px-4">
          <div class="max-w-7xl mx-auto">
            <OfferCarousel offers={data.value.offers} />
          </div>
        </section>
      )}

      <section class="py-16 bg-slate-50 border-t border-slate-100">
        <div class="container mx-auto px-4 md:px-8">
          <div class="mb-10 text-center">
            <h2 class="text-3xl font-bold tracking-tight text-slate-900 mb-2">Productos Destacados</h2>
            <p class="text-slate-500">Calidad garantizada para tus obras.</p>
          </div>

          {data.value.products.length > 0 ? (
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.value.products.map((product) => {
                const imageUrl = Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : 'https://placehold.co/400x400/e2e8f0/475569?text=Sin+Imagen';

                return (
                  <div key={product.id} class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                    <div class="block aspect-square overflow-hidden bg-slate-100 relative">
                      {product.source === 'meli' && (
                        <div class="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-sm z-20">
                          <LuTag class="w-3 h-3" /> MercadoLibre
                        </div>
                      )}
                      <Link href={`/productos/${product.slug}`} class="block w-full h-full">
                        <img src={imageUrl} alt={product.name} width={400} height={400}
                          class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </Link>
                    </div>
                    <div class="p-5 flex flex-col flex-1">
                      <span class="text-xs font-medium text-orange-600 mb-1 block">
                        {product.categoryName || 'General'}
                      </span>
                      <Link href={`/productos/${product.slug}`} class="hover:underline">
                        <h3 class="font-semibold text-slate-800 text-lg leading-tight mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      {product.price != null && product.price > 0 && (
                        <span class="text-lg font-bold text-orange-600">${product.price.toLocaleString('es-AR')}</span>
                      )}
                      <div class="mt-auto pt-4">
                        <ContactButton productName={product.name} look="primary" size="sm" class="w-full" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div class="p-12 text-center text-slate-500 bg-white border border-dashed rounded-lg">
              No hay productos destacados disponibles en este momento.
            </div>
          )}

          <div class="mt-12 text-center">
            <Link href="/productos" class={buttonVariants({ look: 'outline', size: 'lg' })}>
              Ver Catálogo Completo
            </Link>
          </div>
        </div>
      </section>

      <section class="bg-white py-8 px-4">
        <div class="max-w-[1200px] mx-auto">
          {/* Label */}
          <p class="text-center text-sm font-bold tracking-widest uppercase text-slate-400 mb-8">
            Marcas con las que Trabajamos
          </p>

          {/* Grid de logos: 2 col mobile, 3 col tablet, 6 col desktop */}
          {data.value.brands.length > 0 ? (
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 items-center justify-items-center">
              {data.value.brands.map((brand, idx) => (
                <a
                  key={`${brand.id}-${idx}`}
                  href={getBrandLink(brand.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full max-w-[130px] aspect-[3/2] flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-110 transition-all duration-300"
                >
                  <img
                    src={brand.imageUrl}
                    alt={brand.name}
                    class="max-h-full max-w-full object-contain mix-blend-multiply"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div class="py-8 text-center text-slate-400">No hay marcas disponibles.</div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SECCIÓN 5: BENEFICIOS / FEATURES
      ════════════════════════════════════════════════ */}
      <section class="py-12 bg-slate-100 border-t border-slate-200">
        <div class="container mx-auto px-4 md:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-8 rounded-xl shadow-sm border-2 border-orange-500 flex flex-col hover:shadow-md transition-shadow">
              <LuTruck class="w-10 h-10 text-orange-600 mb-4" />
              <h3 class="text-xl font-bold mb-3">Envíos a todo el país</h3>
              <p class="text-slate-600 leading-relaxed">
                Elegí la forma de entrega que prefieras ¡y listo!<br /><br />
                Aseguramos tu entrega con envíos de Mercado Libre.
              </p>
            </div>
            <div class="bg-white p-8 rounded-xl shadow-sm border-2 border-orange-500 flex flex-col hover:shadow-md transition-shadow">
              <LuPackage class="w-10 h-10 text-orange-600 mb-4" />
              <h3 class="text-xl font-bold mb-3">Envíos Gratis</h3>
              <p class="text-slate-600 leading-relaxed">
                Envío gratis en compras con envíos de Mercado Libre a partir de $70.000
              </p>
            </div>
            <div class="bg-white p-8 rounded-xl shadow-sm border-2 border-orange-500 flex flex-col hover:shadow-md transition-shadow">
              <LuPercent class="w-10 h-10 text-orange-600 mb-4" />
              <h3 class="text-xl font-bold mb-3">Promociones con tarjeta de crédito</h3>
              <p class="text-slate-600 leading-relaxed">
                6 Cuotas sin interés, Banco Provincia, Presencial en el local.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SECCIÓN 6: FEED DE INSTAGRAM
      ════════════════════════════════════════════════ */}
      <SocialFeed posts={data.value.instagramPosts} />

      {/* ════════════════════════════════════════════════
          SECCIÓN 7: FRASE DESTACADA
      ════════════════════════════════════════════════ */}
      <section class="py-16 bg-slate-50 border-t border-slate-100">
        <div class="container mx-auto px-4 md:px-8 text-center">
          <p class="text-2xl md:text-3xl font-medium text-slate-800 max-w-4xl mx-auto leading-relaxed mb-8">
            "{data.value.homeHighlightPhrase}"
          </p>
          <Link href="/productos" class={buttonVariants({ look: 'primary', size: 'lg' })}>
            Ver Productos
          </Link>
        </div>
      </section>

    </div>
  );
});

export const head: DocumentHead = {
  title: 'Tecnohidro - Insumos de Agua, Gas y Cloacas',
  meta: [
    {
      name: 'description',
      content: 'Distribuidores mayoristas especializados en agua potable, cloaca, desagües pluviales y gas. Más de 40 años de experiencia.',
    },
  ],
};
