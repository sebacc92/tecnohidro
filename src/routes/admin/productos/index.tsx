import { component$, $, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Link, Form, z, zod$, useNavigate } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
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

  const page = parseInt(requestEvent.url.searchParams.get('page') || '1') || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const countQuery = db.select({ count: sql<number>`count(*)` }).from(products);
  if (conditions) {
    countQuery.where(conditions);
  }
  const countRes = await countQuery;
  const totalCount = countRes[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const query = db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      price: products.price,
      stock: products.stock,
      sold_quantity: products.sold_quantity,
      source: products.source,
      status: products.status,
      meli_status: products.meli_status,
      is_featured: products.is_featured,
      categoryName: categories.name,
      images: products.images,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id));

  if (conditions) {
    query.where(conditions);
  }

  const data = await query.orderBy(desc(products.id)).limit(limit).offset(offset);

  return {
    products: data,
    sourceFilter: sourceFilter || 'all',
    page,
    totalPages,
    totalCount
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

export const useSyncMeliDiscovery = routeAction$(
  async (_, { env }) => {
    try {
      const userId = '191214085';
      const accessToken = await getValidMeliToken(env, userId);

      const [activeRes, pausedRes] = await Promise.all([
        fetch(`https://api.mercadolibre.com/users/${userId}/items/search?status=active`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`https://api.mercadolibre.com/users/${userId}/items/search?status=paused`, { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);

      const activeData = await activeRes.json();
      const pausedData = await pausedRes.json();

      return {
        success: true,
        active: activeData.paging?.total || 0,
        paused: pausedData.paging?.total || 0,
        total: (activeData.paging?.total || 0) + (pausedData.paging?.total || 0)
      };
    } catch (error: any) {
      console.error('Discovery error:', error);
      return { success: false, error: 'Error al consultar el catálogo de MercadoLibre' };
    }
  }
);

export const useSyncMeliProducts = routeAction$(
  async (data, { env }) => {
    try {
      const userId = '191214085';
      const accessToken = await getValidMeliToken(env, userId);

      const limit = 50;
      const scrollId = data.scrollId as string;
      const statusFilter = data.statusFilter as string; // 'active', 'all'
      const sort = data.sort as string; // 'sold_quantity_desc', 'price_asc', 'price_desc'

      let searchUrl = `https://api.mercadolibre.com/users/${userId}/items/search?search_type=scan&limit=${limit}`;
      if (statusFilter && statusFilter !== 'all') {
        searchUrl += `&status=${statusFilter}`;
      }
      // Note: search_type=scan generally ignores sort, but we append it anyway if requested
      if (sort) {
        searchUrl += `&orders=${sort}`;
      }

      if (scrollId) {
        searchUrl += `&scroll_id=${scrollId}`;
      }

      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!searchRes.ok) {
        const err = await searchRes.text();
        throw new Error(`Error searching items: ${err}`);
      }

      const searchData = await searchRes.json();
      const newScrollId = searchData.scroll_id;
      const itemIds = searchData.results || [];

      if (itemIds.length === 0) {
        return { success: true, count: 0, scrollId: null, finished: true };
      }

      // Fetch details in batches of 20 (Meli limit for /items?ids=)
      const db = getDb(env);
      let syncCount = 0;
      const chunkSize = 20;

      for (let i = 0; i < itemIds.length; i += chunkSize) {
        const chunkIds = itemIds.slice(i, i + chunkSize).join(',');
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
          const originalPrice = item.original_price;
          const stock = item.available_quantity;
          const soldQuantity = item.sold_quantity || 0;
          const externalLink = item.permalink;
          const status = item.status; // 'active', 'paused', etc
          const lastUpdated = item.last_updated;

          // SKUs are in attributes
          const skuAttr = item.attributes?.find((a: any) => a.id === 'SELLER_SKU');
          const sku = skuAttr ? skuAttr.value_name : null;

          // All high-res images
          let images: string[] = [];
          if (item.pictures && item.pictures.length > 0) {
            images = item.pictures.map((p: any) => p.secure_url);
          } else if (item.thumbnail) {
            images = [item.thumbnail.replace('http://', 'https://')];
          }

          const slugBase = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const newId = 'prod-meli-' + Math.random().toString(36).substring(2, 6);
          const slug = slugBase + '-' + newId.slice(-4);

          let isOffer = false;
          let discountPrice = null;
          let discountPercent = null;
          let dbPrice = price;

          if (originalPrice && originalPrice > price) {
            isOffer = true;
            dbPrice = originalPrice;
            discountPrice = price;
            discountPercent = Math.round((1 - price / originalPrice) * 100);
          }

          await db.insert(products).values({
            id: newId,
            name,
            slug,
            sku,
            price: dbPrice,
            stock,
            sold_quantity: soldQuantity,
            source: 'meli',
            meli_id: meliId,
            meli_status: status,
            last_updated_meli: lastUpdated,
            external_link: externalLink,
            images,
            status: status === 'active' ? 'active' : 'draft', // Maps Meli active to CMS active
            is_featured: false,
            is_offer: isOffer,
            discount_price: discountPrice,
            discount_percent: discountPercent
          }).onConflictDoUpdate({
            target: products.meli_id,
            set: {
              name,
              sku,
              price: dbPrice,
              stock,
              sold_quantity: soldQuantity,
              meli_status: status,
              last_updated_meli: lastUpdated,
              external_link: externalLink,
              images,
              is_offer: isOffer,
              discount_price: discountPrice,
              discount_percent: discountPercent
            }
          });

          syncCount++;
        }
      }

      return {
        success: true,
        count: syncCount,
        scrollId: newScrollId,
        finished: itemIds.length < limit
      };
    } catch (error: any) {
      console.error('Error syncing:', error);
      return { success: false, error: error.message || 'Error al sincronizar con MercadoLibre' };
    }
  },
  zod$({
    scrollId: z.string().optional(),
    statusFilter: z.string().optional(),
    sort: z.string().optional()
  })
);

export default component$(() => {
  const data = useProducts();
  const prods = data.value.products;
  const sourceFilter = data.value.sourceFilter;
  const { page, totalPages, totalCount } = data.value;

  const deleteAction = useDeleteProduct();
  const toggleStatusAction = useToggleStatus();
  const toggleFeaturedAction = useToggleFeatured();
  const syncAction = useSyncMeliProducts();
  const discoveryAction = useSyncMeliDiscovery();
  const nav = useNavigate();

  const showSyncPanel = useSignal(false);
  const syncStatusFilter = useSignal('active');
  const syncSort = useSignal('sold_quantity_desc');
  const currentScrollId = useSignal<string | null>(null);
  const totalSyncedSession = useSignal(0);

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
          <button
            onClick$={() => showSyncPanel.value = !showSyncPanel.value}
            class={`px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${showSyncPanel.value ? 'bg-slate-200 text-slate-800' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
          >
            <LuRefreshCw class="h-4 w-4" />
            Sincronizar Meli
          </button>
          <Link
            href="/admin/productos/nuevo"
            class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <LuPlus class="h-4 w-4" /> Nuevo Producto
          </Link>
        </div>
      </div>

      {showSyncPanel.value && (
        <div class="mb-6 bg-white border border-yellow-200 shadow-sm rounded-xl p-5">
          <h2 class="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Sincronización Avanzada con MercadoLibre</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
              <h3 class="font-medium text-slate-700 mb-2">Paso 1: Discovery</h3>
              <p class="text-xs text-slate-500 mb-3">Consulta cuántos productos tienes en MercadoLibre.</p>
              <Form action={discoveryAction} spaReset={false}>
                <button
                  type="submit"
                  disabled={discoveryAction.isRunning}
                  class="bg-white border border-slate-300 shadow-sm hover:bg-slate-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  {discoveryAction.isRunning ? 'Consultando...' : 'Consultar Catálogo'}
                </button>
              </Form>
              {discoveryAction.value?.success && (
                <div class="mt-3 text-sm">
                  <span class="text-green-600 font-bold">{discoveryAction.value.active} Activos</span> | <span class="text-orange-500 font-bold">{discoveryAction.value.paused} Pausados</span>
                  <div class="text-xs text-slate-500 mt-1">Total: {discoveryAction.value.total}</div>
                </div>
              )}
            </div>

            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 class="font-medium text-slate-700 mb-2 text-center">Paso 2: Configuración</h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">Estado de Meli</label>
                  <select
                    class="w-full text-sm border-slate-300 rounded p-1.5 outline-none focus:border-cyan-500"
                    value={syncStatusFilter.value}
                    onChange$={(e, el) => { syncStatusFilter.value = el.value; currentScrollId.value = null; }}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Solo Activos</option>
                    <option value="paused">Solo Pausados</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">Ordenar por</label>
                  <select
                    class="w-full text-sm border-slate-300 rounded p-1.5 outline-none focus:border-cyan-500"
                    value={syncSort.value}
                    onChange$={(e, el) => { syncSort.value = el.value; currentScrollId.value = null; }}
                  >
                    <option value="sold_quantity_desc">Más Vendidos Primero</option>
                    <option value="price_asc">Menor Precio</option>
                    <option value="price_desc">Mayor Precio</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <h3 class="font-medium text-yellow-900 mb-2">Paso 3: Sincronización</h3>
              <p class="text-xs text-yellow-700 mb-3">Descarga los productos en lotes de 50 para no sobrecargar el sistema.</p>

              <Form action={syncAction} spaReset={false} onSubmitCompleted$={() => {
                if (syncAction.value?.success) {
                  if (syncAction.value.scrollId) {
                    currentScrollId.value = syncAction.value.scrollId;
                  }
                  totalSyncedSession.value += syncAction.value.count || 0;
                }
              }}>
                <input type="hidden" name="statusFilter" value={syncStatusFilter.value} />
                <input type="hidden" name="sort" value={syncSort.value} />
                {currentScrollId.value && <input type="hidden" name="scrollId" value={currentScrollId.value} />}

                <button
                  type="submit"
                  disabled={syncAction.isRunning || syncAction.value?.finished}
                  class="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm px-4 py-2 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncAction.isRunning ? 'Sincronizando...' : syncAction.value?.finished ? 'Sincronización Terminada' : 'Sincronizar Lote (50)'}
                </button>
              </Form>
              {totalSyncedSession.value > 0 && (
                <div class="text-xs text-green-700 mt-3 font-bold bg-green-100 px-3 py-1.5 rounded-full inline-block border border-green-200 shadow-sm">
                  ✓ {totalSyncedSession.value} productos importados/actualizados hoy.
                </div>
              )}
            </div>
          </div>

          <div class="bg-slate-50 border-l-4 border-slate-400 p-3 text-xs text-slate-600">
            <strong>Nota de Rendimiento:</strong> Las descripciones (texto largo) <u>no se sincronizan masivamente</u> para proteger la velocidad del sistema. Podes importar la descripción de cada producto individualmente desde su pantalla de edición cuando lo necesites.
          </div>
        </div>
      )}

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
                <th class="px-6 py-3 font-medium">SKU</th>
                <th class="px-6 py-3 font-medium">Categoría</th>
                <th class="px-6 py-3 font-medium">Precio</th>
                <th class="px-6 py-3 font-medium">Stock/Ventas</th>
                <th class="px-6 py-3 font-medium">Fuente</th>
                <th class="px-6 py-3 font-medium">Estado Meli</th>
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
                  let moreImages = 0;
                  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    imageUrl = product.images[0];
                    if (product.images.length > 1) {
                      moreImages = product.images.length - 1;
                    }
                  }

                  return (
                    <tr key={product.id} class="hover:bg-slate-50/50">
                      <td class="px-6 py-3">
                        <div class="flex items-center gap-3">
                          <div class="relative w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {imageUrl ? (
                              <>
                                <img src={imageUrl} alt={product.name} class="w-full h-full object-cover" />
                                {moreImages > 0 && (
                                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span class="text-white text-[10px] font-bold">+{moreImages}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <LuImage class="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div class="font-medium text-slate-900 text-xs line-clamp-2 max-w-[250px] whitespace-normal leading-tight" title={product.name}>
                            {product.name}
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-3 text-slate-600 font-mono text-xs">
                        {product.sku || '-'}
                      </td>
                      <td class="px-6 py-3 text-slate-600">
                        {product.categoryName || '-'}
                      </td>
                      <td class="px-6 py-3 font-medium text-slate-900">
                        ${product.price}
                      </td>
                      <td class="px-6 py-3 text-slate-600">
                        <div>{product.stock} disp.</div>
                        {product.sold_quantity != null && product.sold_quantity > 0 && <div class="text-[10px] text-emerald-600 font-medium">{product.sold_quantity} vendidos</div>}
                      </td>
                      <td class="px-6 py-3">
                        <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.source === 'meli' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {product.source === 'meli' ? <LuTag class="w-3 h-3 mr-1" /> : <LuShoppingCart class="w-3 h-3 mr-1" />}
                          {product.source.toUpperCase()}
                        </span>
                      </td>
                      <td class="px-6 py-3 text-xs">
                        {product.source === 'meli' && product.meli_status ? (
                          <span class={`inline-flex items-center px-2 py-0.5 rounded-full font-medium border ${product.meli_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {product.meli_status}
                          </span>
                        ) : '-'}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div class="text-sm text-slate-500">
            Mostrando página <span class="font-medium text-slate-900">{page}</span> de <span class="font-medium text-slate-900">{totalPages}</span> ({totalCount} productos)
          </div>
          <div class="flex items-center gap-2">
            <Link 
              href={`/admin/productos?page=${page > 1 ? page - 1 : 1}${sourceFilter !== 'all' ? `&source=${sourceFilter}` : ''}`}
              class={`px-3 py-1.5 rounded text-sm font-medium border ${page <= 1 ? 'border-slate-100 text-slate-300 pointer-events-none' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              Anterior
            </Link>
            
            <div class="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show windows of pages around current page
                let p = page - 2 + i;
                if (page < 3) p = i + 1;
                else if (page > totalPages - 2) p = totalPages - 4 + i;
                
                if (p > 0 && p <= totalPages) {
                  return (
                    <Link
                      key={p}
                      href={`/admin/productos?page=${p}${sourceFilter !== 'all' ? `&source=${sourceFilter}` : ''}`}
                      class={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${page === p ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {p}
                    </Link>
                  );
                }
                return null;
              })}
            </div>

            <Link 
              href={`/admin/productos?page=${page < totalPages ? page + 1 : totalPages}${sourceFilter !== 'all' ? `&source=${sourceFilter}` : ''}`}
              class={`px-3 py-1.5 rounded text-sm font-medium border ${page >= totalPages ? 'border-slate-100 text-slate-300 pointer-events-none' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              Siguiente
            </Link>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Productos',
};
