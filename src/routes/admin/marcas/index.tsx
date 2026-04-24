import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$, Link } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { brands } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { LuPlus, LuTrash2, LuImage, LuClipboardEdit } from '@qwikest/icons/lucide';

export const useBrands = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  const data = await db.select().from(brands);
  return data;
});

export const useDeleteBrand = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      await db.delete(brands).where(eq(brands.id, data.id as string));
      return { success: true };
    } catch (error) {
      console.error('Error deleting brand:', error);
      return { success: false, error: 'No se puede eliminar la marca.' };
    }
  },
  zod$({
    id: z.string(),
  })
);

export default component$(() => {
  const allBrands = useBrands();
  const deleteAction = useDeleteBrand();

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'infraestructura': return 'Infraestructura';
      case 'domiciliaria': return 'Domiciliaria';
      case 'herramientas': return 'Herramientas';
      default: return cat;
    }
  };

  return (
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Marcas</h1>
          <p class="text-slate-500">Gestiona las marcas asociadas y sus logos.</p>
        </div>
        <Link
          href="/admin/marcas/nuevo/"
          class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <LuPlus class="w-5 h-5" />
          Nueva Marca
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
                <th class="px-6 py-3 font-medium">Logo</th>
                <th class="px-6 py-3 font-medium">Nombre</th>
                <th class="px-6 py-3 font-medium">Categoría</th>
                <th class="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {allBrands.value.length === 0 ? (
                <tr>
                  <td colSpan={4} class="px-6 py-12 text-center text-slate-500">
                    No hay marcas agregadas aún. <Link href="/admin/marcas/nuevo/" class="text-cyan-600 hover:underline">Agrega la primera.</Link>
                  </td>
                </tr>
              ) : (
                allBrands.value.map((brand) => (
                  <tr key={brand.id} class="hover:bg-slate-50/50">
                    <td class="px-6 py-3">
                      <div class="w-16 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {brand.imageUrl ? (
                          <img src={brand.imageUrl} alt={brand.name} class="w-full h-full object-contain p-1" />
                        ) : (
                          <LuImage class="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td class="px-6 py-3">
                      <p class="font-medium text-slate-900">{brand.name}</p>
                    </td>
                    <td class="px-6 py-3">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {getCategoryLabel(brand.category)}
                      </span>
                    </td>
                    <td class="px-6 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/marcas/${brand.id}/`}
                          class="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-md transition-colors"
                          title="Editar"
                        >
                          <LuClipboardEdit class="h-4 w-4" />
                        </Link>
                        <Form action={deleteAction} class="inline-block" onSubmit$={(e) => { if (!window.confirm('¿Seguro que deseas eliminar esta marca?')) e.preventDefault(); }}>
                          <input type="hidden" name="id" value={brand.id} />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Marcas',
};
