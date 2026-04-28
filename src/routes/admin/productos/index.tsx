import { component$, $ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Link, Form, z, zod$, useNavigate } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LuPlus, LuTrash2, LuImage, LuTag, LuShoppingCart, LuClipboardEdit, LuRefreshCw, LuStar } from '@qwikest/icons/lucide';
import { getValidMeliToken } from '~/services/meli';


export const useProducts = routeLoader$(async (requestEvent) => {
  const db = getDb(requestEvent.env);
  const sourceFilter = requestEvent.url.searchParams.get('source');

  let conditions = undefined;
  if (sourceFilter === 'cms') {
    conditions = eq(products.source, 'cms');
  } else if (sourceFilter === 'meli') {
    conditions = eq(products.source, 'meli');
  }

  const query = db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      source: products.source,
      status: products.status,
      is_featured: products.is_featured,
      categoryName: categories.name,
      images: products.images,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id));

  if (conditions) {
    query.where(conditions);
  }

  const data = await query.orderBy(desc(products.id));
  
  return { 
    products: data,
    sourceFilter: sourceFilter || 'all'
  };
});

export const useDeleteProduct = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      await db.delete(products).where(eq(products.id, data.id as string));
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: 'Hubo un error al eliminar el producto.' };
    }
  },
  zod$({
    id: z.string(),
  })
);

export const useToggleStatus = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      await db.update(products).set({ status: data.status as 'active' | 'draft' }).where(eq(products.id, data.id as string));
      return { success: true };
    } catch (error) {
      console.error('Error toggling status:', error);
      return { success: false };
    }
  },
  zod$({
    id: z.string(),
    status: z.enum(['active', 'draft']),
  })
);

export const useToggleFeatured = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      await db.update(products).set({ is_featured: data.is_featured === 'true' }).where(eq(products.id, data.id as string));
      return { success: true };
    } catch (error) {
      console.error('Error toggling featured:', error);
      return { success: false };
    }
  },
  zod$({
    id: z.string(),
    is_featured: z.string(),
  })
);

export const useSyncMeliProducts = routeAction$(
  async (_, { env }) => {
    try {
      const userId = '191214085';
      
      let accessToken: string;
      try {
        accessToken = await getValidMeliToken(env, userId);
      } catch (error: any) {
        return { success: false, error: error.message || 'Error al obtener token de Mercado Libre' };
      }

      let allIds: string[] = [];
      const limit = 100;

      let searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?search_type=scan&limit=${limit}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!searchRes.ok) throw new Error('Error searching items init');
      
      let searchData = await searchRes.json();
      let scrollId = searchData.scroll_id;
      
      if (searchData.results && searchData.results.length > 0) {
        allIds = allIds.concat(searchData.results);
      }

      while (searchData.results && searchData.results.length > 0) {
        searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?search_type=scan&scroll_id=${scrollId}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!searchRes.ok) throw new Error('Error searching items scroll');
        
        searchData = await searchRes.json();
        
        if (searchData.results && searchData.results.length > 0) {
          allIds = allIds.concat(searchData.results);
        }
        scrollId = searchData.scroll_id;
      }

      if (allIds.length === 0) return { success: true, count: 0 };

      const db = getDb(env);
      let syncCount = 0;

      const chunkSize = 20;
      for (let i = 0; i < allIds.length; i += chunkSize) {
        const chunkIds = allIds.slice(i, i + chunkSize).join(',');
        const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${chunkIds}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!itemsRes.ok) throw new Error('Error fetching items detail');
        const itemsData = await itemsRes.json();

        for (const result of itemsData) {
          if (result.code !== 200) continue;
          const item = result.body;

          const meliId = item.id;
          const name = item.title;
          const price = item.price;
          const stock = item.available_quantity;
          const externalLink = item.permalink;
          const imageUrl = item.pictures && item.pictures.length > 0 
            ? item.pictures[0].secure_url 
            : item.thumbnail?.replace('http://', 'https://');
          const images = imageUrl ? [imageUrl] : [];
          const slugBase = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

          const existing = await db.select().from(products).where(eq(products.meli_id, meliId));
          
          if (existing.length > 0) {
            await db.update(products).set({
              name,
              price,
              stock,
              images,
              external_link: externalLink,
            }).where(eq(products.id, existing[0].id));
          } else {
            const newId = 'prod-meli-' + Math.random().toString(36).substring(2, 6);
            await db.insert(products).values({
              id: newId,
              name,
              slug: slugBase + '-' + newId.slice(-4),
              price,
              stock,
              source: 'meli',
              meli_id: meliId,
              external_link: externalLink,
              images,
              status: 'active',
              is_featured: false,
            });
          }
          syncCount++;
        }
      }

      return { success: true, count: syncCount };
    } catch (error) {
      console.error('Error syncing:', error);
      return { success: false, error: 'Error al sincronizar con MercadoLibre' };
    }
  }
);

