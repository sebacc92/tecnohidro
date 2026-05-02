import { getDb } from './src/db/client';
import { categories, products } from './src/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

async function check() {
  const sqlite = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
  const db = drizzle(sqlite);
  const id = 'cat-accesorios-para-vehiculos-o3gl';
  
  const subcats = await db.select().from(categories).where(eq(categories.parent_id, id));
  console.log('Subcats:', subcats.length);
  
  const prods = await db.select().from(products).where(eq(products.category_id, id));
  console.log('Products:', prods.length);
}
check();
