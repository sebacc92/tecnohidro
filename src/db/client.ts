import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

export const getDb = (env: any) => {
    const url = env.get('TURSO_DATABASE_URL');
    const authToken = env.get('TURSO_AUTH_TOKEN');

    if (!url) throw new Error('TURSO_DATABASE_URL is missing');

    const client = createClient({
        url,
        authToken,
    });

    return drizzle(client, { schema });
};
