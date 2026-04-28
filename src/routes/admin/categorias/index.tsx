import { component$, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { categories } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { LuPlus, LuTrash2, LuClipboardEdit, LuChevronRight, LuChevronDown } from '@qwikest/icons/lucide';

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
        parent_id: data.parentId || null,
        show_in_menu: data.showInMenu === 'on',
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding category:', error);
      return { success: false, error: 'Hubo un error al agregar la categoría.' };
    }
  },
  zod$({
    name: z.string().min(1, 'El nombre es obligatorio'),
    parentId: z.string().optional().or(z.literal('')),
    showInMenu: z.string().optional(),
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

// Componente recursivo para renderizar el árbol de categorías
export const CategoryTreeItem = component$<{ cat: any; allCats: any[]; deleteAction: any; level?: number }>(({ cat, allCats, deleteAction, level = 0 }) => {
  const isExpanded = useSignal(level === 0);
  const children = allCats.filter(c => c.parent_id === cat.id).sort((a, b) => a.name.localeCompare(b.name));
  const hasChildren = children.length > 0;

  return (
    <div class="flex flex-col border-b border-slate-100 last:border-0">
      <div class={`flex items-center justify-between py-3 pr-4 group transition-colors hover:bg-slate-50`} style={{ paddingLeft: `${level * 2 + 1}rem` }}>
        <div class="flex items-center gap-2">
          {hasChildren ? (
            <button 
              onClick$={() => isExpanded.value = !isExpanded.value}
              class="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
            >
              {isExpanded.value ? <LuChevronDown class="w-4 h-4" /> : <LuChevronRight class="w-4 h-4" />}
            </button>
          ) : (
            <div class="w-6 h-6" /> // spacer
          )}
          
          <div class="flex items-center gap-3">
            <p class={`font-medium ${level === 0 ? 'text-slate-900' : 'text-slate-700'}`}>{cat.name}</p>
            {level === 0 && (
              <span class={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${cat.show_in_menu ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                {cat.show_in_menu ? 'En Menú' : 'Oculto'}
              </span>
            )}
            <span class="text-xs text-slate-400">/{cat.slug}</span>
          </div>
        </div>

        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={`/admin/categorias/${cat.id}/`}
            class="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-md transition-colors inline-block"
            title="Editar"
          >
            <LuClipboardEdit class="h-4 w-4" />
          </a>
          <Form action={deleteAction} class="inline-block" onSubmit$={(e) => { if (!window.confirm(`¿Seguro que deseas eliminar "${cat.name}"?`)) e.preventDefault(); }}>
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
      </div>
      
      {hasChildren && isExpanded.value && (
        <div class="flex flex-col border-l-2 border-slate-100 ml-5">
          {children.map(child => (
            <CategoryTreeItem key={child.id} cat={child} allCats={allCats} deleteAction={deleteAction} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
});

export default component$(() => {
  const cats = useCategories();
  const addAction = useAddCategory();
  const deleteAction = useDeleteCategory();

  // Switch de estado local para el form
  const isShowInMenu = useSignal(true);

  // Raíces
  const roots = cats.value.filter(c => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Categorías</h1>
          <p class="text-slate-500">Organiza el árbol de categorías en jerarquías.</p>
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
            <Form action={addAction} class="p-4 space-y-5">
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
                <label for="parentId" class="text-sm font-medium text-slate-700">Categoría Padre</label>
                <select
                  id="parentId"
                  name="parentId"
                  class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none bg-white"
                >
                  <option value="">Ninguna (Es Categoría Principal)</option>
                  {cats.value.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p class="text-xs text-slate-500">Dejar en "Ninguna" para crear un Nivel 1.</p>
              </div>

              {/* Switch Toggle */}
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p class="text-sm font-medium text-slate-900">Mostrar en el Menú</p>
                  <p class="text-xs text-slate-500">Visible en la barra pública.</p>
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
            <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 class="font-semibold text-slate-800">Estructura del Catálogo</h2>
            </div>
            
            <div class="flex flex-col">
              {roots.length === 0 ? (
                <div class="p-8 text-center text-slate-500">
                  No hay categorías creadas aún.
                </div>
              ) : (
                roots.map(root => (
                  <CategoryTreeItem key={root.id} cat={root} allCats={cats.value} deleteAction={deleteAction} />
                ))
              )}
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
