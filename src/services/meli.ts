import { type EnvGetter } from '@builder.io/qwik-city/middleware/request-handler';
import { getDb } from '~/db/client';
import { meliIntegrations } from '~/db/schema';
import { eq } from 'drizzle-orm';

export interface MeliTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export interface MeliErrorResponse {
  message: string;
  error: string;
  status: number;
  cause: any[];
}

export class MeliAuthError extends Error {
  constructor(message: string, public status: number, public originalError?: any) {
    super(message);
    this.name = 'MeliAuthError';
  }
}

/**
 * Fuerza el refresco del token de Mercado Libre utilizando el refresh_token guardado en DB.
 * @param env Entorno de ejecución de Qwik (requestEvent.env)
 * @param userId ID del usuario en Mercado Libre
 * @returns El nuevo access_token si tuvo éxito
 */
export async function refreshMeliToken(env: EnvGetter, userId: string): Promise<string> {
  const db = getDb(env);

  // 1. Obtener la integración actual desde Turso
  const integrationQuery = await db
    .select()
    .from(meliIntegrations)
    .where(eq(meliIntegrations.user_id, userId))
    .limit(1);

  const integration = integrationQuery[0];

  if (!integration) {
    throw new MeliAuthError(`No se encontró una integración para el usuario ${userId}. Se requiere autorización inicial.`, 404);
  }

  // 2. Preparar el payload para la API de Mercado Libre
  const appId = env.get('MELI_APP_ID');
  const clientSecret = env.get('MELI_CLIENT_SECRET');

  if (!appId || !clientSecret) {
    throw new Error('Faltan variables de entorno MELI_APP_ID o MELI_CLIENT_SECRET');
  }

  const payload = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: appId,
    client_secret: clientSecret,
    refresh_token: integration.refresh_token,
  });

  // 3. Ejecutar el request de refresco
  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as MeliErrorResponse;
    throw new MeliAuthError(
      `Fallo al refrescar el token de Meli: ${errorData.message || response.statusText}`,
      response.status,
      errorData
    );
  }

  const data = (await response.json()) as MeliTokenResponse;

  // 4. Calcular el nuevo vencimiento
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);
  const now = new Date();

  // 5. Actualizar la base de datos con los nuevos tokens
  await db
    .update(meliIntegrations)
    .set({
      access_token: data.access_token,
      refresh_token: data.refresh_token, // Puede que nos den uno nuevo
      expires_at: newExpiresAt,
      updated_at: now,
    })
    .where(eq(meliIntegrations.user_id, userId));

  return data.access_token;
}

/**
 * Obtiene un token válido de Mercado Libre. Si está por vencer (margen de 5 mins) lo refresca automáticamente.
 * @param env Entorno de ejecución de Qwik (requestEvent.env)
 * @param userId ID del usuario en Mercado Libre
 * @returns Un access_token válido y vigente
 */
export async function getValidMeliToken(env: EnvGetter, userId: string): Promise<string> {
  const db = getDb(env);

  const integrationQuery = await db
    .select()
    .from(meliIntegrations)
    .where(eq(meliIntegrations.user_id, userId))
    .limit(1);

  const integration = integrationQuery[0];

  if (!integration) {
    throw new MeliAuthError(`No se encontró integración para el usuario ${userId}.`, 404);
  }

  // Margen de seguridad: 5 minutos (300,000 ms)
  const SAFETY_MARGIN_MS = 5 * 60 * 1000;
  
  // Convertir timestamp/date a milisegundos
  const expiresAtMs = new Date(integration.expires_at).getTime();
  const nowMs = Date.now();

  // Si el token expira pronto o ya expiró, lo refrescamos
  if (expiresAtMs - nowMs < SAFETY_MARGIN_MS) {
    return await refreshMeliToken(env, userId);
  }

  // Si aún está vigente y sano, lo devolvemos
  return integration.access_token;
}
