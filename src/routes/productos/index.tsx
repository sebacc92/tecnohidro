import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../../db/client';
import { products, categories } from '../../db/schema';
import { eq, like, or, and, inArray } from 'drizzle-orm';
import { ContactButton } from '../../components/ContactButton';
import { LuFilter, LuTag, LuChevronDown } from '@qwikest/icons/lucide';
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
                              href={`/productos?category=${cat.slug}${data.value.searchQuery ? `&q=${data.value.searchQuery}` : ''}`}
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
                                  href={`/productos?category=${sub.slug}${data.value.searchQuery ? `&q=${data.value.searchQuery}` : ''}`}
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
                      href={`/productos?category=${cat.slug}${data.value.searchQuery ? `&q=${data.value.searchQuery}` : ''}`}
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
          </div>

          {data.value.products.length > 0 ? (
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.value.products.map((product) => {
                const images = (product.images && Array.isArray(product.images)) ? product.images as string[] : [];

                return (
                  <div key={product.id} class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col group">
                    <div class="block aspect-square overflow-hidden bg-slate-100 relative">
                      {product.source === 'meli' && (
                        <div class="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-sm z-20">
                          <LuTag class="w-3 h-3" /> MercadoLibre
                        </div>
                      )}
                      {images.length > 1 && (
                        <span class="absolute top-2 left-2 bg-black/50 text-white px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm w-fit z-20">
                          {images.length} fotos
                        </span>
                      )}
                      
                      <ProductImageCarousel
                        images={images}
                        productName={product.name}
                      />
                    </div>
                    
                    <div class="p-5 flex flex-col flex-1">
                      <span class="text-xs font-medium text-cyan-700 mb-1 block">
                        {product.categoryName || 'General'}
                      </span>
                      <Link href={`/producto/${product.id}/`} class="hover:underline block">
                        <h3 class="font-semibold text-slate-800 text-lg leading-tight mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div class="mt-auto pt-4 flex items-center gap-2">
                        <ContactButton productName={product.name} look="primary" size="sm" class="flex-1" />
                        <ShareButton product={{ id: product.id, name: product.name }} />
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
