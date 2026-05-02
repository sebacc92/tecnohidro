import { component$, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link, useLocation } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { eq, like, or, and, inArray, desc, sql } from 'drizzle-orm';
import { AddToCartButton } from '~/components/cart/add-to-cart-button';
import { LuFilter, LuTag, LuChevronDown, LuLayoutGrid, LuList, LuCheck, LuPercent, LuStar } from '@qwikest/icons/lucide';
import { ProductImageCarousel } from '~/components/ProductImageCarousel';
import { ShareButton } from '~/components/ui/share-button';

import { LiveSearch } from '~/components/LiveSearch';


export const useCatalogData = routeLoader$(async (requestEvent) => {
  const url = requestEvent.url;
  const categorySlug = url.searchParams.get('category');
  const searchQ = url.searchParams.get('q');
  const isOffers = url.searchParams.get('ofertas') === 'true';
  const isFeatured = url.searchParams.get('destacados') === 'true';

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

    if (isOffers) {
      conditions.push(eq(products.is_offer, true));
    }

    if (isFeatured) {
      conditions.push(eq(products.is_featured, true));
    }

    const page = parseInt(url.searchParams.get('page') || '1') || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(products);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const countRes = await countQuery;
    const totalCount = countRes[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const filteredProducts = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      images: products.images,
      source: products.source,
      external_link: products.external_link,
      is_offer: products.is_offer,
      discount_price: products.discount_price,
      discount_percent: products.discount_percent,
      sku: products.sku,
      categoryName: categories.name,
    })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(and(...conditions))
      .orderBy(desc(products.id))
      .limit(limit)
      .offset(offset);

    return {
      categories: allCategories,
      products: filteredProducts,
      currentCategory: categorySlug,
      searchQuery: searchQ,
      isOffers,
      isFeatured,
      page,
      totalPages,
      totalCount
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      categories: [],
      products: [],
      currentCategory: null,
      searchQuery: null,
      isOffers: false,
      isFeatured: false,
      page: 1,
      totalPages: 1,
      totalCount: 0
    };
  }
});

