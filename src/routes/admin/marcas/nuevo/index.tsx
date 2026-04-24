import { component$, useSignal, $ } from '@builder.io/qwik';
import { type DocumentHead, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { brands } from '~/db/schema';
import { LuArrowLeft, LuSave, LuImage, LuX } from '@qwikest/icons/lucide';
import { put } from '@vercel/blob';

export const useAddBrand = routeAction$(async (data, { env, redirect }) => {
  const name = data.name as string;
  const category = data.category as string;
  const file = data.image as File;

  if (!name || !category) {
    return { success: false, error: 'El nombre y la categoría son obligatorios.' };
  }

  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Debe seleccionar una imagen para la marca.' };
  }

  try {
    const token = env.get('BLOB_READ_WRITE_TOKEN');
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN is missing from env');
      return { success: false, error: 'Error de configuración del servidor (Vercel Blob token).' };
    }

    // Subir a Vercel Blob
    const blob = await put(`marcas/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token,
    });

    // Guardar en base de datos
    const db = getDb(env);
    const id = 'brand-' + Math.random().toString(36).substring(2, 9);

    await db.insert(brands).values({
      id,
      name,
      category,
      imageUrl: blob.url,
    });

  } catch (error) {
    console.error('Error adding brand:', error);
    return { success: false, error: 'Hubo un error al crear la marca y subir la imagen.' };
  }

  throw redirect(302, '/admin/marcas/');
});

export default component$(() => {
  const addAction = useAddBrand();
  const imagePreview = useSignal<string | null>(null);
  const fileInputRef = useSignal<HTMLInputElement>();

  const handleImageChange = $((event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      imagePreview.value = URL.createObjectURL(file);
    } else {
      imagePreview.value = null;
    }
  });

  return (
    <div class="max-w-3xl mx-auto">
      <div class="mb-6 flex items-center gap-4">
        <Link href="/admin/marcas/" class="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
          <LuArrowLeft class="w-5 h-5" />
        </Link>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Nueva Marca</h1>
          <p class="text-slate-500">Sube el logo de la marca y clasifícala.</p>
        </div>
      </div>

      {addAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {addAction.value.error}
        </div>
      )}

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Form action={addAction} encType="multipart/form-data" class="p-6 space-y-6">

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="name" class="text-sm font-medium text-slate-700">Nombre de la Marca *</label>
              <input type="text" id="name" name="name" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none" placeholder="Ej: Tigre, IPS, Bosch" />
            </div>

            <div class="space-y-1.5">
              <label for="category" class="text-sm font-medium text-slate-700">Categoría *</label>
              <select id="category" name="category" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none bg-white">
                <option value="">Seleccionar categoría...</option>
                <option value="infraestructura">Línea Infraestructura</option>
                <option value="domiciliaria">Línea Domiciliaria</option>
                <option value="herramientas">Línea Herramientas</option>
              </select>
            </div>

            <div class="space-y-1.5 pt-2">
              <label for="image" class="text-sm font-medium text-slate-700">Logo de la Marca *</label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md bg-slate-50 relative overflow-hidden group">
                
                {imagePreview.value && (
                  <div class="absolute inset-0 bg-white flex items-center justify-center p-4 z-10">
                    <img src={imagePreview.value} alt="Preview" class="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      class="absolute top-2 right-2 bg-red-500 text-white rounded-md p-1.5 hover:bg-red-600 transition-colors shadow-sm"
                      onClick$={() => {
                        imagePreview.value = null;
                        if (fileInputRef.value) fileInputRef.value.value = '';
                      }}
                      title="Eliminar imagen"
                    >
                      <LuX class="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div class="space-y-1 text-center">
                  <LuImage class="mx-auto h-12 w-12 text-slate-400" />
                  <div class="flex text-sm text-slate-600 justify-center">
                    <label for="image" class="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
                      <span>Sube un archivo</span>
                      <input 
                        ref={fileInputRef}
                        id="image" 
                        name="image" 
                        type="file" 
                        accept="image/*" 
                        class="sr-only" 
                        required 
                        onChange$={handleImageChange}
                      />
                    </label>
                  </div>
                  <p class="text-xs text-slate-500">PNG, JPG, WEBP hasta 2MB</p>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Link href="/admin/marcas/" class="px-6 py-2.5 rounded-lg font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors">
              Cancelar
            </Link>
            <button
              type="submit"
              class="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={addAction.isRunning}
            >
              {addAction.isRunning ? 'Guardando...' : <><LuSave class="w-5 h-5" /> Guardar Marca</>}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Nueva Marca - Admin',
};
