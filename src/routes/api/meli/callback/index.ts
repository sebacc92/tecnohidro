import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ query, env, json }) => {
    // 1. Capturamos el código que nos manda Mercado Libre por URL
    const code = query.get('code');

    if (!code) {
        throw new Error('No se recibió el código de autorización de Mercado Libre');
    }

    // 2. Traemos las variables de entorno
    const clientId = env.get('MELI_CLIENT_ID');
    const clientSecret = env.get('MELI_CLIENT_SECRET');
    const redirectUri = env.get('MELI_REDIRECT_URI');

    // 3. Hacemos el POST a la API de MeLi para canjear el code por el token
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId!,
            client_secret: clientSecret!,
            code: code,
            redirect_uri: redirectUri!
        })
    });

    const data = await response.json();

    if (!response.ok) {
        return json(response.status, { error: 'Falló el canje de tokens', details: data });
    }

    // TODO: Acá en el futuro meteremos Drizzle para guardar 'data.access_token' y 'data.refresh_token' en Turso.

    // 4. Por ahora, lo mostramos en pantalla para confirmar que funciona
    json(200, {
        message: '¡Integración exitosa, Seba!',
        tokens: data
    });
};