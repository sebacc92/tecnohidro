import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../db/client';
import { products, categories, siteContent, brands, instagramPosts } from '../db/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';
import { ContactButton } from '../components/ContactButton';
import { buttonVariants } from '../components/ui/button/button';
import { SocialFeed } from '../components/SocialFeed';
import { LuChevronLeft, LuChevronRight, LuTruck, LuPackage, LuPercent } from '@qwikest/icons/lucide';

export const OfferCarousel = component$(({ offers }: { offers: any[] }) => {
  const currentIndex = useSignal(0);
  const timeLeft = useSignal<Record<string, { d: number, h: number, m: number, s: number }>>({});

  useVisibleTask$(({ cleanup }) => {
    const updateTimers = () => {
      const now = Date.now();
      const newTimeLeft: Record<string, { d: number, h: number, m: number, s: number }> = {};

      offers.forEach(offer => {
        if (!offer.offer_expires_at) return;
        const diff = new Date(offer.offer_expires_at).getTime() - now;
        if (diff > 0) {
          newTimeLeft[offer.id] = {
            d: Math.floor(diff / (1000 * 60 * 60 * 24)),
            h: Math.floor((diff / (1000 * 60 * 60)) % 24),
            m: Math.floor((diff / 1000 / 60) % 60),
            s: Math.floor((diff / 1000) % 60)
          };
        }
      });
      timeLeft.value = newTimeLeft;
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    cleanup(() => clearInterval(interval));
  });

  const nextOffer = $(() => {
    currentIndex.value = (currentIndex.value + 1) % offers.length;
  });

  const prevOffer = $(() => {
    currentIndex.value = (currentIndex.value - 1 + offers.length) % offers.length;
  });

  if (offers.length === 0) return null;

  const currentOffer = offers[currentIndex.value];
  const timer = timeLeft.value[currentOffer.id];
  const imageUrl = currentOffer.images && currentOffer.images.length > 0
    ? currentOffer.images[0]
    : 'https://placehold.co/500x500/f8fafc/94a3b8?text=Sin+Imagen';

  return (
    <div class="relative bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-slate-900">Oferta Destacada</h3>
      </div>

      <div class="aspect-square bg-slate-50 rounded-xl mb-6 overflow-hidden relative group border border-slate-100 flex items-center justify-center">
        <Link href={`/producto/${currentOffer.slug}`}>
          <img
            src={imageUrl}
            alt={currentOffer.name}
            width={500}
            height={500}
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {timer && (
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200/50 flex gap-3 text-center min-w-max">
            <div class="flex flex-col"><span class="text-lg font-bold text-red-600 leading-none">{timer.d}</span><span class="text-[10px] uppercase text-slate-500 font-semibold">Días</span></div>
            <span class="text-red-300 font-bold">:</span>
            <div class="flex flex-col"><span class="text-lg font-bold text-red-600 leading-none">{timer.h.toString().padStart(2, '0')}</span><span class="text-[10px] uppercase text-slate-500 font-semibold">Hrs</span></div>
            <span class="text-red-300 font-bold">:</span>
            <div class="flex flex-col"><span class="text-lg font-bold text-red-600 leading-none">{timer.m.toString().padStart(2, '0')}</span><span class="text-[10px] uppercase text-slate-500 font-semibold">Min</span></div>
            <span class="text-red-300 font-bold">:</span>
            <div class="flex flex-col"><span class="text-lg font-bold text-red-600 leading-none">{timer.s.toString().padStart(2, '0')}</span><span class="text-[10px] uppercase text-slate-500 font-semibold">Seg</span></div>
          </div>
        )}
      </div>

      <div>
        <h4 class="text-lg font-semibold text-slate-800 mb-2 truncate" title={currentOffer.name}>{currentOffer.name}</h4>
        <div class="flex items-end gap-3 mb-5">
          <span class="text-3xl font-bold text-primary-600">${(currentOffer.price || 0).toLocaleString('es-AR')}</span>
        </div>
        <Link href={`/producto/${currentOffer.slug}`} class={buttonVariants({ look: 'primary', size: 'md', class: 'w-full' })}>
          Aprovechar Oferta
        </Link>
      </div>

      {offers.length > 1 && (
        <>
          <button onClick$={prevOffer} class="absolute top-1/2 -left-4 -translate-y-1/2 bg-white rounded-full p-2 shadow-md border border-slate-200 text-slate-600 hover:text-primary-600 hover:scale-110 transition-all z-10" aria-label="Anterior oferta">
            <LuChevronLeft class="w-5 h-5" />
          </button>
          <button onClick$={nextOffer} class="absolute top-1/2 -right-4 -translate-y-1/2 bg-white rounded-full p-2 shadow-md border border-slate-200 text-slate-600 hover:text-primary-600 hover:scale-110 transition-all z-10" aria-label="Siguiente oferta">
            <LuChevronRight class="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
});

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
    if (normalizedName.includes(key)) {
      return url;
    }
  }
  return `https://www.google.com/search?q=${encodeURIComponent(brandName)}`;
}

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
      categoryName: categories.name,
    })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(eq(products.status, 'active'))
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
      .filter(p => !p.offer_expires_at || new Date(p.offer_expires_at).getTime() > nowMs)
      .slice(0, 5);

    const allBrands = await db.select().from(brands);

    const igPosts = await db.select().from(instagramPosts).orderBy(desc(instagramPosts.timestamp)).limit(6);

    // Map to ensure no nulls in required fields
    const mappedIgPosts = igPosts.map(post => ({
      id: post.id,
      mediaUrl: post.mediaUrl || '',
      permalink: post.permalink || '',
      caption: post.caption || undefined,
    }));

    return {
      heroTitle: contentMap['hero_title'] || 'Insumos de Calidad para Profesionales',
      heroDescription: contentMap['hero_desc'] || 'Distribuidora líder en insumos de agua, gas y cloacas. Proveemos a instaladores, consorcios y particulares.',
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
      heroDescription: 'Distribuidora líder en insumos de agua, gas y cloacas. Proveemos a instaladores, consorcios y particulares.',
      homeHighlightPhrase: 'Somos los principales referentes en el rubro de la distribución de materiales para la construcción, reparación y ampliación de redes de agua potable, cloaca, desagües pluviales y gas.',
      categories: [],
      products: [],
      offers: [],
      brands: [],
      instagramPosts: [],
    };
  }
});

