import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { meliIntegrations } from '~/db/schema';

interface MeliTokenExchange {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: number;
}

/**
 * Callback de OAuth de Mercado Libre (el `MELI_REDIRECT_URI` registrado en la app).
 *
 * Es el camino de recuperación de la integración: los refresh tokens de MeLi son
 * de un solo uso, así que si la cadena se corta —un refresco que falla a mitad
 * de camino, por ejemplo— la única forma de volver a andar es reautorizar acá.
 *
 * Antes esta ruta canjeaba el código y devolvía los tokens como JSON en pantalla
 * sin guardarlos, con un TODO pendiente. Eso significaba que reautorizar no
 * arreglaba nada (había que copiarlos a mano a Turso) y que ambos tokens
 * quedaban expuestos en una respuesta HTTP de una ruta pública.
 */
export const onGet: RequestHandler = async ({ query, env, json, redirect }) => {
    const code = query.get('code');

    if (!code) {
        json(400, { error: 'No se recibió el código de autorización de Mercado Libre' });
        return;
    }

    const clientId = env.get('MELI_CLIENT_ID');
    const clientSecret = env.get('MELI_CLIENT_SECRET');
    const redirectUri = env.get('MELI_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
        console.error('Faltan variables de entorno de Mercado Libre');
        json(500, { error: 'La integración no está configurada' });
        return;
    }

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri
        })
    });

    if (!response.ok) {
        const details = await response.text().catch(() => '');
        console.error('Falló el canje de tokens de Mercado Libre:', response.status, details);
        // El detalle del error puede incluir datos de la app: se registra en el
        // log del servidor, no se devuelve al navegador.
        json(response.status, { error: 'Falló el canje de tokens con Mercado Libre' });
        return;
    }

    const data = (await response.json()) as MeliTokenExchange;

    if (!data.access_token || !data.refresh_token || !data.user_id) {
        console.error('Respuesta de tokens de Mercado Libre incompleta');
        json(502, { error: 'Mercado Libre devolvió una respuesta inesperada' });
        return;
    }

    const now = new Date();
    const db = getDb(env);

    await db
        .insert(meliIntegrations)
        .values({
            user_id: String(data.user_id),
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: new Date(now.getTime() + data.expires_in * 1000),
            updated_at: now,
        })
        .onConflictDoUpdate({
            target: meliIntegrations.user_id,
            set: {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: new Date(now.getTime() + data.expires_in * 1000),
                updated_at: now,
            },
        });

    // Los tokens nunca vuelven al navegador: se confirma redirigiendo al panel.
    throw redirect(302, '/admin/productos/?meli=conectado');
};
