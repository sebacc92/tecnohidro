import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

// 0. Definimos la interfaz para que TypeScript sepa qué campos tiene un producto
interface MeliProduct {
  id: string;
  title: string;
  price: number;
  thumbnail: string;
  permalink: string;
}

// Ejecutamos la llamada a la API en el servidor
export const useMeliProducts = routeLoader$(async (): Promise<MeliProduct[]> => {
  // ATENCIÓN: Hardcodeamos el token temporalmente solo para esta prueba.
  // En producción, esto se lee desde la base de datos Turso.
  const accessToken = 'APP_USR-2109184180485265-042711-1413df3a8da275c2dd83ac7c215df64c-132935350';
  const userId = '132935350';

  try {
    // 1. Buscamos los IDs de tus publicaciones activas
    const searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return [];
    }

    // 2. Traemos el detalle de esos IDs (MeLi permite agrupar hasta 20 por llamada)
    const ids = searchData.results.slice(0, 20).join(',');
    const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${ids}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const itemsData = await itemsRes.json();

    // 3. Limpiamos y mapeamos la respuesta para enviar solo lo necesario al frontend
    return itemsData.map((item: any): MeliProduct => ({
      id: item.body.id,
      title: item.body.title,
      price: item.body.price,
      thumbnail: item.body.secure_thumbnail.replace('-I.jpg', '-O.jpg'), // Truco para mejor resolución
      permalink: item.body.permalink
    }));
  } catch (error) {
    console.error("Error al traer productos de MeLi:", error);
    return [];
  }
});

export default component$(() => {
  const products = useMeliProducts();

  return (
    <div class="min-h-screen bg-slate-50 p-8">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-slate-900 mb-8">
          Catálogo Sincronizado
        </h1>

        {products.value.length === 0 ? (
          <p class="text-slate-500">No se encontraron productos o el token expiró.</p>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.value.map((product) => (
              <div key={product.id} class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div class="aspect-square bg-white p-4">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    class="w-full h-full object-contain"
                    width="250"
                    height="250"
                  />
                </div>
                <div class="p-5 border-t border-slate-100">
                  <h2 class="text-sm text-slate-600 line-clamp-2 min-h-[40px] mb-2">
                    {product.title}
                  </h2>
                  <p class="text-2xl font-bold text-slate-900 mb-4">
                    ${product.price.toLocaleString('es-AR')}
                  </p>
                  <a
                    href={product.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Ver en Mercado Libre
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});