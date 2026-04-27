import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

interface MeliAuditItem {
  id: string;
  title: string;
  price: number;
  status: string;
  thumbnail: string;
  user_product_id: string | null;
  family_name: string | null;
}

interface MeliAuditResult {
  success: boolean;
  data?: MeliAuditItem[];
  error?: string;
}

export const useMeliAudit = routeLoader$<MeliAuditResult>(async () => {
  const accessToken = 'APP_USR-2109184180485265-042711-1413df3a8da275c2dd83ac7c215df64c-132935350';
  const userId = '132935350';

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

    const data: MeliAuditItem[] = itemsData.map((item: any) => ({
      id: item.body.id,
      title: item.body.title,
      price: item.body.price,
      status: item.body.status,
      thumbnail: item.body.secure_thumbnail || item.body.thumbnail,
      user_product_id: item.body.catalog_product_id || item.body.user_product_id || null,
      family_name: item.body.family_name || null
    }));

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
    <div class="min-h-screen bg-slate-50 p-8 text-slate-900 font-sans">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
          <h1 class="text-2xl font-mono font-bold tracking-tight">
            ME_LI :: AUDIT_DASHBOARD
          </h1>
          <div class="text-sm font-mono bg-slate-200 px-3 py-1 rounded text-slate-600">
            /demo-meli-up
          </div>
        </div>

        {!success ? (
          <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded shadow-sm">
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
                  <p class="text-sm mt-1">Verifica que el Access Token sea válido, no esté expirado, y que el User ID corresponda a la cuenta.</p>
                </div>
              </div>
            </div>
          </div>
        ) : !data || data.length === 0 ? (
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded shadow-sm">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Sin Resultados</h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <p>La consulta se realizó con éxito pero no se encontraron publicaciones activas para el usuario especificado.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div class="bg-white shadow ring-1 ring-slate-200 sm:rounded-lg overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-300">
              <thead class="bg-slate-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-900 sm:pl-6 uppercase tracking-wider">IMG</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">Item ID</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">Title</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">Price</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">Status</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">User Product ID</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">Family Name</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white font-mono text-sm">
                {data.map((item) => (
                  <tr key={item.id} class="hover:bg-slate-50 transition-colors">
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                      <img src={item.thumbnail} alt="thumb" class="h-12 w-12 rounded border border-slate-200 object-cover bg-slate-100" width="48" height="48" loading="lazy" />
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-slate-500 font-medium">
                      {item.id}
                    </td>
                    <td class="px-3 py-4 text-slate-700 max-w-xs truncate font-sans" title={item.title}>
                      {item.title}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-slate-900 font-semibold">
                      ${item.price.toLocaleString('es-AR')}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4">
                      <span class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        item.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                        item.status === 'paused' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                        'bg-slate-50 text-slate-600 ring-slate-500/10'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4">
                      {item.user_product_id ? (
                        <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                          {item.user_product_id}
                        </span>
                      ) : (
                        <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-500/10">
                          NULL
                        </span>
                      )}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-slate-500">
                      {item.family_name ? (
                        <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {item.family_name}
                        </span>
                      ) : (
                        <span class="text-slate-400 italic font-sans text-xs">No definido</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});
