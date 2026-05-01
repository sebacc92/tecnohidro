import { component$, Slot } from '@builder.io/qwik';
import { Link, useLocation, routeLoader$ } from '@builder.io/qwik-city';
import { LuLayoutDashboard, LuPackage, LuSettings, LuLogOut, LuDroplets, LuTags, LuImage, LuBot, LuMessageSquare, LuUser } from '@qwikest/icons/lucide';

export const useAdminUser = routeLoader$(({ sharedMap }) => {
  return sharedMap.get('user') as { id: number, username: string, role: string } | undefined;
});

export default component$(() => {
  const loc = useLocation();
  const user = useAdminUser();

  const navItems = [
    { name: 'Dashboard', href: '/admin/', icon: LuLayoutDashboard },
    { name: 'Productos', href: '/admin/productos/', icon: LuPackage },
    { name: 'Categorías', href: '/admin/categorias/', icon: LuTags },
    { name: 'Marcas', href: '/admin/marcas/', icon: LuImage },
    { name: 'Contenido Web', href: '/admin/contenido/', icon: LuSettings },
    { name: 'Asistente IA', href: '/admin/asistente/', icon: LuBot },
    { name: 'Auditoría Chat', href: '/admin/auditoria/', icon: LuMessageSquare },
  ];

  return (
    <div class="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div class="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <Link href="/" class="flex items-center gap-2 text-white">
            <LuDroplets class="h-5 w-5 text-cyan-500" />
            <span class="font-bold tracking-tight">Tecnohidro Admin</span>
          </Link>
        </div>

        <nav class="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = loc.url.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                class={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-cyan-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon class={`h-5 w-5 ${isActive ? 'text-cyan-200' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div class="p-4 border-t border-slate-800 space-y-2">
          {user.value && (
            <div class="px-3 pb-3 mb-2 border-b border-slate-800">
              <p class="text-xs text-slate-500 font-medium uppercase">Usuario actual</p>
              <p class="text-sm text-white font-bold capitalize mt-0.5">{user.value.username}</p>
            </div>
          )}
          <Link href="/admin/perfil" class="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
            <LuUser class="h-5 w-5" />
            Mi Perfil
          </Link>
          <a href="/admin/logout" class="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-md transition-colors">
            <LuLogOut class="h-5 w-5" />
            Cerrar Sesión
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main class="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header class="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shrink-0">
          <span class="font-bold text-slate-900">Tecnohidro Admin</span>
        </header>

        {/* Page Content */}
        <div class="flex-1 overflow-y-auto p-4 md:p-8">
          <Slot />
        </div>
      </main>
    </div>
  );
});
