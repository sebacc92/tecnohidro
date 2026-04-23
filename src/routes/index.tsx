import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../db/client';
import { products, categories, siteContent } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ContactButton } from '../components/ContactButton';
import { buttonVariants } from '../components/ui/button/button';

export const useHomeData = routeLoader$(async ({ env }) => {
  try {
    const db = getDb(env);
    const contentData = await db.select().from(siteContent);
    const contentMap = contentData.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const featuredCategories = await db.select().from(categories).limit(4);

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

    return {
      heroTitle: contentMap['hero_title'] || 'Insumos de Calidad para Profesionales',
      heroDescription: contentMap['hero_desc'] || 'Distribuidora líder en insumos de agua, gas y cloacas. Proveemos a instaladores, consorcios y particulares.',
      categories: featuredCategories,
      products: featuredProducts,
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      heroTitle: 'Insumos de Calidad para Profesionales',
      heroDescription: 'Distribuidora líder en insumos de agua, gas y cloacas. Proveemos a instaladores, consorcios y particulares.',
      categories: [],
      products: [],
    };
  }
});

export default component$(() => {
  const data = useHomeData();

  return (
    <div>
      {/* Hero Section */}
      <section class="bg-gradient-to-b from-primary-50 to-white py-20 lg:py-32">
        <div class="container mx-auto px-4 md:px-8 text-center">
          <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto">
            {data.value.heroTitle}
          </h1>
          <p class="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            {data.value.heroDescription}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/productos" class={buttonVariants({ look: 'primary', size: 'lg' })}>
              Ver Catálogo
            </Link>
            <Link href="/contacto" class={buttonVariants({ look: 'outline', size: 'lg' })}>
              Contactar Asesor
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4 md:px-8">
          <div class="flex justify-between items-end mb-10">
            <div>
              <h2 class="text-3xl font-bold tracking-tight text-slate-900 mb-2">Categorías Principales</h2>
              <p class="text-slate-500">Encuentra todo lo que necesitas por rubro.</p>
            </div>
            <Link href="/productos" class="hidden md:inline-flex text-primary-600 hover:text-primary-700 font-medium">
              Ver todas &rarr;
            </Link>
          </div>

          {data.value.categories.length > 0 ? (
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {data.value.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/productos?category=${category.slug}`}
                  class="group flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all text-center"
                >
                  <div class="w-16 h-16 mb-4 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {/* Placeholder icon since we don't store icons yet */}
                    <span class="text-2xl font-bold">{category.name.charAt(0)}</span>
                  </div>
                  <h3 class="font-semibold text-slate-800">{category.name}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <div class="p-8 text-center text-slate-500 border border-dashed rounded-lg">
              No hay categorías disponibles.
            </div>
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
