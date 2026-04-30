import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { siteContent } from '~/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { LuSave, LuCheckCircle2, LuBot } from '@qwikest/icons/lucide';

export const useAsistenteContent = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  const data = await db.select().from(siteContent).where(
    inArray(siteContent.key, ['ai_enabled', 'whatsapp_number', 'ai_knowledge', 'ai_call_to_action', 'ai_tone'])
  );
  
  const contentMap: Record<string, string> = {
    ai_enabled: 'true',
    whatsapp_number: '+5492214636161',
    ai_knowledge: 'Ofrecemos la mejor calidad en insumos de infraestructura y domiciliarios.',
    ai_call_to_action: 'Para cotizaciones exactas y compras mayoristas, por favor contactá a nuestro asesor vía WhatsApp:',
    ai_tone: 'Profesional, técnico, amigable y directo.'
  };

  for (const item of data) {
    contentMap[item.key] = item.value;
  }
  return contentMap;
});

export const useSaveAsistente = routeAction$(
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

      await updateOrInsert('ai_enabled', data.ai_enabled);
      await updateOrInsert('whatsapp_number', data.whatsapp_number);
      await updateOrInsert('ai_knowledge', data.ai_knowledge);
      await updateOrInsert('ai_call_to_action', data.ai_call_to_action);
      await updateOrInsert('ai_tone', data.ai_tone);

      return { success: true };
    } catch (error) {
      console.error('Error saving asistente config:', error);
      return { success: false, error: 'Hubo un error al guardar la configuración.' };
    }
  },
  zod$({
    ai_enabled: z.string(),
    whatsapp_number: z.string().min(1, 'El número es obligatorio'),
    ai_knowledge: z.string(),
    ai_call_to_action: z.string(),
    ai_tone: z.string(),
  })
);

export default component$(() => {
  const content = useAsistenteContent();
  const saveAction = useSaveAsistente();

  return (
    <div class="max-w-4xl mx-auto">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LuBot class="w-8 h-8 text-cyan-600" />
            Configuración del Asistente IA
          </h1>
          <p class="text-slate-500 mt-1">Entrena al chatbot y define su comportamiento.</p>
        </div>
      </div>

      {saveAction.value?.success && (
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700">
          <LuCheckCircle2 class="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium">Configuración guardada</h3>
            <p class="text-sm opacity-90">El chatbot ha sido actualizado con éxito.</p>
          </div>
        </div>
      )}

      <Form action={saveAction} class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estado */}
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700">Estado del Asistente</label>
              <select
                name="ai_enabled"
                class="w-full rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-cyan-500 outline-none"
              >
                <option value="true" selected={content.value.ai_enabled === 'true'}>Habilitado</option>
                <option value="false" selected={content.value.ai_enabled === 'false'}>Deshabilitado</option>
              </select>
              <p class="text-[10px] text-slate-500">Si lo deshabilitas, el bot no procesará mensajes.</p>
            </div>

            {/* WhatsApp */}
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700">Número de WhatsApp</label>
              <input
                type="text"
                name="whatsapp_number"
                value={content.value.whatsapp_number}
                class="w-full rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-cyan-500 outline-none"
              />
              <p class="text-[10px] text-slate-500">Número al que el bot derivará las ventas complejas.</p>
            </div>
          </div>

          <hr class="border-slate-100" />

          {/* Tono */}
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700">Tono de Respuesta</label>
            <input
              type="text"
              name="ai_tone"
              value={content.value.ai_tone}
              class="w-full rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-cyan-500 outline-none"
            />
            <p class="text-[10px] text-slate-500">Ejemplo: "Profesional, técnico, amigable y directo".</p>
          </div>

          {/* Call to action */}
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700">Llamado a la Acción (Ante precios/cotizaciones)</label>
            <textarea
              name="ai_call_to_action"
              rows={2}
              class="w-full rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-cyan-500 outline-none resize-none"
            >{content.value.ai_call_to_action}</textarea>
            <p class="text-[10px] text-slate-500">Frase que el bot usará antes de dar el número de WhatsApp.</p>
          </div>

          {/* Novedades / Conocimiento */}
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700">Conocimiento Adicional / Novedades</label>
            <textarea
              name="ai_knowledge"
              rows={4}
              class="w-full rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-cyan-500 outline-none resize-y"
              placeholder="Ingresa novedades, productos nuevos, ofertas temporales, etc."
            >{content.value.ai_knowledge}</textarea>
            <p class="text-[10px] text-slate-500">Esta información se inyecta en el "cerebro" del bot en tiempo real. Útil para avisar sobre promociones, cambios de horario o políticas.</p>
          </div>

        </div>

        <div class="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
          <button
            type="submit"
            disabled={saveAction.isRunning}
            class="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saveAction.isRunning ? (
              <span>Guardando...</span>
            ) : (
              <>
                <LuSave class="h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Asistente IA',
};
