import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$, Link } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { LuArrowLeft, LuSave } from '@qwikest/icons/lucide';

export const useCategoriesForSelect = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  return await db.select({ id: categories.id, name: categories.name }).from(categories);
});

export const useAddProduct = routeAction$(
  async (data, { env, redirect }) => {
    try {
      const db = getDb(env);
      const newSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const id = 'prod-' + newSlug + '-' + Math.random().toString(36).substring(2, 6);
      
      const imagesArray = data.imageUrl ? [data.imageUrl] : [];

      await db.insert(products).values({
        id,
        name: data.name,
        slug: newSlug,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category_id: data.categoryId,
        source: 'cms', // Created manually
        status: data.status,
        images: imagesArray,
      });

    } catch (error) {
      console.error('Error adding product:', error);
      return { success: false, error: 'Hubo un error al crear el producto.' };
    }
    
    // Redirect after successful creation
    throw redirect(302, '/admin/productos/');
  },
  zod$({
    name: z.string().min(1, 'El nombre es obligatorio'),
    description: z.string().min(1, 'La descripción es obligatoria'),
    price: z.coerce.number().min(0, 'El precio debe ser 0 o mayor'),
    stock: z.coerce.number().int().min(0, 'El stock debe ser 0 o mayor'),
    categoryId: z.string().min(1, 'Debe seleccionar una categoría'),
    status: z.enum(['active', 'draft']),
    imageUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  })
);

export default component$(() => {
  const cats = useCategoriesForSelect();
  const addAction = useAddProduct();

  return (
    <div class="max-w-4xl mx-auto">
      <div class="mb-6 flex items-center gap-4">
        <Link href="/admin/productos" class="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
          <LuArrowLeft class="w-5 h-5" />
        </Link>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Nuevo Producto</h1>
          <p class="text-slate-500">Agrega un nuevo artículo al catálogo.</p>
        </div>
      </div>

      {addAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {addAction.value.error}
        </div>
      )}

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Form action={addAction} class="p-6 space-y-8">
          
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Información Básica</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <label for="name" class="text-sm font-medium text-slate-700">Nombre del Producto *</label>
                <input type="text" id="name" name="name" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none" placeholder="Ej: Caño PVC 110mm" />
                {addAction.value?.fieldErrors?.name && <p class="text-xs text-red-600">{addAction.value.fieldErrors.name[0]}</p>}
              </div>

              <div class="space-y-1.5">
                <label for="categoryId" class="text-sm font-medium text-slate-700">Categoría *</label>
                <select id="categoryId" name="categoryId" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none bg-white">
                  <option value="">Seleccionar categoría...</option>
                  {cats.value.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {addAction.value?.fieldErrors?.categoryId && <p class="text-xs text-red-600">{addAction.value.fieldErrors.categoryId[0]}</p>}
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="description" class="text-sm font-medium text-slate-700">Descripción *</label>
              <textarea id="description" name="description" required rows={4} class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none resize-none" placeholder="Descripción detallada del producto..."></textarea>
              {addAction.value?.fieldErrors?.description && <p class="text-xs text-red-600">{addAction.value.fieldErrors.description[0]}</p>}
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Precios e Inventario</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-1.5">
                <label for="price" class="text-sm font-medium text-slate-700">Precio ($) *</label>
                <input type="number" id="price" name="price" required min="0" step="0.01" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none" placeholder="0.00" />
                {addAction.value?.fieldErrors?.price && <p class="text-xs text-red-600">{addAction.value.fieldErrors.price[0]}</p>}
              </div>

              <div class="space-y-1.5">
                <label for="stock" class="text-sm font-medium text-slate-700">Stock Disponible *</label>
                <input type="number" id="stock" name="stock" required min="0" step="1" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none" placeholder="0" />
                {addAction.value?.fieldErrors?.stock && <p class="text-xs text-red-600">{addAction.value.fieldErrors.stock[0]}</p>}
              </div>

              <div class="space-y-1.5">
                <label for="status" class="text-sm font-medium text-slate-700">Estado *</label>
                <select id="status" name="status" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none bg-white">
                  <option value="active">Activo (Visible)</option>
                  <option value="draft">Borrador (Oculto)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Multimedia</h2>
            
            <div class="space-y-1.5">
              <label for="imageUrl" class="text-sm font-medium text-slate-700">URL de Imagen Principal</label>
              <input type="url" id="imageUrl" name="imageUrl" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none" placeholder="https://ejemplo.com/imagen.jpg" />
              {addAction.value?.fieldErrors?.imageUrl && <p class="text-xs text-red-600">{addAction.value.fieldErrors.imageUrl[0]}</p>}
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Link href="/admin/productos" class="px-6 py-2.5 rounded-lg font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors">
              Cancelar
            </Link>
            <button
              type="submit"
              class="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={addAction.isRunning}
            >
              {addAction.isRunning ? 'Guardando...' : <><LuSave class="w-5 h-5" /> Crear Producto</>}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Nuevo Producto - Admin',
};
