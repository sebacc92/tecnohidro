import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../../db/client';
import { products, categories } from '../../db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { ContactButton } from '../../components/ContactButton';
import { LuFilter, LuTag } from '@qwikest/icons/lucide';

export const useCatalogData = routeLoader$(async (requestEvent) => {
  const url = requestEvent.url;
  const categorySlug = url.searchParams.get('category');
  const searchQ = url.searchParams.get('q');

  try {
    const db = getDb(requestEvent.env);
    const allCategories = await db.select().from(categories);

    const conditions = [eq(products.status, 'active')];

    if (categorySlug) {
      // Find category id first to filter reliably
      const cat = allCategories.find(c => c.slug === categorySlug);
      if (cat) {
        conditions.push(eq(products.category_id, cat.id));
      }
    }

    if (searchQ) {
      conditions.push(
        or(
          like(products.name, `%${searchQ}%`),
          like(products.description, `%${searchQ}%`)
        )!
      );
    }

    const filteredProducts = await db.select({
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
    .where(and(...conditions));

    return {
      categories: allCategories,
      products: filteredProducts,
      currentCategory: categorySlug,
      searchQuery: searchQ,
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      categories: [],
      products: [],
      currentCategory: null,
      searchQuery: null,
    };
  }
});

export default component$(() => {
  const data = useCatalogData();

  return (
    <div class="container mx-auto px-4 md:px-8 py-12">
      <div class="mb-8 border-b pb-6">
        <h1 class="text-3xl md:text-4xl font-bold text-slate-900">Catálogo de Productos</h1>
        {data.value.searchQuery && (
          <p class="text-slate-500 mt-2">
            Resultados de búsqueda para: <span class="font-semibold text-slate-800">"{data.value.searchQuery}"</span>
          </p>
        )}
      </div>

      <div class="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside class="w-full md:w-64 shrink-0">
          <div class="sticky top-24 bg-white p-5 rounded-xl border border-slate-200">
            <div class="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b pb-3">
              <LuFilter class="h-5 w-5" />
              <h2>Categorías</h2>
            </div>
            
            <ul class="space-y-2">
              <li>
                <Link 
                  href="/productos"
                  class={`block py-1.5 px-3 rounded-md transition-colors text-sm ${!data.value.currentCategory ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Todas las categorías
                </Link>
              </li>
              {data.value.categories.map((cat) => (
                <li key={cat.id}>
                  <Link 
                    href={`/productos?category=${cat.slug}${data.value.searchQuery ? `&q=${data.value.searchQuery}` : ''}`}
                    class={`block py-1.5 px-3 rounded-md transition-colors text-sm ${data.value.currentCategory === cat.slug ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product Grid */}
        <div class="flex-1">
          <div class="mb-6 flex justify-between items-center text-sm text-slate-500">
            <span>Mostrando {data.value.products.length} productos</span>
          </div>

          {data.value.products.length > 0 ? (
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.value.products.map((product) => {
                const imageUrl = product.images && product.images.length > 0 
                  ? product.images[0] 
                  : 'https://placehold.co/400x400/e2e8f0/475569?text=Sin+Imagen';

                return (
                  <div key={product.id} class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col group">
                    <Link href={`/productos/${product.slug}`} class="block aspect-square overflow-hidden bg-slate-100 relative">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        width={400}
                        height={400}
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {product.source === 'meli' && (
                        <div class="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-sm">
                          <LuTag class="w-3 h-3" /> MercadoLibre
                        </div>
                      )}
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
              No se encontraron productos que coincidan con tu búsqueda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Catálogo de Productos - Tecnohidro',
  meta: [
    {
      name: 'description',
      content: 'Explora nuestro catálogo completo de insumos de agua, gas y cloacas.',
    },
  ],
};