export default component$(() => {
  const data = useHomeData();

  return (
    <div>
      {/* Hero Section */}
      <section class="bg-gradient-to-b from-primary-50 to-white py-16 lg:py-24 overflow-hidden relative">
        <div class="container mx-auto px-4 md:px-8 relative z-10">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Column: Text and CTA */}
            <div class="text-left">
              <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                {data.value.heroTitle}
              </h1>
              <p class="text-lg md:text-xl text-slate-600 mb-10 max-w-xl">
                {data.value.heroDescription}
              </p>
              <div class="flex flex-col sm:flex-row gap-4">
                <Link href="/productos" class={buttonVariants({ look: 'primary', size: 'lg' })}>
                  Ver Catálogo
                </Link>
              </div>
            </div>

            {/* Right Column: Featured/Offer Products Space */}
            <div class="relative lg:ml-auto w-full max-w-md mx-auto lg:mx-0 min-h-[400px]">
              {/* Decorative background blur */}
              <div class="absolute inset-0 bg-primary-200 rounded-full blur-3xl opacity-40 transform translate-x-1/4 -translate-y-1/4"></div>

              {data.value.offers.length > 0 && (
                <OfferCarousel offers={data.value.offers} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section class="py-16 bg-white border-t border-slate-100 overflow-hidden">
        <div class="container mx-auto px-4 md:px-8 mb-12 text-center">
          <h2 class="text-3xl font-bold tracking-tight text-slate-900 mb-4">Marcas con las que Trabajamos</h2>
          <p class="text-slate-500 max-w-2xl mx-auto">Respaldamos nuestros proyectos con productos de las mejores marcas del mercado.</p>
        </div>

        {/* Marquee Container */}
        <div class="relative w-full flex items-center py-4 overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-24 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-24 after:bg-gradient-to-l after:from-white after:to-transparent">
          {data.value.brands.length > 0 ? (
            <div class="flex w-max animate-marquee hover:[animation-play-state:paused]">
              {Array(4).fill(data.value.brands).flat().map((brand, idx) => (
                <a
                  key={`${brand.id}-${idx}`}
                  href={getBrandLink(brand.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-center w-40 md:w-56 px-6 mx-4 aspect-[3/2] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-110 transition-all duration-300"
                >
                  <img src={brand.imageUrl} alt={brand.name} class="max-h-full max-w-full object-contain mix-blend-multiply" loading="lazy" />
                </a>
              ))}
            </div>
          ) : (
            <div class="p-8 text-center text-slate-400 w-full">No hay marcas disponibles.</div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section class="py-16 bg-slate-50 border-t border-slate-100">
        <div class="container mx-auto px-4 md:px-8">
          <div class="mb-10 text-center">
            <h2 class="text-3xl font-bold tracking-tight text-slate-900 mb-2">Productos Destacados</h2>
            <p class="text-slate-500">Calidad garantizada para tus obras.</p>
          </div>

          {data.value.products.length > 0 ? (
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.value.products.map((product) => {
                const imageUrl = product.images && product.images.length > 0
                  ? product.images[0]
                  : 'https://placehold.co/400x400/e2e8f0/475569?text=Sin+Imagen';

                return (
                  <div key={product.id} class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                    <Link href={`/productos/${product.slug}`} class="block aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        width={400}
                        height={400}
                        class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </Link>
                    <div class="p-5 flex flex-col flex-1">
                      <span class="text-xs font-medium text-primary-600 mb-1 block">
                        {product.categoryName || 'General'}
                      </span>
                      <Link href={`/productos/${product.slug}`} class="hover:underline">
                        <h3 class="font-semibold text-slate-800 text-lg leading-tight mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>

                      <div class="mt-auto pt-4 flex flex-col gap-3">
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

      {/* Features Section */}
      <section class="py-12 bg-slate-100 border-t border-slate-200">
        <div class="container mx-auto px-4 md:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div class="bg-white p-8 rounded-xl shadow-sm border-2 border-orange-500 flex flex-col hover:shadow-md transition-shadow">
              <LuTruck class="w-10 h-10 text-orange-600 mb-4" />
              <h3 class="text-xl font-bold text-orange-600 mb-3">Envíos a todo el país</h3>
              <p class="text-slate-600 leading-relaxed">
                Elegí la forma de entrega que prefieras ¡y listo!
                <br /><br />
                Aseguramos tu entrega con envíos de Mercado Libre.
              </p>
            </div>

            {/* Card 2 */}
            <div class="bg-white p-8 rounded-xl shadow-sm border-2 border-orange-500 flex flex-col hover:shadow-md transition-shadow">
              <LuPackage class="w-10 h-10 text-orange-600 mb-4" />
              <h3 class="text-xl font-bold text-orange-600 mb-3">Envíos Gratis</h3>
              <p class="text-slate-600 leading-relaxed">
                Envío gratis en compras con envíos de Mercado Libre a partir de $70.000
              </p>
            </div>

            {/* Card 3 */}
            <div class="bg-white p-8 rounded-xl shadow-sm border-2 border-orange-500 flex flex-col hover:shadow-md transition-shadow">
              <LuPercent class="w-10 h-10 text-orange-600 mb-4" />
              <h3 class="text-xl font-bold text-orange-600 mb-3">Promociones con tarjeta de crédito</h3>
              <p class="text-slate-600 leading-relaxed">
                6 Cuotas sin interés, Banco Provincia, Presencial en el local.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Social Feed */}
      <SocialFeed posts={data.value.instagramPosts} />

      {/* Highlight Phrase Section */}
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
      content: 'Distribuidora líder en insumos de agua, gas y cloacas para profesionales e industrias.',
    },
  ],
};
