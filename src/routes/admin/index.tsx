import { component$ } from '@builder.io/qwik';
import { type DocumentHead, Link, routeLoader$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '../../db/schema';
import { count, eq } from 'drizzle-orm';
import { LuPackage, LuTag, LuShoppingCart, LuAlertCircle, LuLayers, LuPalette, LuMessageSquare, LuBrain, LuArrowRight, LuBuilding2 } from '@qwikest/icons/lucide';

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
          color="bg-cyan-500"
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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Productos y Categorías */}
        <div class="space-y-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-cyan-200 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                <LuPackage class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-slate-900">Gestión de Productos</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              Administra el inventario completo. Podés crear productos manualmente o importarlos desde <strong>Mercado Libre</strong> en lotes de 50 ítems.
              <span class="block mt-2 font-medium text-slate-800 italic">Nota: Para optimizar la velocidad, la descripción de productos MeLi se trae individualmente al editar cada artículo.</span>
            </p>
            <Link href="/admin/productos" class="inline-flex items-center gap-2 text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors">
              Ir a Productos <LuArrowRight class="w-4 h-4" />
            </Link>
          </div>

          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <LuLayers class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-slate-900">Categorías y Organización</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              Estructurá tu catálogo con categorías anidadas (unas dentro de otras).
              Es fundamental que los productos de Mercado Libre sean <strong>asignados a una categoría local</strong> para que aparezcan correctamente en la navegación del sitio.
            </p>
            <Link href="/admin/categorias" class="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              Gestionar Categorías <LuArrowRight class="w-4 h-4" />
            </Link>
          </div>

          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <LuBuilding2 class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-slate-900">Marcas y Proveedores</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              Mantené actualizado el listado de marcas. Podés agregar, editar o eliminar los fabricantes con los que trabajás para que los usuarios puedan filtrar el catálogo por su marca favorita.
            </p>
            <Link href="/admin/marcas" class="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Administrar Marcas <LuArrowRight class="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Contenido e Inteligencia Artificial */}
        <div class="space-y-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <LuPalette class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-slate-900">Contenido e Imagen</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              Personalizá la web sin tocar código. Desde aquí podés cambiar los textos de la página de inicio, actualizar imágenes de banners, el video institucional y la galería de la sección "Nosotros".
            </p>
            <Link href="/admin/contenido" class="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Editar Contenidos <LuArrowRight class="w-4 h-4" />
            </Link>
          </div>

          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-200 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <LuMessageSquare class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-slate-900">Auditoría de Conversaciones</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              Revisá lo que los usuarios le preguntan a la IA. Esta sección te permite ver todas las conversaciones en tiempo real para entender las dudas de tus clientes y detectar posibles ventas.
            </p>
            <Link href="/admin/auditoria" class="inline-flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors">
              Ver Historial de Chats <LuArrowRight class="w-4 h-4" />
            </Link>
          </div>

          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <LuBrain class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-slate-900">Entrenamiento del Asistente</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-4">
              Entrená a la IA para que se comporte como un experto. Definí su personalidad, cargá conocimientos específicos de Tecnohidro y dale instrucciones sobre cómo debe responder a consultas técnicas.
            </p>
            <Link href="/admin/asistente" class="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Configurar Asistente <LuArrowRight class="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => {
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
};

// Import this here for the icon in StatCard
import { LuLayoutDashboard } from '@qwikest/icons/lucide';

export const head: DocumentHead = {
  title: 'Dashboard - Admin',
};
