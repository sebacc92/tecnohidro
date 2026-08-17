import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

/**
 * Instancias reutilizadas entre invocaciones.
 *
 * `@libsql/client/web` habla HTTP y no mantiene estado de conexión, así que el
 * cliente es seguro de compartir. Antes se creaba uno nuevo en cada `getDb()`:
 * como el layout y la página llaman por separado, cada request instanciaba dos
 * o más clientes y sus wrappers de drizzle sin necesidad.
 */
const instances = new Map<string, ReturnType<typeof drizzle>>();

export const getDb = (env: any) => {
    const url = env.get('TURSO_DATABASE_URL');
    const authToken = env.get('TURSO_AUTH_TOKEN');

    if (!url) throw new Error('TURSO_DATABASE_URL is missing');

    // La clave incluye el token para no reusar un cliente si rotan credenciales.
    const key = `${url}::${authToken ?? ''}`;
    const existing = instances.get(key);
    if (existing) return existing;

    const client = createClient({
        url,
        authToken,
    });

    const db = drizzle(client, { schema });
    instances.set(key, db);
    return db;
};
