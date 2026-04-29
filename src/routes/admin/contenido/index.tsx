import { component$, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { siteContent } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { LuSave, LuCheckCircle2, LuImage, LuTrash2 } from '@qwikest/icons/lucide';

export const useSiteContent = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  const data = await db.select().from(siteContent);
  const contentMap: Record<string, string> = {};
  for (const item of data) {
    contentMap[item.key] = item.value;
  }
  return contentMap;
});

export const useSaveContent = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      const updateOrInsert = async (key: string, value: string) => {
        const existing = await db.select().from(siteContent).where(eq(siteContent.key, key));
        if (existing.length > 0) {
          await db.update(siteContent).set({ value }).where(eq(siteContent.key, key));
        } else {
          await db.insert(siteContent).values({ key, value });
        }
      };
      await updateOrInsert('hero_title', data.hero_title);
      await updateOrInsert('hero_desc', data.hero_desc);
      // Save highlight phrases as JSON array
      const highlightPhrases: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const p = (data as any)[`home_highlight_phrase_${i}`]?.trim();
        if (p) highlightPhrases.push(p);
      }
      await updateOrInsert('home_highlight_phrases', JSON.stringify(highlightPhrases));

      // Save hero images as JSON array (filter out empty strings)
      const heroImages: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const url = (data as any)[`hero_image_${i}`]?.trim();
        if (url) heroImages.push(url);
      }
      await updateOrInsert('hero_images', JSON.stringify(heroImages));

      return { success: true };
    } catch (error) {
      console.error('Error saving content:', error);
      return { success: false, error: 'Hubo un error al guardar el contenido.' };
    }
  },
  zod$({
    hero_title: z.string().min(1, 'El título es obligatorio'),
    hero_desc: z.string().min(1, 'La descripción es obligatoria'),
    home_highlight_phrase_1: z.string().optional(),
    home_highlight_phrase_2: z.string().optional(),
    home_highlight_phrase_3: z.string().optional(),
    home_highlight_phrase_4: z.string().optional(),
    home_highlight_phrase_5: z.string().optional(),
    hero_image_1: z.string().optional(),
    hero_image_2: z.string().optional(),
    hero_image_3: z.string().optional(),
    hero_image_4: z.string().optional(),
    hero_image_5: z.string().optional(),
  })
);

export default component$(() => {
  const content = useSiteContent();
  const saveAction = useSaveContent();

  // Parse existing hero images
  let existingImages: string[] = [];
  try {
    existingImages = JSON.parse(content.value.hero_images || '[]');
  } catch { existingImages = []; }

  // Parse existing highlight phrases
  let existingPhrases: string[] = [];
  try {
    existingPhrases = JSON.parse(content.value.home_highlight_phrases || '[]');
    if (existingPhrases.length === 0 && content.value.home_highlight_phrase) {
      existingPhrases = [content.value.home_highlight_phrase];
    }
  } catch {
    if (content.value.home_highlight_phrase) {
      existingPhrases = [content.value.home_highlight_phrase];
    }
  }

  const previews = useSignal<string[]>(existingImages);

  return (
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Contenido Web</h1>
        <p class="text-slate-500">Modifica los textos e imágenes de la página web.</p>
      </div>

      {saveAction.value?.success && (
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700">
          <LuCheckCircle2 class="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium">Cambios guardados</h3>
            <p class="text-sm opacity-90">Los contenidos se han actualizado correctamente.</p>
          </div>
        </div>
      )}

      {saveAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {saveAction.value.error}
        </div>
      )}

      <Form action={saveAction} class="space-y-6">
        {/* ── Textos del Hero ── */}
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 class="font-semibold text-slate-800">Sección: Textos del Hero (Inicio)</h2>
            <p class="text-sm text-slate-500">Título y descripción que aparecen sobre el slider de imágenes.</p>
          </div>
          <div class="p-6 space-y-6">
            <div class="space-y-2">
              <label for="hero_title" class="text-sm font-medium text-slate-700">Título Principal</label>
              <input
                type="text" id="hero_title" name="hero_title"
                value={content.value.hero_title || ''}
                class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-orange-500 focus:ring-orange-500 outline-none transition-colors"
                placeholder="Ej: Especialistas en Agua, Gas y Cloacas"
              />
              {saveAction.value?.fieldErrors?.hero_title && (
                <p class="text-sm text-red-600">{saveAction.value.fieldErrors.hero_title[0]}</p>
              )}
            </div>

            <div class="space-y-2">
              <label for="hero_desc" class="text-sm font-medium text-slate-700">Descripción Breve</label>
              <textarea
                id="hero_desc" name="hero_desc" rows={3}
                class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-orange-500 outline-none transition-colors resize-none"
                placeholder="Descripción que aparece debajo del título..."
              >{content.value.hero_desc || ''}</textarea>
            </div>

            <div class="space-y-4">
              <label class="text-sm font-medium text-slate-700">Frases Destacadas (Carousel)</label>
              <p class="text-xs text-slate-500 mb-2">Estas frases aparecerán en un carrusel con fondo naranja antes del feed de Instagram.</p>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} class="space-y-1">
                  <div class="flex gap-2 items-center">
                    <span class="text-xs font-bold text-orange-500 w-4">{i}</span>
                    <input
                      type="text"
                      name={`home_highlight_phrase_${i}`}
                      value={existingPhrases[i - 1] || ''}
                      placeholder={`Frase ${i}...`}
                      class="flex-1 rounded-md border border-slate-300 px-4 py-2 focus:border-orange-500 outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Imágenes del Hero ── */}
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-2">
              <LuImage class="w-5 h-5 text-orange-500" />
              <h2 class="font-semibold text-slate-800">Imágenes del Hero</h2>
            </div>
            <p class="text-sm text-slate-500 mt-1">
              Hasta 5 imágenes para el slider de inicio. Pegá URLs de imágenes (JPG, PNG, WebP). Recomendado: 1920×600px o mayor.
            </p>
          </div>
          <div class="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => {
              const currentVal = existingImages[i - 1] || '';
              return (
                <div key={i} class="space-y-2">
                  <label class="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{i}</span>
                    Imagen {i} {i === 1 ? '(primera — más importante)' : i > (existingImages.length + 1) ? '(opcional)' : ''}
                  </label>
                  <div class="flex gap-3">
                    <input
                      type="url"
                      name={`hero_image_${i}`}
                      value={currentVal}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      class="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition-colors"
                      onInput$={(e, el) => {
                        const updated = [...previews.value];
                        updated[i - 1] = el.value;
                        previews.value = updated;
                      }}
                    />
                    {previews.value[i - 1] && (
                      <button
                        type="button"
                        class="text-slate-400 hover:text-red-500 transition-colors p-2"
                        onClick$={() => {
                          const updated = [...previews.value];
                          updated[i - 1] = '';
                          previews.value = updated;
                        }}
                        aria-label="Quitar imagen"
                      >
                        <LuTrash2 class="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {previews.value[i - 1] && (
                    <div class="mt-2 rounded-lg overflow-hidden border border-slate-200 aspect-[16/5] bg-slate-100">
                      <img
                        src={previews.value[i - 1]}
                        alt={`Preview imagen ${i}`}
                        class="w-full h-full object-cover"
                        onError$={(_, el) => { el.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div class="flex justify-end">
          <button
            type="submit"
            class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            disabled={saveAction.isRunning}
          >
            {saveAction.isRunning ? (
              <span>Guardando...</span>
            ) : (
              <>
                <LuSave class="h-5 w-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Contenido Web',
};