export default component$(() => {
  const data = useCatalogData();
  const loc = useLocation();
  const viewMode = useSignal<'grid' | 'list'>('grid');
  const { page, totalPages, totalCount } = data.value;

  // Build base query string for pagination links
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams(loc.url.search);
    params.set('page', p.toString());
    return `${loc.url.pathname}?${params.toString()}`;
  };

  const rootCategories = data.value.categories
    .filter(c => !c.parent_id)
    .sort((a, b) => ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || a.name.localeCompare(b.name));
  const getSubcategories = (parentId: string) => data.value.categories
    .filter(c => c.parent_id === parentId)
    .sort((a, b) => ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || a.name.localeCompare(b.name));

  return (
    <div class="container mx-auto px-4 md:px-8 py-12">
      <div class="mb-8 border-b pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold text-slate-900">
            {data.value.isOffers ? 'Ofertas Relámpago' : data.value.isFeatured ? 'Productos Destacados' : 'Catálogo de Productos'}
          </h1>
          {data.value.searchQuery && (
            <p class="text-slate-500 mt-2">
              Resultados de búsqueda para: <span class="font-semibold text-slate-800">"{data.value.searchQuery}"</span>
            </p>
          )}
        </div>
        <div class="w-full md:w-80 lg:w-96">
          <LiveSearch />
        </div>
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

            <div class="mt-8 mb-4 border-t pt-6">
              <div class="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b pb-3">
                <LuStar class="h-5 w-5" />
                <h2>Especiales</h2>
              </div>
              <ul class="space-y-2">
                <li>
                  <Link
                    href="/productos?destacados=true"
                    class={`block py-1.5 px-3 rounded-md transition-colors text-sm ${data.value.isFeatured ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Productos Destacados
                  </Link>
                </li>
                <li>
                  <Link
                    href="/productos?ofertas=true"
                    class={`block py-1.5 px-3 rounded-md transition-colors text-sm ${data.value.isOffers ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Ofertas Relámpago
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div class="flex-1 relative">
          {loc.isNavigating && (
            <div class="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-30 flex items-center justify-center rounded-xl">
              <div class="flex flex-col items-center gap-3">
                <svg class="animate-spin h-10 w-10 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-sm font-bold text-orange-600 uppercase tracking-widest animate-pulse">Filtrando...</span>
              </div>
            </div>
          )}

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
            <>
              <div class={viewMode.value === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-3'}>
                {data.value.products.map((product) => {
                  const images = (product.images && Array.isArray(product.images)) ? product.images as string[] : [];
                  const firstImage = images.length > 0 ? images[0] : 'https://placehold.co/400x400/e2e8f0/475569?text=Sin+Imagen';
                  const hasPrice = product.price != null && product.price > 0;
                  const inStock = product.stock != null && product.stock > 0;

                  const cartProduct = {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    sku: product.sku || null,
                    price: product.is_offer && product.discount_price ? product.discount_price : (product.price || null),
                    image: firstImage,
                  };

                  /* ═══ VISTA LISTA ═══ */
                  if (viewMode.value === 'list') {
                    return (
                      <div key={product.id} class="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-row overflow-hidden">
                        {/* Imagen */}
                        <Link href={`/productos/${product.slug}`} class="relative w-28 sm:w-32 bg-slate-50 flex items-center justify-center overflow-hidden">
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
                            <AddToCartButton product={cartProduct} class="flex-1 !h-8 !text-xs" />
                            <ShareButton product={{ id: product.id, name: product.name }} />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  /* ═══ VISTA GRILLA ═══ */
                  return (
                    <div key={product.id} class="bg-white rounded-xl border border-slate-200 hover:border-slate-300 overflow-hidden hover:shadow-lg transition-all flex flex-col group">
                      {/* Imagen */}
                      <div class="aspect-square overflow-hidden bg-white relative">
                        {product.source === 'meli' && (
                          <div class="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm z-20">
                            <LuTag class="w-3 h-3" /> MercadoLibre
                          </div>
                        )}
                        {product.is_offer && (
                          <div class="absolute top-2 left-2 z-20">
                            <div class="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm flex items-center gap-1 w-fit">
                              <LuPercent class="w-3 h-3" /> OFERTA
                            </div>
                          </div>
                        )}
                        {images.length > 1 && !product.is_offer && (
                          <span class="absolute top-2.5 left-2.5 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm z-20">
                            {images.length} fotos
                          </span>
                        )}
                        <ProductImageCarousel images={images} productName={product.name} />
                      </div>

                      {/* Info */}
                      <div class="p-3 flex flex-col flex-1">
                        <span class="text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-1">
                          {product.categoryName || 'General'}
                        </span>
                        <Link href={`/productos/${product.slug}`} class="hover:text-orange-600 transition-colors">
                          <h3 class="font-semibold text-slate-800 leading-snug mb-2 line-clamp-2 text-[13px]">
                            {product.name}
                          </h3>
                        </Link>
                        <div class="mt-auto">
                          {hasPrice && (
                            <div class="flex flex-col mb-3">
                              {product.is_offer && product.discount_price && product.discount_price > 0 ? (
                                <>
                                  <div class="flex items-center gap-2 mb-1">
                                    <span class="text-[11px] text-slate-400 line-through font-medium">${(product.price || 0).toLocaleString('es-AR')}</span>
                                    <span class="text-[10px] font-bold text-red-600 uppercase">-{product.discount_percent}% OFF</span>
                                  </div>
                                  <span class="text-2xl font-black text-slate-900 leading-none">${product.discount_price.toLocaleString('es-AR')}</span>
                                  <span class="text-[11px] font-bold text-emerald-600 uppercase tracking-tighter mt-2">
                                    ¡Ahorrás ${(product.price! - product.discount_price).toLocaleString('es-AR')}!
                                  </span>
                                </>
                              ) : (
                                <span class="text-2xl font-black text-slate-900 leading-none">${product.price!.toLocaleString('es-AR')}</span>
                              )}
                            </div>
                          )}
                          <AddToCartButton product={cartProduct} class="w-full !h-8 !text-xs" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div class="mt-12 flex flex-col items-center gap-4">
                  <div class="text-sm text-slate-500">
                    Mostrando <span class="font-medium text-slate-900">{(page - 1) * 24 + 1}</span> a <span class="font-medium text-slate-900">{Math.min(page * 24, totalCount)}</span> de <span class="font-medium text-slate-900">{totalCount}</span> productos
                  </div>

                  <div class="flex items-center gap-2">
                    <Link
                      href={page > 1 ? buildPageUrl(page - 1) : ''}
                      class={`px-4 py-2 rounded-lg font-medium transition-colors border ${page <= 1 ? 'border-slate-200 text-slate-400 pointer-events-none' : 'border-cyan-600 text-cyan-600 hover:bg-cyan-50'}`}
                    >
                      Anterior
                    </Link>

                    <div class="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p = page - 2 + i;
                        if (page < 3) p = i + 1;
                        else if (page > totalPages - 2) p = totalPages - 4 + i;

                        if (p > 0 && p <= totalPages) {
                          return (
                            <Link
                              key={p}
                              href={buildPageUrl(p)}
                              class={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${page === p ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'}`}
                            >
                              {p}
                            </Link>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <Link
                      href={page < totalPages ? buildPageUrl(page + 1) : ''}
                      class={`px-4 py-2 rounded-lg font-medium transition-colors border ${page >= totalPages ? 'border-slate-200 text-slate-400 pointer-events-none' : 'border-cyan-600 text-cyan-600 hover:bg-cyan-50'}`}
                    >
                      Siguiente
                    </Link>
                  </div>
                </div>
              )}
            </>
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
