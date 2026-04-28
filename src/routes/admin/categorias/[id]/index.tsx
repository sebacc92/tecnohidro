import { component$, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$, Link } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { categories } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { LuArrowLeft, LuSave } from '@qwikest/icons/lucide';

export const useCategoryAndAll = routeLoader$(async (requestEvent) => {
  const db = getDb(requestEvent.env);
  const { id } = requestEvent.params;
  
  const allCats = await db.select().from(categories);
  const cat = allCats.find(c => c.id === id);
  
  if (!cat) {
    throw requestEvent.redirect(302, '/admin/categorias');
  }
  return { cat, allCats };
});

export const useEditCategory = routeAction$(
  async (data, { env, redirect }) => {
    try {
      const db = getDb(env);
      const newSlug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      await db.update(categories)
        .set({
          name: data.name,
          slug: newSlug,
          parent_id: data.parentId || null,
          show_in_menu: data.showInMenu === 'on',
        })
        .where(eq(categories.id, data.id));

    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, error: 'Hubo un error al actualizar la categoría.' };
    }
    
    throw redirect(302, '/admin/categorias/');
  },
  zod$({
    id: z.string(),
    name: z.string().min(1, 'El nombre es obligatorio'),
    parentId: z.string().optional().or(z.literal('')),
    showInMenu: z.string().optional(),
  })
);

export default component$(() => {
  const data = useCategoryAndAll();
  const cat = data.value.cat;
  const cats = data.value.allCats;
  const editAction = useEditCategory();
  
  const isShowInMenu = useSignal(cat.show_in_menu ?? true);

  return (
    <div class="max-w-2xl mx-auto">
      <div class="mb-6 flex items-center gap-4">
        <Link href="/admin/categorias" class="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
          <LuArrowLeft class="w-5 h-5" />
        </Link>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Editar Categoría</h1>
          <p class="text-slate-500">Modifica los datos del rubro.</p>
        </div>
      </div>

      {editAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {editAction.value.error}
        </div>
      )}

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Form action={editAction} class="p-6 space-y-5">
          <input type="hidden" name="id" value={cat.id} />
          
          <div class="space-y-1.5">
            <label for="name" class="text-sm font-medium text-slate-700">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={cat.name}
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              placeholder="Ej: Cañerías"
            />
          </div>
          
          <div class="space-y-1.5">
            <label for="parentId" class="text-sm font-medium text-slate-700">Categoría Padre</label>
            <select
              id="parentId"
              name="parentId"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none bg-white"
            >
              <option value="" selected={!cat.parent_id}>Ninguna (Categoría Principal)</option>
              {cats.filter((c: any) => c.id !== cat.id).map((c: any) => (
                <option key={c.id} value={c.id} selected={cat.parent_id === c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 mt-2">
            <div>
              <p class="text-sm font-medium text-slate-900">Mostrar en el Menú</p>
              <p class="text-xs text-slate-500">Visible en la barra de navegación del sitio público.</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="showInMenu" 
                class="sr-only peer" 
                checked={isShowInMenu.value}
                onChange$={(e) => isShowInMenu.value = (e.target as HTMLInputElement).checked}
              />
              <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
            <Link href="/admin/categorias" class="px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors">
              Cancelar
            </Link>
            <button
              type="submit"
              class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={editAction.isRunning}
            >
              {editAction.isRunning ? 'Guardando...' : <><LuSave class="h-4 w-4" /> Guardar Cambios</>}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Editar Categoría - Admin',
};
