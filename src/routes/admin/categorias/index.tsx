import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { categories } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { LuPlus, LuTrash2, LuImage, LuClipboardEdit } from '@qwikest/icons/lucide';

export const useCategories = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  const data = await db.select().from(categories);
  return data;
});

export const useAddCategory = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      const newSlug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const id = 'cat-' + newSlug + '-' + Math.random().toString(36).substring(2, 6);

      await db.insert(categories).values({
        id,
        name: data.name,
        slug: newSlug,
        description: data.description,
        image: data.image || null,
        parent_id: data.parentId || null,
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding category:', error);
      return { success: false, error: 'Hubo un error al agregar la categoría.' };
    }
  },
  zod$({
    name: z.string().min(1, 'El nombre es obligatorio'),
    description: z.string().optional(),
    image: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    parentId: z.string().optional().or(z.literal('')),
  })
);

export const useDeleteCategory = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      await db.delete(categories).where(eq(categories.id, data.id as string));
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: 'No se puede eliminar la categoría. Asegúrese de que no tenga productos asociados.' };
    }
  },
  zod$({
    id: z.string(),
  })
);

export default component$(() => {
  const cats = useCategories();
  const addAction = useAddCategory();
  const deleteAction = useDeleteCategory();

  return (
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Categorías</h1>
          <p class="text-slate-500">Gestiona los rubros y familias de productos.</p>
        </div>
      </div>

      {(addAction.value?.error || deleteAction.value?.error) && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {addAction.value?.error || deleteAction.value?.error}
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form to add */}
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div class="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 class="font-semibold text-slate-800">Nueva Categoría</h2>
            </div>
            <Form action={addAction} class="p-4 space-y-4">
              <div class="space-y-1.5">
                <label for="name" class="text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none"
                  placeholder="Ej: Cañerías"
                />
              </div>
              <div class="space-y-1.5">
                <label for="description" class="text-sm font-medium text-slate-700">Descripción (Opcional)</label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none resize-none"
                  placeholder="Breve descripción..."
                ></textarea>
              </div>
              <div class="space-y-1.5">
                <label for="parentId" class="text-sm font-medium text-slate-700">Categoría Padre (Opcional)</label>
                <select
                  id="parentId"
                  name="parentId"
                  class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none bg-white"
                >
                  <option value="">Ninguna (Categoría Principal)</option>
                  {cats.value.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div class="space-y-1.5">
                <label for="image" class="text-sm font-medium text-slate-700">URL de Imagen (Opcional)</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              <button
                type="submit"
                class="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                disabled={addAction.isRunning}
              >
                {addAction.isRunning ? 'Agregando...' : <><LuPlus class="h-4 w-4" /> Agregar Categoría</>}
              </button>
            </Form>
          </div>
        </div>

        {/* Right Column: List */}
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th class="px-6 py-3 font-medium">Imagen</th>
                    <th class="px-6 py-3 font-medium">Categoría</th>
                    <th class="px-6 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {cats.value.length === 0 ? (
                    <tr>
                      <td colSpan={3} class="px-6 py-8 text-center text-slate-500">
                        No hay categorías creadas aún.
                      </td>
                    </tr>
                  ) : (
                    cats.value
                      .sort((a, b) => {
                        // Put root categories first, then sort by name
                        if (!a.parent_id && b.parent_id) return -1;
                        if (a.parent_id && !b.parent_id) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((cat) => {
                        const parent = cat.parent_id ? cats.value.find(c => c.id === cat.parent_id) : null;
                        return (
                          <tr key={cat.id} class="hover:bg-slate-50/50">
                            <td class="px-6 py-3">
                              <div class="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {cat.image ? (
                                  <img src={cat.image} alt={cat.name} class="w-full h-full object-cover" />
                                ) : (
                                  <LuImage class="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                            </td>
                            <td class="px-6 py-3">
                              <div class="flex items-center gap-2">
                                {parent && (
                                  <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{parent.name}</span>
                                )}
                                <p class="font-medium text-slate-900">{cat.name}</p>
                              </div>
                              <p class="text-xs text-slate-500">/{cat.slug}</p>
                            </td>
                            <td class="px-6 py-3 text-right">
                              <div class="flex items-center justify-end gap-2">
                                <a
                                  href={`/admin/categorias/${cat.id}/`}
                                  class="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-md transition-colors inline-block"
                                  title="Editar"
                                >
                                  <LuClipboardEdit class="h-4 w-4" />
                                </a>
                                <Form action={deleteAction} class="inline-block" onSubmit$={(e) => { if (!window.confirm('¿Seguro que deseas eliminar esta categoría? Esto podría fallar si tiene productos o subcategorías asociados.')) e.preventDefault(); }}>
                                  <input type="hidden" name="id" value={cat.id} />
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
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Categorías',
};
