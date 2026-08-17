import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { meliIntegrations } from '~/db/schema';
import { refreshMeliToken } from '~/services/meli';

export const onGet: RequestHandler = async ({ env, request, json }) => {
  // Mismo control que el cron de Instagram: sin esto cualquiera podía disparar
  // refrescos de token desde afuera, gastando invocaciones y rotando
  // credenciales de MercadoLibre a voluntad.
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.get('CRON_SECRET');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    json(401, { error: 'Unauthorized' });
    return;
  }

  try {
    const db = getDb(env);

    // Obtener todas las integraciones activas
    const integrations = await db
      .select({ user_id: meliIntegrations.user_id })
      .from(meliIntegrations);

    if (integrations.length === 0) {
      json(200, { success: true, message: 'No hay integraciones activas para refrescar' });
      return;
    }

    const results = [];
    let failures = 0;

    for (const integration of integrations) {
      try {
        await refreshMeliToken(env, integration.user_id);
        results.push({ userId: integration.user_id, status: 'success' });
      } catch (err: any) {
        console.error(`Error refreshing token for user ${integration.user_id}:`, err);
        results.push({ userId: integration.user_id, status: 'error', error: err.message });
        failures++;
      }
    }

    // Los refresh tokens de MeLi son de un solo uso: si un refresco falla, la
    // cadena queda cortada y hay que reautorizar por /api/meli/callback. Antes
    // esto devolvía 200 igual, así que la corrida aparecía como exitosa en
    // Vercel y el catálogo dejaba de sincronizar sin que nadie se enterara.
    if (failures > 0) {
      json(500, {
        success: false,
        message: `${failures} de ${integrations.length} integraciones fallaron al refrescar`,
        results,
      });
      return;
    }

    json(200, {
      success: true,
      message: 'Proceso de refresh completado',
      results
    });
  } catch (error: any) {
    console.error('Error in MeLi refresh cron:', error);
    json(500, { success: false, error: 'Internal Server Error' });
  }
};
