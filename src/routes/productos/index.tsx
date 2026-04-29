import { component$, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../../db/client';
import { products, categories } from '../../db/schema';
import { eq, like, or, and, inArray } from 'drizzle-orm';
import { ContactButton } from '../../components/ContactButton';
import { LuFilter, LuTag, LuChevronDown, LuExternalLink, LuLayoutGrid, LuList, LuCheck } from '@qwikest/icons/lucide';
import { ProductImageCarousel } from '../../components/ProductImageCarousel';
import { ShareButton } from '../../components/ui/share-button';


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
        // Find all direct subcategories (assuming 2 levels deep for simple catalog)
        const subCats = allCategories.filter(c => c.parent_id === cat.id);
        const allIdsToMatch = [cat.id, ...subCats.map(c => c.id)];
        conditions.push(inArray(products.category_id, allIdsToMatch));
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
      stock: products.stock,
      images: products.images,
      source: products.source,
      external_link: products.external_link,
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
  const viewMode = useSignal<'grid' | 'list'>('grid');

  const rootCategories = data.value.categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => data.value.categories.filter(c => c.parent_id === parentId);

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
              {rootCategories.map((cat) => {
                const subcats = getSubcategories(cat.id);
                const isExpanded = data.value.currentCategory === cat.slug || subcats.some(s => s.slug === data.value.currentCategory);
                const isCatActive = data.value.currentCategory === cat.slug;

                if (subcats.length > 0) {
                  return (
                    <li key={cat.id} class="mb-1">
                      <details class="group" open={isExpanded}>
                        <summary class={`flex justify-between items-center cursor-pointer py-1.5 px-3 rounded-md transition-colors text-sm list-none select-none ${isCatActive ? 'text-primary-700 font-semibold' : 'text-slate-700 font-medium hover:bg-slate-50'}`}>
                          <span>{cat.name}</span>
                          <LuChevronDown class="h-4 w-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <ul class="pl-4 mt-1 border-l-2 border-slate-100 ml-4 space-y-1 mb-2">
                          <li>
                            <Link
                              href={`/categorias/${cat.slug}`}
                              class={`block py-1 px-2 rounded text-xs transition-colors ${isCatActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                              Todo {cat.name}
                            </Link>
                          </li>
                          {subcats.map((sub) => {
                            const isSubActive = data.value.currentCategory === sub.slug;
                            return (
                              <li key={sub.id}>
                                <Link
                                  href={`/categorias/${cat.slug}/${sub.slug}`}
                                  class={`block py-1 px-2 rounded text-xs transition-colors ${isSubActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    </li>
                  );
                }

                return (
                  <li key={cat.id} class="mb-1">
                    <Link
                      href={`/categorias/${cat.slug}`}
                      class={`block py-1.5 px-3 rounded-md transition-colors text-sm ${isCatActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700 font-medium hover:bg-slate-50'}`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Product Grid */}
        <div class="flex-1">
          <div class="mb-6 flex justify-between items-center text-sm text-slate-500">
            <span>Mostrando {data.value.products.length} productos</span>
            <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick$={() => viewMode.value = 'grid'}
                class={`p-1.5 rounded-md transition-colors ${viewMode.value === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="Vista en grilla"
              >
                <LuLayoutGrid class="w-4 h-4" />
              </button>
              <button
                onClick$={() => viewMode.value = 'list'}
                class={`p-1.5 rounded-md transition-colors ${viewMode.value === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="Vista en lista"
              >
                <LuList class="w-4 h-4" />
              </button>
            </div>
          </div>

          {data.value.products.length > 0 ? (
            <div class={viewMode.value === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-3'}>
              {data.value.products.map((product) => {
                const images = (product.images && Array.isArray(product.images)) ? product.images as string[] : [];
                const firstImage = images.length > 0 ? images[0] : 'https://placehold.co/400x400/e2e8f0/475569?text=Sin+Imagen';
                const hasPrice = product.price != null && product.price > 0;
                const inStock = product.stock != null && product.stock > 0;

                /* ═══ VISTA LISTA ═══ */
                if (viewMode.value === 'list') {
                  return (
                    <div key={product.id} class="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-row overflow-hidden">
                      {/* Imagen */}
                      <Link href={`/productos/${product.slug}`} class="relative flex-w-28 sm:w-32 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {product.source === 'meli' && (
                          <div class="absolute top-1.5 right-1.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm z-10">
                            <LuTag class="w-2.5 h-2.5" /> ML
                          </div>
                        )}
                        <img src={firstImage} alt={product.name} width={128} height={128}
                          class="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </Link>

                      {/* Centro: categoría + nombre */}
                      <div class="flex-1 px-4 flex flex-col justify-center min-w-0 overflow-hidden">
                        <span class="text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-0.5 truncate">
                          {product.categoryName || 'General'}
                        </span>
                        <Link href={`/productos/${product.slug}`} class="hover:text-orange-600 transition-colors">
                          <h3 class="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                      </div>

                      {/* Derecha: precio + stock + acciones */}
                      <div style="width: 200px;" class="flex flex-col items-end justify-center gap-1.5 px-4 border-l border-slate-100">
                        <div class="text-right">
                          {hasPrice ? (
                            <span class="text-lg font-bold text-orange-600 block">${product.price!.toLocaleString('es-AR')}</span>
                          ) : (
                            <span class="text-xs text-slate-400 block">Consultar precio</span>
                          )}
                          {inStock ? (
                            <span class="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                              <LuCheck class="w-3 h-3" /> En Stock
                            </span>
                          ) : (
                            <span class="text-[11px] text-amber-600 font-medium">Consultar stock</span>
                          )}
                        </div>
                        <div class="flex items-center gap-1.5 w-full">
                          <ContactButton productName={product.name} look="primary" size="sm" class="flex-1 !h-8 !text-xs" />
                          <ShareButton product={{ id: product.id, name: product.name }} />
                        </div>
                        {product.source === 'meli' && product.external_link && (
                          <a
                            href={product.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center justify-center gap-1 rounded-lg text-[11px] font-bold bg-yellow-400 text-yellow-900 hover:bg-yellow-500 transition-colors h-7 px-2 w-full"
                          >
                            <LuExternalLink class="h-3 w-3" />
                            MercadoLibre
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }

                /* ═══ VISTA GRILLA ═══ */
                return (
                  <div key={product.id} class="bg-white rounded-xl border border-slate-200 hover:border-slate-300 overflow-hidden hover:shadow-lg transition-all flex flex-col group">
                    {/* Imagen */}
                    <div class="aspect-[4/3] overflow-hidden bg-slate-50 relative">
                      {product.source === 'meli' && (
                        <div class="absolute top-2.5 right-2.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm z-20">
                          <LuTag class="w-3 h-3" /> MercadoLibre
                        </div>
                      )}
                      {images.length > 1 && (
                        <span class="absolute top-2.5 left-2.5 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm z-20">
                          {images.length} fotos
                        </span>
                      )}
                      <ProductImageCarousel images={images} productName={product.name} />
                    </div>

                    {/* Info */}
                    <div class="p-4 flex flex-col flex-1">
                      <span class="text-[11px] font-semibold text-orange-600 uppercase tracking-wider mb-1">
                        {product.categoryName || 'General'}
                      </span>
                      <Link href={`/productos/${product.slug}`} class="hover:text-orange-600 transition-colors">
                        <h3 class="font-semibold text-slate-800 leading-snug mb-2 line-clamp-2 text-[15px]">
                          {product.name}
                        </h3>
                      </Link>
                      {hasPrice && (
                        <span class="text-xl font-bold text-orange-600 mb-3">${product.price!.toLocaleString('es-AR')}</span>
                      )}

                      {/* Acciones */}
                      <div class="mt-auto flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                          <ContactButton productName={product.name} look="primary" size="sm" class="flex-1" />
                          <ShareButton product={{ id: product.id, name: product.name }} />
                        </div>
                        {product.source === 'meli' && product.external_link && (
                          <a
                            href={product.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-bold bg-yellow-400 text-yellow-900 hover:bg-yellow-500 transition-colors h-9 px-4 w-full"
                          >
                            <LuExternalLink class="h-4 w-4" />
                            Ver en MercadoLibre
                          </a>
                        )}
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
