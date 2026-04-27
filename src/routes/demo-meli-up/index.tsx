import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

interface MeliProduct {
  id: string;
  title: string;
  price: number;
  thumbnail: string;
  permalink: string;
  condition: string;
  freeShipping: boolean;
}

interface MeliAuditResult {
  success: boolean;
  data?: MeliProduct[];
  error?: string;
}

import { getValidMeliToken } from '~/services/meli';

export const useMeliAudit = routeLoader$<MeliAuditResult>(async (requestEvent) => {
  const userId = '191214085';
  let accessToken: string;
  try {
    accessToken = await getValidMeliToken(requestEvent.env, userId);
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener token de Mercado Libre. ¿Falta autorizar la aplicación?'
    };
  }

  try {
    const searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!searchRes.ok) {
      const errData = await searchRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Error al buscar items: ${searchRes.status} ${searchRes.statusText} - ${JSON.stringify(errData)}`
      };
    }

    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return { success: true, data: [] };
    }

    const ids = searchData.results.slice(0, 20).join(',');
    const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${ids}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!itemsRes.ok) {
      const errData = await itemsRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Error al obtener detalles: ${itemsRes.status} ${itemsRes.statusText} - ${JSON.stringify(errData)}`
      };
    }

    const itemsData = await itemsRes.json();

    const data: MeliProduct[] = itemsData.map((item: any) => {
      // Regla estricta: intentar obtener url segura de alta calidad, fallback a thumbnail con https
      let thumbnail = item.body.thumbnail || '';
      if (item.body.pictures && item.body.pictures.length > 0 && item.body.pictures[0].secure_url) {
        thumbnail = item.body.pictures[0].secure_url;
      } else if (thumbnail) {
        thumbnail = thumbnail.replace('http://', 'https://');
      }

      return {
        id: item.body.id,
        title: item.body.title,
        price: item.body.price,
        thumbnail: thumbnail,
        permalink: item.body.permalink,
        condition: item.body.condition || 'used',
        freeShipping: item.body.shipping?.free_shipping || false,
      };
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Excepción en useMeliAudit:", error);
    return {
      success: false,
      error: error.message || 'Error desconocido de red o ejecución'
    };
  }
});

export default component$(() => {
  const auditResult = useMeliAudit();
  const { success, data, error } = auditResult.value;

  return (
    <div class="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-7xl mx-auto">
        <header class="mb-10">
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Nuestros Productos
          </h1>
          <p class="mt-2 text-slate-500 text-lg">
            Descubre nuestra selección con los mejores precios y envíos a todo el país.
          </p>
        </header>

        {!success ? (
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error de Sincronización</h3>
                <div class="mt-2 text-sm text-red-700 font-mono break-all">
                  <p>{error}</p>
                </div>
                <div class="mt-4">
                  <p class="text-xs text-red-600 font-semibold uppercase tracking-wider">Acción Requerida:</p>
                  <p class="text-sm mt-1">Verifica que el Access Token sea válido y no esté expirado.</p>
                </div>
              </div>
            </div>
          </div>
        ) : !data || data.length === 0 ? (
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl shadow-sm">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Sin Resultados</h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <p>Por el momento no hay productos disponibles para mostrar en este catálogo.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {data.map((product) => (
              <article 
                key={product.id} 
                class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Imagen del producto */}
                <header class="aspect-square bg-white p-6 relative flex items-center justify-center">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    loading="lazy"
                    decoding="async"
                    class="w-full h-full object-contain"
                  />
                  
                  {/* Badges Flotantes */}
                  <div class="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {product.condition === 'new' && (
                      <span class="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        Nuevo
                      </span>
                    )}
                    {product.freeShipping && (
                      <span class="bg-green-100 text-green-800 text-xs font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm border border-green-200">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                        Envío Gratis
                      </span>
                    )}
                  </div>
                </header>

                {/* Info del producto */}
                <div class="p-5 flex flex-col flex-grow border-t border-slate-100 bg-slate-50/50">
                  <h3 class="text-slate-700 text-sm line-clamp-2 mb-3 leading-relaxed">
                    {product.title}
                  </h3>

                  {/* Espaciador flexible para alinear precio y botón abajo */}
                  <div class="mt-auto">
                    <p class="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(product.price)}
                    </p>

                    <a
                      href={product.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 font-semibold transition-colors duration-200 shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-300 outline-none"
                    >
                      Comprar en Mercado Libre
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
