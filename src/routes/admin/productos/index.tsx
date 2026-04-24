import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LuPlus, LuTrash2, LuImage, LuTag, LuShoppingCart, LuClipboardEdit } from '@qwikest/icons/lucide';

export const useProducts = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  const data = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      source: products.source,
      status: products.status,
      categoryName: categories.name,
      images: products.images,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .orderBy(desc(products.id)); // Using id as a sort for newest roughly
  return data;
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

export default component$(() => {
  const prods = useProducts();
  const deleteAction = useDeleteProduct();

  return (
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Productos</h1>
          <p class="text-slate-500">Gestiona el catálogo de artículos disponibles.</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          <LuPlus class="h-4 w-4" /> Nuevo Producto
        </Link>
      </div>

      {deleteAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {deleteAction.value.error}
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
                <th class="px-6 py-3 font-medium">Fuente / Estado</th>
                <th class="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {prods.value.length === 0 ? (
                <tr>
                  <td colSpan={6} class="px-6 py-12 text-center text-slate-500">
                    No hay productos en el catálogo.
                  </td>
                </tr>
              ) : (
                prods.value.map((product) => {
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
                          <div class="font-medium text-slate-900 truncate max-w-[200px]" title={product.name}>
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
                        <div class="flex items-center gap-2">
                          <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.source === 'meli' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                            {product.source === 'meli' ? <LuTag class="w-3 h-3 mr-1" /> : <LuShoppingCart class="w-3 h-3 mr-1" />}
                            {product.source.toUpperCase()}
                          </span>
                          <span class={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                            {product.status === 'active' ? 'Activo' : 'Borrador'}
                          </span>
                        </div>
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