export default component$(() => {
  const data = useProducts();
  const prods = data.value.products;
  const sourceFilter = data.value.sourceFilter;
  
  const deleteAction = useDeleteProduct();
  const toggleStatusAction = useToggleStatus();
  const toggleFeaturedAction = useToggleFeatured();
  const syncAction = useSyncMeliProducts();
  const nav = useNavigate();

  const handleFilter = $((source: string) => {
    if (source === 'all') {
      nav('/admin/productos');
    } else {
      nav(`/admin/productos?source=${source}`);
    }
  });

  return (
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Productos</h1>
          <p class="text-slate-500">Gestiona el catálogo de artículos disponibles.</p>
        </div>
        <div class="flex items-center gap-3">
          <Form action={syncAction} class="inline-block" spaReset={false}>
            <button
              type="submit"
              disabled={syncAction.isRunning}
              class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <LuRefreshCw class={`h-4 w-4 ${syncAction.isRunning ? 'animate-spin' : ''}`} />
              {syncAction.isRunning ? 'Sincronizando...' : 'Sincronizar Meli'}
            </button>
          </Form>
          <Link
            href="/admin/productos/nuevo"
            class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <LuPlus class="h-4 w-4" /> Nuevo Producto
          </Link>
        </div>
      </div>

      <div class="mb-6 flex gap-2 border-b border-slate-200">
        <button 
          onClick$={() => handleFilter('all')}
          class={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${sourceFilter === 'all' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Todos
        </button>
        <button 
          onClick$={() => handleFilter('cms')}
          class={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${sourceFilter === 'cms' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Solo CMS
        </button>
        <button 
          onClick$={() => handleFilter('meli')}
          class={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${sourceFilter === 'meli' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Solo MercadoLibre
        </button>
      </div>

      {deleteAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {deleteAction.value.error}
        </div>
      )}
      {syncAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {syncAction.value.error}
        </div>
      )}
      {syncAction.value?.success && (
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ¡Sincronización completada! Se actualizaron/crearon {syncAction.value.count} productos.
        </div>
      )}

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th class="px-6 py-3 font-medium">Producto</th>
                <th class="px-6 py-3 font-medium">Categoría</th>
                <th class="px-6 py-3 font-medium">Precio</th>
                <th class="px-6 py-3 font-medium">Stock</th>
                <th class="px-6 py-3 font-medium">Fuente</th>
                <th class="px-6 py-3 font-medium text-center">Destacado</th>
                <th class="px-6 py-3 font-medium text-center">Activo</th>
                <th class="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {prods.length === 0 ? (
                <tr>
                  <td colSpan={7} class="px-6 py-12 text-center text-slate-500">
                    No hay productos en el catálogo para esta vista.
                  </td>
                </tr>
              ) : (
                prods.map((product) => {
                  let imageUrl = null;
                  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    imageUrl = product.images[0];
                  }

                  return (
                    <tr key={product.id} class="hover:bg-slate-50/50">
                      <td class="px-6 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} class="w-full h-full object-cover" />
                            ) : (
                              <LuImage class="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div class="font-medium text-slate-900 text-xs line-clamp-2 max-w-[250px] whitespace-normal leading-tight" title={product.name}>
                            {product.name}
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-3 text-slate-600">
                        {product.categoryName || '-'}
                      </td>
                      <td class="px-6 py-3 font-medium text-slate-900">
                        ${product.price}
                      </td>
                      <td class="px-6 py-3 text-slate-600">
                        {product.stock}
                      </td>
                      <td class="px-6 py-3">
                        <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.source === 'meli' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {product.source === 'meli' ? <LuTag class="w-3 h-3 mr-1" /> : <LuShoppingCart class="w-3 h-3 mr-1" />}
                          {product.source.toUpperCase()}
                        </span>
                      </td>
                      <td class="px-6 py-3 text-center">
                        <Form action={toggleFeaturedAction} spaReset={false}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="is_featured" value={product.is_featured ? 'false' : 'true'} />
                          <button 
                            type="submit"
                            title={product.is_featured ? 'Quitar destacado' : 'Destacar'}
                            class="focus:outline-none transition-transform hover:scale-110"
                          >
                            <LuStar class={`w-5 h-5 ${product.is_featured ? 'fill-yellow-400 text-yellow-500' : 'text-slate-300'}`} />
                          </button>
                        </Form>
                      </td>
                      <td class="px-6 py-3 text-center">
                        <Form action={toggleStatusAction} spaReset={false}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="status" value={product.status === 'active' ? 'draft' : 'active'} />
                          <button 
                            type="submit"
                            title={product.status === 'active' ? 'Desactivar' : 'Activar'}
                            class={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${product.status === 'active' ? 'bg-cyan-600' : 'bg-slate-200'}`}
                          >
                            <span class="sr-only">Toggle estado</span>
                            <span
                              aria-hidden="true"
                              class={`pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-slate-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${product.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`}
                            />
                          </button>
                        </Form>
                      </td>
                      <td class="px-6 py-3 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/productos/${product.id}/`}
                            class="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-md transition-colors"
                            title="Editar"
                          >
                            <LuClipboardEdit class="h-4 w-4" />
                          </Link>
                          <Form action={deleteAction} class="inline-block" onSubmit$={(e) => { if (!window.confirm('¿Seguro que deseas eliminar este producto?')) e.preventDefault(); }}>
                            <input type="hidden" name="id" value={product.id} />
                            <button
                              type="submit"
                              class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                              title="Eliminar"
                            >
                              <LuTrash2 class="h-4 w-4" />
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Productos',
};
