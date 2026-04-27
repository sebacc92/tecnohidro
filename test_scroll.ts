import { getValidMeliToken } from './src/services/meli';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const userId = '191214085';
  const env = { get: (k: string) => process.env[k] };
  
  try {
    const accessToken = await getValidMeliToken(env as any, userId);
    
    let allIds: string[] = [];
    const limit = 100;
    
    // Initial request
    let searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?search_type=scan&limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!searchRes.ok) throw new Error('Error init scan: ' + await searchRes.text());
    let searchData = await searchRes.json();
    
    let scrollId = searchData.scroll_id;
    if (searchData.results) allIds = allIds.concat(searchData.results);
    
    console.log(`Init fetched ${allIds.length}. Scroll ID: ${scrollId}`);

    // Loop until no more results
    while (searchData.results && searchData.results.length > 0) {
      searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?search_type=scan&scroll_id=${scrollId}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!searchRes.ok) throw new Error('Error scroll scan: ' + await searchRes.text());
      searchData = await searchRes.json();
      
      if (searchData.results && searchData.results.length > 0) {
        allIds = allIds.concat(searchData.results);
        console.log(`Scrolled fetched ${searchData.results.length}. Total so far: ${allIds.length}`);
      }
      scrollId = searchData.scroll_id;
    }

    console.log("Total final IDs:", allIds.length);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
