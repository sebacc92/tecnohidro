import { getValidMeliToken } from './src/services/meli';
import { getDb } from './src/db/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const userId = '191214085';
  
  // mock env getter
  const env = { get: (k: string) => process.env[k] };
  
  try {
    const accessToken = await getValidMeliToken(env as any, userId);
    console.log("Token:", accessToken.substring(0, 10) + "...");
    
    let allIds: string[] = [];
    let offset = 0;
    const limit = 50;
    let total = 0;

    do {
      const searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?offset=${offset}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!searchRes.ok) throw new Error('Error searching items: ' + searchRes.statusText);
      const searchData = await searchRes.json();
      
      console.log("Search paging:", searchData.paging);
      if (searchData.results && searchData.results.length > 0) {
        allIds = allIds.concat(searchData.results);
      }
      
      total = searchData.paging?.total || 0;
      offset += limit;
      console.log(`Fetched ${allIds.length}/${total}`);
    } while (offset < total);

    console.log("Total IDs:", allIds.length);
    
    if (allIds.length > 0) {
      const chunkIds = allIds.slice(0, 2).join(','); // Test with 2 items
      const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${chunkIds}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!itemsRes.ok) throw new Error('Error fetching items detail: ' + itemsRes.statusText);
      const itemsData = await itemsRes.json();
      console.log("First item data:", JSON.stringify(itemsData[0], null, 2).substring(0, 500));
    }
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
