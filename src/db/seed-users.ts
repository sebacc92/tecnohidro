import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { users } from './schema';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env.local') }); // fallback
dotenv.config({ path: resolve(__dirname, '../.env.local') }); // src/.env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') }); // project root

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

async function main() {
  try {
    const passwordHash = await bcrypt.hash('Tecno2026*', 10);
    
    await db.insert(users).values([
      { username: 'diego', password_hash: passwordHash, role: 'SUPERADMIN' },
      { username: 'seba', password_hash: passwordHash, role: 'SUPERADMIN' },
      { username: 'marcelo', password_hash: passwordHash, role: 'SUPERADMIN' },
    ]);

    console.log('Usuarios creados correctamente.');
  } catch (error) {
    console.error('Error al insertar usuarios (pueden estar ya creados):', error);
  }
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
