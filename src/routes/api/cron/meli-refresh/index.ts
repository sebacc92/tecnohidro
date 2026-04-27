import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { meliIntegrations } from '~/db/schema';
import { refreshMeliToken } from '~/services/meli';

export const onGet: RequestHandler = async ({ env, json }) => {
  try {
    const db = getDb(env);
    
    // Obtener todas las integraciones activas
    const integrations = await db.select().from(meliIntegrations);
    
    if (integrations.length === 0) {
      json(200, { success: true, message: 'No hay integraciones activas para refrescar' });
      return;
    }

    const results = [];
    
    for (const integration of integrations) {
      try {
        await refreshMeliToken(env, integration.user_id);
        results.push({ userId: integration.user_id, status: 'success' });
      } catch (err: any) {
        console.error(`Error refreshing token for user ${integration.user_id}:`, err);
        results.push({ userId: integration.user_id, status: 'error', error: err.message });
      }
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
