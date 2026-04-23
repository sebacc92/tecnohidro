import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '../../db/schema';
import { count, eq } from 'drizzle-orm';
import { LuPackage, LuTag, LuShoppingCart, LuAlertCircle } from '@qwikest/icons/lucide';

export const useDashboardStats = routeLoader$(async ({ env }) => {
  try {
    const db = getDb(env);
    const totalProductsResult = await db.select({ count: count() }).from(products);
    const meliProductsResult = await db.select({ count: count() }).from(products).where(eq(products.source, 'meli'));
    const cmsProductsResult = await db.select({ count: count() }).from(products).where(eq(products.source, 'cms'));
    const totalCategoriesResult = await db.select({ count: count() }).from(categories);

    return {
      totalProducts: totalProductsResult[0].count,
      meliProducts: meliProductsResult[0].count,
      cmsProducts: cmsProductsResult[0].count,
      totalCategories: totalCategoriesResult[0].count,
      status: 'ok' as const,
    };
  } catch (error) {
    console.error('Database stats error:', error);
    return {
      totalProducts: 0,
      meliProducts: 0,
      cmsProducts: 0,
      totalCategories: 0,
      status: 'error' as const,
    };
  }
});

export default component$(() => {
  const stats = useDashboardStats();

  return (
    <div class="max-w-5xl mx-auto">
      <h1 class="text-2xl font-bold text-slate-900 mb-6">Dashboard General</h1>

      {stats.value.status === 'error' && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <LuAlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium">Error de conexión a la base de datos</h3>
            <p class="text-sm opacity-90">Por favor, verifica las variables de entorno TURSO_DATABASE_URL y TURSO_AUTH_TOKEN.</p>
          </div>
        </div>
      )}

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Productos"
          value={stats.value.totalProducts}
          icon={LuPackage}
          color="bg-primary-500"
        />
        <StatCard
          title="Productos Propios (CMS)"
          value={stats.value.cmsProducts}
          icon={LuShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Sincronizados (MeLi)"
          value={stats.value.meliProducts}
          icon={LuTag}
          color="bg-yellow-500"
        />
        <StatCard
          title="Categorías"
          value={stats.value.totalCategories}
          icon={LuLayoutDashboard} // Reusing an icon for categories 
          color="bg-emerald-500"
        />
      </div>

      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/productos" class="p-4 border border-slate-200 rounded-lg hover:border-primary-500 hover:shadow-sm transition-all flex flex-col gap-2">
            <span class="font-medium text-slate-900">Gestionar Productos</span>
            <span class="text-sm text-slate-500">Agregar, editar o eliminar productos del catálogo propio.</span>
          </a>
          <a href="/admin/contenido" class="p-4 border border-slate-200 rounded-lg hover:border-primary-500 hover:shadow-sm transition-all flex flex-col gap-2">
            <span class="font-medium text-slate-900">Editar Home</span>
            <span class="text-sm text-slate-500">Modificar los textos del Hero de la página principal.</span>
          </a>
          <div class="p-4 border border-slate-200 rounded-lg opacity-60 cursor-not-allowed flex flex-col gap-2 relative overflow-hidden">
            <span class="font-medium text-slate-900">Sincronizar MeLi</span>
            <span class="text-sm text-slate-500">Forzar actualización con MercadoLibre.</span>
            <div class="absolute top-2 right-2 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-sm">
              Próximamente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const StatCard = component$<{ title: string; value: number; icon: any; color: string }>(({ title, value, icon: Icon, color }) => {
  return (
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div class={`w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0 ${color}`}>
        <Icon class="w-6 h-6" />
      </div>
      <div>
        <p class="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p class="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
});

// Import this here for the icon in StatCard
import { LuLayoutDashboard } from '@qwikest/icons/lucide';

export const head: DocumentHead = {
  title: 'Dashboard - Admin',
};
