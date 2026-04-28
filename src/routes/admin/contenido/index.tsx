import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { siteContent } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { LuSave, LuCheckCircle2 } from '@qwikest/icons/lucide';

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
      await updateOrInsert('home_highlight_phrase', data.home_highlight_phrase);

      return { success: true };
    } catch (error) {
      console.error('Error saving content:', error);
      return { success: false, error: 'Hubo un error al guardar el contenido.' };
    }
  },
  zod$({
    hero_title: z.string().min(1, 'El título es obligatorio'),
    hero_desc: z.string().min(1, 'La descripción es obligatoria'),
    home_highlight_phrase: z.string().min(1, 'La frase destacada es obligatoria'),
  })
);

export default component$(() => {
  const content = useSiteContent();
  const saveAction = useSaveContent();

  return (
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Contenido Web</h1>
        <p class="text-slate-500">Modifica los textos principales de la página web.</p>
      </div>

      {saveAction.value?.success && (
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700">
          <LuCheckCircle2 class="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium">Cambios guardados</h3>
            <p class="text-sm opacity-90">Los textos se han actualizado correctamente en la web.</p>
          </div>
        </div>
      )}

      {saveAction.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {saveAction.value.error}
        </div>
      )}

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 class="font-semibold text-slate-800">Sección: Hero (Inicio)</h2>
          <p class="text-sm text-slate-500">Estos textos aparecen en la portada de la página de inicio.</p>
        </div>
        
        <Form action={saveAction} class="p-6 space-y-6">
          <div class="space-y-2">
            <label for="hero_title" class="text-sm font-medium text-slate-700">
              Título Principal
            </label>
            <input
              type="text"
              id="hero_title"
              name="hero_title"
              value={content.value.hero_title || ''}
              class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-cyan-500 focus:ring-cyan-500 outline-none transition-colors"
              placeholder="Ej: Especialistas en Agua, Gas y Cloacas"
            />
            {saveAction.value?.fieldErrors?.hero_title && (
              <p class="text-sm text-red-600">{saveAction.value.fieldErrors.hero_title[0]}</p>
            )}
          </div>

          <div class="space-y-2">
            <label for="hero_desc" class="text-sm font-medium text-slate-700">
              Descripción Breve
            </label>
            <textarea
              id="hero_desc"
              name="hero_desc"
              rows={3}
              class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-cyan-500 focus:ring-cyan-500 outline-none transition-colors resize-none"
              placeholder="Descripción que aparece debajo del título..."
            >{content.value.hero_desc || ''}</textarea>
            {saveAction.value?.fieldErrors?.hero_desc && (
              <p class="text-sm text-red-600">{saveAction.value.fieldErrors.hero_desc[0]}</p>
            )}
          </div>

          <div class="space-y-2">
            <label for="home_highlight_phrase" class="text-sm font-medium text-slate-700">
              Frase Destacada (Sobre Instagram)
            </label>
            <textarea
              id="home_highlight_phrase"
              name="home_highlight_phrase"
              rows={3}
              class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-cyan-500 focus:ring-cyan-500 outline-none transition-colors resize-none"
              placeholder="Ej: Somos los principales referentes en el rubro..."
            >{content.value.home_highlight_phrase || ''}</textarea>
            {saveAction.value?.fieldErrors?.home_highlight_phrase && (
              <p class="text-sm text-red-600">{saveAction.value.fieldErrors.home_highlight_phrase[0]}</p>
            )}
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              class="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
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
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Contenido Web',
};
