import { component$, useSignal, $ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$, Link } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { LuArrowLeft, LuSave } from '@qwikest/icons/lucide';
import { upload } from '@vercel/blob/client';
import imageCompression from 'browser-image-compression';


export const useProduct = routeLoader$(async (requestEvent) => {
  const db = getDb(requestEvent.env);
  const { id } = requestEvent.params;
  
  const data = await db.select().from(products).where(eq(products.id, id));
  if (data.length === 0) {
    throw requestEvent.redirect(302, '/admin/productos');
  }
  const allCats = await db.select().from(categories);
  
  const formattedCats = allCats.sort((a, b) => {
    if (!a.parent_id && b.parent_id) return -1;
    if (a.parent_id && !b.parent_id) return 1;
    return a.name.localeCompare(b.name);
  }).map(cat => {
    const parent = cat.parent_id ? allCats.find(c => c.id === cat.parent_id) : null;
    return {
      id: cat.id,
      name: parent ? `${parent.name} > ${cat.name}` : cat.name
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  
  return {
    product: data[0],
    categories: formattedCats,
  };
});

export const useEditProduct = routeAction$(
  async (data, { env, redirect }) => {
    try {
      const db = getDb(env);
      const newSlug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const imagesArray: string[] = data.imageUrlsJson ? JSON.parse(data.imageUrlsJson) : [];

      await db.update(products)
        .set({
          name: data.name,
          slug: newSlug,
          description: data.description,
          price: data.price,
          stock: data.stock,
          category_id: data.categoryId,
          status: data.status === 'active' ? 'active' : 'draft',
          is_featured: data.is_featured === 'true',
          is_offer: data.is_offer === 'true',
          offer_expires_at: data.offer_expires_at ? new Date(data.offer_expires_at) : null,
          images: imagesArray,
        })
        .where(eq(products.id, data.id));

    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error: 'Hubo un error al actualizar el producto.' };
    }
    
    throw redirect(302, '/admin/productos/');
  },
  zod$({
    id: z.string(),
    name: z.string().min(1, 'El nombre es obligatorio'),
    description: z.string().optional(),
    price: z.coerce.number().min(0, 'El precio debe ser 0 o mayor'),
    stock: z.coerce.number().int().min(0, 'El stock debe ser 0 o mayor'),
    categoryId: z.string().min(1, 'Debe seleccionar una categoría'),
    status: z.string().optional(),
    is_featured: z.string().optional(),
    is_offer: z.string().optional(),
    offer_expires_at: z.string().optional(),
    imageUrlsJson: z.string().optional(),
  })
);

export default component$(() => {
  const data = useProduct();
  const editAction = useEditProduct();
  
  const product = data.value.product;
  const cats = data.value.categories;

  const initialImages: string[] = Array.isArray(product.images) ? product.images as string[] : [];
  
  const currentImageUrls = useSignal<string[]>(initialImages);
  const isCompressing = useSignal(false);
  const previewUrls = useSignal<string[]>([]);
  const hasNewImages = useSignal(false);
  const isOffer = useSignal(product.is_offer === true);

  let initialExpiresAt = '';
  if (product.offer_expires_at) {
    const d = new Date(product.offer_expires_at);
    if (!isNaN(d.getTime())) {
      initialExpiresAt = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }
  }

  const handleFileChange = $(async (event: Event, element: HTMLInputElement) => {
    const files = element.files;
    if (!files || files.length === 0) return;

    isCompressing.value = true;
    hasNewImages.value = true;
    previewUrls.value = [];

    const hiddenInput = element.closest('form')?.querySelector<HTMLInputElement>('input[name="imageUrlsJson"]');

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const tempUrl = URL.createObjectURL(file);
        previewUrls.value = [...previewUrls.value, tempUrl];

        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp' as const,
          initialQuality: 0.8,
        };
        const compressedBlob = await imageCompression(file, options);
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const newFileName = `${file.name.replace(/\.[^/.]+$/, '')}-${uniqueId}.webp`;
        const compressedFile = new File([compressedBlob], newFileName, { type: 'image/webp' });

        const blob = await upload(newFileName, compressedFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });

        newUrls.push(blob.url);

        previewUrls.value = previewUrls.value.map(u => u === tempUrl ? blob.url : u);
        URL.revokeObjectURL(tempUrl);
      }

      if (hiddenInput) {
        hiddenInput.value = JSON.stringify(newUrls);
      }
    } catch (error) {
      console.error('Error al comprimir/subir imagen:', error);
    } finally {
      isCompressing.value = false;
      element.value = '';
    }
  });

  const removeImage = $((indexToRemove: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta imagen?')) return;
    const updated = previewUrls.value.filter((_, i) => i !== indexToRemove);
    previewUrls.value = updated;
    const hiddenInput = document.querySelector<HTMLInputElement>('input[name="imageUrlsJson"]');
    if (hiddenInput) {
      hiddenInput.value = updated.length > 0 ? JSON.stringify(updated) : '';
    }
    if (updated.length === 0) {
      hasNewImages.value = false;
    }
  });

  const removeExistingImage = $((indexToRemove: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta imagen? Se guardará al presionar "Guardar Cambios".')) return;
    const updatedUrls = [...currentImageUrls.value];
    updatedUrls.splice(indexToRemove, 1);
    currentImageUrls.value = updatedUrls;

    const hiddenInput = document.querySelector<HTMLInputElement>('input[name="imageUrlsJson"]');
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(updatedUrls);
    }
  });

  const handleSubmit = $(async (e: Event, currentTarget: HTMLFormElement) => {
    if (isCompressing.value || editAction.isRunning) return;

    const formData = new FormData(currentTarget);
    formData.delete('images'); 

    await editAction.submit(formData);
  });

  return (
    <div class="max-w-4xl mx-auto">
      <div class="mb-6 flex items-center gap-4">
        <Link href="/admin/productos" class="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
          <LuArrowLeft class="w-5 h-5" />
        </Link>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Editar Producto</h1>
          <p class="text-slate-500">Modifica los detalles del artículo.</p>
        </div>
      </div>

      {editAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {editAction.value.error}
        </div>
      )}

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Form 
          action={editAction} 
          class="p-6 space-y-8"
          spaReset={false}
          preventdefault:submit
          onSubmit$={handleSubmit}
        >
          <input type="hidden" name="id" value={product.id} />
          
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Información Básica</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <label for="name" class="text-sm font-medium text-slate-700">Nombre del Producto *</label>
                <input type="text" id="name" name="name" required value={product.name} class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none" placeholder="Ej: Caño PVC 110mm" />
                {editAction.value?.fieldErrors?.name && <p class="text-xs text-red-600">{editAction.value.fieldErrors.name[0]}</p>}
              </div>

              <div class="space-y-1.5">
                <label for="categoryId" class="text-sm font-medium text-slate-700">Categoría *</label>
                <select id="categoryId" name="categoryId" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none bg-white">
                  <option value="">Seleccionar categoría...</option>
                  {cats.map(c => (
                    <option key={c.id} value={c.id} selected={c.id === product.category_id}>{c.name}</option>
                  ))}
                </select>
                {editAction.value?.fieldErrors?.categoryId && <p class="text-xs text-red-600">{editAction.value.fieldErrors.categoryId[0]}</p>}
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="description" class="text-sm font-medium text-slate-700">Descripción</label>
              <textarea id="description" name="description" rows={4} class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none resize-none" placeholder="Descripción detallada del producto...">{product.description || ''}</textarea>
              {editAction.value?.fieldErrors?.description && <p class="text-xs text-red-600">{editAction.value.fieldErrors.description[0]}</p>}
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Precios e Inventario</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-1.5">
                <label for="price" class="text-sm font-medium text-slate-700">Precio ($) *</label>
                <input type="number" id="price" name="price" required min="0" step="0.01" value={product.price || ''} class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none" placeholder="0.00" />
                {editAction.value?.fieldErrors?.price && <p class="text-xs text-red-600">{editAction.value.fieldErrors.price[0]}</p>}
              </div>

              <div class="space-y-1.5">
                <label for="stock" class="text-sm font-medium text-slate-700">Stock Disponible *</label>
                <input type="number" id="stock" name="stock" required min="0" step="1" value={product.stock ?? ''} class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 outline-none" placeholder="0" />
                {editAction.value?.fieldErrors?.stock && <p class="text-xs text-red-600">{editAction.value.fieldErrors.stock[0]}</p>}
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50">
                  <div class="flex flex-col">
                    <label for="status" class="text-sm font-medium text-slate-800">Producto Activo</label>
                    <span class="text-xs text-slate-500">Visible en el catálogo</span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="status" name="status" value="active" class="sr-only peer" checked={product.status === 'active'} />
                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                <div class="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50">
                  <div class="flex flex-col">
                    <label for="is_featured" class="text-sm font-medium text-slate-800">Producto Destacado</label>
                    <span class="text-xs text-slate-500">Aparecerá con una estrella</span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="is_featured" name="is_featured" value="true" class="sr-only peer" checked={product.is_featured === true} />
                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>

                <div class="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50">
                  <div class="flex flex-col">
                    <label for="is_offer" class="text-sm font-medium text-slate-800">Oferta de Tiempo Limitado</label>
                    <span class="text-xs text-slate-500">Se mostrará en el carrusel principal</span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="is_offer" name="is_offer" value="true" class="sr-only peer" checked={isOffer.value} onChange$={(e, el) => { isOffer.value = el.checked; }} />
                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
              </div>
            </div>
            
            {isOffer.value && (
              <div class="mt-4 p-4 border border-red-100 bg-red-50 rounded-lg">
                <label for="offer_expires_at" class="block text-sm font-medium text-red-800 mb-1">Fecha y Hora de Fin de Oferta *</label>
                <input 
                  type="datetime-local" 
                  id="offer_expires_at" 
                  name="offer_expires_at" 
                  required={isOffer.value}
                  value={initialExpiresAt}
                  class="w-full md:w-1/2 rounded-md border border-red-200 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500 outline-none" 
                />
                <p class="mt-1 text-xs text-red-600">Al pasar esta fecha, la oferta desaparecerá automáticamente del inicio.</p>
              </div>
            )}
          </div>

          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Multimedia</h2>
            
            <input type="hidden" name="imageUrlsJson" value={JSON.stringify(currentImageUrls.value)} />

            <div class="space-y-1.5">
              <label for="images" class="block text-sm font-medium text-slate-700">Imágenes del Producto</label>
              
              {hasNewImages.value && previewUrls.value.length > 0 ? (
                <div class="mt-2 mb-4">
                  <p class="text-xs text-orange-500 font-semibold mb-2">
                    {isCompressing.value ? '⏳ Subiendo nuevas imágenes...' : `✅ ${previewUrls.value.length} imagen(es) nueva(s) — reemplazarán las actuales al guardar:`}
                  </p>
                  <div class="flex flex-wrap gap-4">
                    {previewUrls.value.map((url, index) => (
                      <div key={index} class="relative group">
                        <img src={url} class="w-24 h-24 object-cover rounded-lg border-2 border-orange-400" />
                        {!isCompressing.value && (
                          <button
                            type="button"
                            onClick$={() => removeImage(index)}
                            class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                            title="Eliminar imagen"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentImageUrls.value.length > 0 ? (
                <div class="mt-2 mb-4">
                  <p class="text-xs text-slate-500 mb-2">Imágenes actuales ({currentImageUrls.value.length}):</p>
                  <div class="flex flex-wrap gap-4">
                    {currentImageUrls.value.map((url: string, index: number) => (
                      <div key={index} class="relative group">
                        <img src={url} class="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                        <button
                          type="button"
                          onClick$={() => removeExistingImage(index)}
                          class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          title="Eliminar imagen"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              
              <input 
                type="file" 
                id="images" 
                name="images" 
                accept="image/*" 
                multiple 
                class="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100" 
                disabled={isCompressing.value}
                onChange$={handleFileChange}
              />
              <p class="mt-1 text-xs text-slate-400">Si seleccionas nuevas imágenes, se subirán automáticamente y reemplazarán las actuales al guardar.</p>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Link href="/admin/productos" class="px-6 py-2.5 rounded-lg font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors">
              Cancelar
            </Link>
            <button
              type="submit"
              class="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCompressing.value || editAction.isRunning}
            >
              {isCompressing.value || editAction.isRunning ? (
                <>
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isCompressing.value ? 'Subiendo...' : 'Guardando...'}
                </>
              ) : (
                <><LuSave class="w-5 h-5" /> Guardar Cambios</>
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Editar Producto - Admin',
};
