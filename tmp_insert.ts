import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

async function run() {
  const userId = '191214085';
  const accessToken = 'APP_USR-2109184180485265-042716-516c45898b776d1831e00bd0f5b66b87-191214085';
  const refreshToken = 'TG-69efc09ab7ed260001503a2f-191214085';
  const expiresInSeconds = 21600; // 6 hours
  
  const nowMs = Date.now();
  const expiresAtMs = nowMs + (expiresInSeconds * 1000);

  console.log(`Borrando registros viejos para ${userId}...`);
  try {
    const eq = (await import('drizzle-orm')).eq;
    await db.delete(schema.meliIntegrations).where(eq(schema.meliIntegrations.user_id, userId));
  } catch (e) {
    console.log("No habia registros o fallo el delete.");
  }

  console.log(`Insertando integración para ${userId}...`);
  await db.insert(schema.meliIntegrations).values({
    user_id: userId,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: new Date(expiresAtMs),
    updated_at: new Date(nowMs),
  });

  console.log('✅ Integración insertada exitosamente.');
  process.exit(0);
}

run().catch((e) => {
  console.error("Error al insertar:", e);
  process.exit(1);
});
