import { getDb } from './src/db/client';
import { categories } from './src/db/schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const env = { get: (k: string) => process.env[k] };
  const db = getDb(env as any);
  const allCats = await db.select().from(categories);
  
  const root = allCats.filter(c => !c.parent_id);
  const l2 = allCats.filter(c => c.parent_id && root.some(r => r.id === c.parent_id));
  const l3 = allCats.filter(c => c.parent_id && l2.some(l => l.id === c.parent_id));
  const l4 = allCats.filter(c => c.parent_id && l3.some(l => l.id === c.parent_id));
  
  console.log(`Root: ${root.length}, L2: ${l2.length}, L3: ${l3.length}, L4: ${l4.length}`);
}
test();
