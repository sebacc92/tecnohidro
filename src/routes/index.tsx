import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../db/client';
import { products, categories, siteContent, brands, instagramPosts } from '../db/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';
import { ContactButton } from '../components/ContactButton';
import { buttonVariants } from '../components/ui/button/button';
import { SocialFeed } from '../components/SocialFeed';
import { LuChevronLeft, LuChevronRight, LuTruck, LuPackage, LuPercent, LuTag } from '@qwikest/icons/lucide';

// ─── Imágenes del Slider por defecto (se usan si no hay nada en la BD) ──────────────────────────
const DEFAULT_HERO_SLIDES = [
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

// ─── Componente: Tarjeta de Producto (Reutilizable) ──────────────────────────────────────────
export const ProductCard = component$(({ product, isOffer = false }: { product: any; isOffer?: boolean }) => {
  const imageUrl = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : 'https://placehold.co/400x400/e2e8f0/475569?text=Sin+Imagen';

  return (
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group h-full">
      <div class="block aspect-square overflow-hidden bg-slate-100 relative">
        {product.source === 'meli' && (
          <div class="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-sm z-20">
            <LuTag class="w-3 h-3" /> MercadoLibre
          </div>
        )}
        {isOffer && (
          <div class="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm z-20 flex items-center gap-1">
            <LuPercent class="w-3 h-3" /> OFERTA
          </div>
        )}
        <Link href={`/productos/${product.slug}`} class="block w-full h-full">
          <img 
            src={imageUrl} 
            alt={product.name} 
            width={400} 
            height={400}
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            loading="lazy" 
          />
        </Link>
      </div>
      <div class="p-5 flex flex-col flex-1">
        <span class="text-xs font-bold text-orange-600 mb-1 block uppercase tracking-wider">
          {product.categoryName || (isOffer ? 'Oferta' : 'Destacado')}
        </span>
        <Link href={`/productos/${product.slug}`} class="hover:text-orange-600 transition-colors">
          <h3 class="font-bold text-slate-800 text-base leading-tight mb-3 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div class="mt-auto pt-4 flex items-center justify-between">
          <span class="text-xl font-black text-slate-900">
            ${(product.price || 0).toLocaleString('es-AR')}
          </span>
          <Link 
            href={`/productos/${product.slug}`}
            class="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all"
          >
            <LuChevronRight class="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
});

// ─── Componente: Hero Slider ──────────────────────────────────────────────────────────────────
// ─── Componente: Hero Slider ──────────────────────────────────────────────────────────────────
interface HeroSlide {
  url: string;
  alt: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const HeroSlider = component$(({ slides }: { slides: HeroSlide[] }) => {
  const current = useSignal(0);
  const isHovered = useSignal(false);

  // Auto-avance con pausa en hover
  useVisibleTask$(({ cleanup }) => {
    if (slides.length <= 1) return;
    const tick = () => {
      if (!isHovered.value) {
        current.value = (current.value + 1) % slides.length;
      }
    };
    const id = setInterval(tick, 6000);
    cleanup(() => clearInterval(id));
  });

  const goTo = $((idx: number) => { current.value = idx; });
  const goNext = $(() => { current.value = (current.value + 1) % slides.length; });
  const goPrev = $(() => { current.value = (current.value - 1 + slides.length) % slides.length; });

  return (
    <section
      class="relative w-full overflow-hidden bg-slate-900"
      style="height: 60vh;"
      onMouseEnter$={() => { isHovered.value = true; }}
      onMouseLeave$={() => { isHovered.value = false; }}
      aria-label="Carrusel de imágenes"
    >
      <style>{`
        @media (min-width: 768px) { .hero-slider { height: 65vh !important; } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-up { animation: fadeUp 800ms cubic-bezier(0.4,0,0.2,1) both; }
        .dot-active { width: 32px; border-radius: 6px; background-color: #FF5722; }
        .dot-inactive { width: 12px; border-radius: 50%; background-color: rgba(255,255,255,0.5); }
      `}</style>

      {slides.map((slide, idx) => {
        const isActive = current.value === idx;
        return (
          <div
            key={`${slide.url}-${idx}`}
            class="absolute inset-0 transition-all duration-[1000ms] ease-in-out"
            style={{ 
              opacity: isActive ? '1' : '0', 
              zIndex: isActive ? '10' : '0',
              transform: isActive ? 'scale(1)' : 'scale(1.05)'
            }}
          >
            {/* Image */}
            <img
              src={slide.url}
              alt={slide.alt || slide.title || 'Slide'}
              class="w-full h-full object-cover"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
            
            {/* Overlay */}
            <div class="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div class="absolute inset-0 flex items-center justify-center px-8 z-30">
              <div class="text-center text-white max-w-[850px] w-full">
                {slide.title && (
                  <h1 
                    class={`font-extrabold text-white mb-6 ${isActive ? 'hero-fade-up' : ''}`}
                    style="font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1.1; animation-delay: 200ms;"
                  >
                    {slide.title}
                  </h1>
                )}

                {slide.subtitle && (
                  <p 
                    class={`font-normal text-white/90 mb-10 mx-auto max-w-2xl ${isActive ? 'hero-fade-up' : ''}`}
                    style="font-size: clamp(1rem, 2vw, 1.3rem); line-height: 1.6; animation-delay: 400ms;"
                  >
                    {slide.subtitle}
                  </p>
                )}

                {slide.buttonText && (
                  <div class={`flex justify-center ${isActive ? 'hero-fade-up' : ''}`} style="animation-delay: 600ms;">
                    <Link
                      href={slide.buttonLink || '/productos'}
                      class="inline-block text-white font-bold no-underline transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                      style="background-color: #FF5722; padding: 1.2rem 3.5rem; border-radius: 14px; font-size: 1.1rem; box-shadow: 0 8px 25px rgba(255,87,34,0.4);"
                    >
                      {slide.buttonText}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick$={goPrev}
            class="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 items-center justify-center w-[50px] h-[50px] rounded-full text-white transition-all hover:bg-white/30 z-40"
            style="background-color: rgba(255,255,255,0.2); backdrop-filter: blur(4px);"
          >
            <LuChevronLeft class="w-7 h-7" />
          </button>
          <button
            onClick$={goNext}
            class="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center justify-center w-[50px] h-[50px] rounded-full text-white transition-all hover:bg-white/30 z-40"
            style="background-color: rgba(255,255,255,0.2); backdrop-filter: blur(4px);"
          >
            <LuChevronRight class="w-7 h-7" />
          </button>

          <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick$={() => goTo(idx)}
                class={`h-3 transition-all duration-300 cursor-pointer ${current.value === idx ? 'dot-active' : 'dot-inactive'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
});

// ─── Componente: Highlight Carousel ──────────────────────────────────────────────────────────
export const HighlightCarousel = component$(({ phrases }: { phrases: string[] }) => {
  const current = useSignal(0);

  useVisibleTask$(({ cleanup }) => {
    if (phrases.length <= 1) return;
    const id = setInterval(() => {
      current.value = (current.value + 1) % phrases.length;
    }, 5000);
    cleanup(() => clearInterval(id));
  });

  return (
    <div class="relative min-h-[160px] flex items-center justify-center overflow-hidden">
      {phrases.map((phrase, idx) => (
        <div
          key={idx}
          class="absolute inset-0 flex items-center justify-center transition-all duration-1000 px-4"
          style={{
            opacity: current.value === idx ? '1' : '0',
            transform: current.value === idx ? 'translateY(0)' : 'translateY(20px)',
            visibility: current.value === idx ? 'visible' : 'hidden',
          }}
        >
          <p class="text-xl md:text-3xl font-medium text-white max-w-4xl mx-auto leading-relaxed italic font-['Playfair_Display',_serif]">
            "{phrase}"
          </p>
        </div>
      ))}
    </div>
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

    const offerProducts = await db.select({
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
      .where(and(eq(products.status, 'active'), eq(products.is_offer, true)))
      .limit(4);

    const allBrands = await db.select().from(brands);

    const igPosts = await db.select().from(instagramPosts).orderBy(desc(instagramPosts.timestamp)).limit(6);
    const mappedIgPosts = igPosts.map((p) => ({
      id: p.id,
      mediaUrl: p.mediaUrl || '',
      permalink: p.permalink || '',
      caption: p.caption || undefined,
    }));

    // Parse highlight phrases
    let highlightPhrases: string[] = [];
    try {
      highlightPhrases = JSON.parse(contentMap['home_highlight_phrases'] || '[]');
    } catch { highlightPhrases = []; }
    if (highlightPhrases.length === 0) {
      highlightPhrases = [contentMap['home_highlight_phrase'] || 'Somos los principales referentes en el rubro de la distribución de materiales para la construcción, reparación y ampliación de redes de agua potable, cloaca, desagües pluviales y gas.'];
    }

    // Parse hero slides
    let heroSlides: HeroSlide[] = [];
    try {
      heroSlides = JSON.parse(contentMap['home_hero_slides'] || '[]');
      if (heroSlides.length === 0) {
        // Fallback to old format
        let oldImages: string[] = [];
        try { oldImages = JSON.parse(contentMap['hero_images'] || '[]'); } catch { oldImages = []; }
        if (oldImages.length === 0) oldImages = DEFAULT_HERO_SLIDES.map(s => s.url);
        
        heroSlides = oldImages.map((url, i) => ({
          url,
          alt: `Imagen del hero ${i + 1}`,
          title: i === 0 ? (contentMap['hero_title'] || 'Materiales para Redes de Agua y GAS') : '',
          subtitle: i === 0 ? (contentMap['hero_desc'] || 'Distribuidores mayoristas especializados...') : '',
          buttonText: 'Ver Catálogo',
          buttonLink: '/productos'
        }));
      }
    } catch { heroSlides = []; }

    return {
      highlightPhrases,
      heroSlides,
      weeklyOffer: {
        image: contentMap['home_weekly_offer_image'] || '',
        link: contentMap['home_weekly_offer_link'] || ''
      },
      categories: featuredCategories,
      products: featuredProducts,
      offers: offerProducts,
      brands: allBrands,
      instagramPosts: mappedIgPosts,
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      highlightPhrases: [],
      heroSlides: DEFAULT_HERO_SLIDES.map(s => ({ ...s, title: 'Insumos de Calidad', subtitle: 'Distribuidora líder...', buttonText: 'Ver Catálogo', buttonLink: '/productos' })),
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
      <HeroSlider slides={data.value.heroSlides} />

      {/* ════════════════════════════════════════════════
          SECCIÓN 2: OFERTA DE LA SEMANA (Banner)
      ════════════════════════════════════════════════ */}
      {data.value.weeklyOffer.image && (
        <section class="py-12 px-4">
          <div class="container mx-auto">
            <Link 
              href={data.value.weeklyOffer.link || '/productos'} 
              class="block relative rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.01] transition-transform duration-500 group"
            >
              <img 
                src={data.value.weeklyOffer.image} 
                alt="Oferta de la Semana" 
                class="w-full h-auto object-cover aspect-[21/9] md:aspect-[25/9]" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <span class="text-white font-bold bg-orange-600 px-6 py-2 rounded-lg shadow-lg">Ver Oferta Semanal</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          SECCIÓN 3: OFERTAS RELÁMPAGO (Grilla de 4)
      ════════════════════════════════════════════════ */}
      {data.value.offers.length > 0 && (
        <section class="py-16 bg-slate-50">
          <div class="container mx-auto px-4 md:px-8">
            <div class="mb-10 flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold text-slate-900">Ofertas Relámpago</h2>
                <p class="text-slate-500 mt-1">Precios imbatibles por tiempo limitado.</p>
              </div>
              <Link href="/productos" class="text-orange-600 font-bold text-sm hover:underline flex items-center gap-1">
                Ver todas <LuChevronRight class="w-4 h-4" />
              </Link>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.value.offers.map((offer) => (
                <ProductCard key={offer.id} product={offer} isOffer={true} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          SECCIÓN 4: PRODUCTOS DESTACADOS (Grilla de 4)
      ════════════════════════════════════════════════ */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4 md:px-8">
          <div class="mb-10 text-center">
            <h2 class="text-3xl font-bold tracking-tight text-slate-900 mb-2">Productos Destacados</h2>
            <p class="text-slate-500">Seleccionamos lo mejor para tus proyectos.</p>
          </div>

          {data.value.products.length > 0 ? (
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.value.products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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

      <section class="bg-white py-16 px-4">
        <div class="max-w-[1400px] mx-auto">
          <p class="text-center text-xs font-bold tracking-[0.25em] uppercase text-slate-400 mb-12">
            Marcas con las que Trabajamos
          </p>

          {data.value.brands.length > 0 ? (
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 items-center justify-items-center">
              {data.value.brands.map((brand, idx) => (
                <a
                  key={`${brand.id}-${idx}`}
                  href={getBrandLink(brand.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full max-w-[220px] h-[100px] flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:scale-105 transition-all duration-300 p-4"
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
          SECCIÓN 7: FRASE DESTACADA (Carousel)
      ════════════════════════════════════════════════ */}
      <section class="py-12 bg-orange-600 border-y border-orange-500 shadow-inner">
        <div class="container mx-auto px-4 md:px-8 text-center">
          <HighlightCarousel phrases={data.value.highlightPhrases} />
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
