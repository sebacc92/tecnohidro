import { component$, Slot } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { LuLayoutDashboard, LuPackage, LuSettings, LuLogOut, LuDroplets } from '@qwikest/icons/lucide';

export default component$(() => {
  const loc = useLocation();

  const navItems = [
    { name: 'Dashboard', href: '/admin/', icon: LuLayoutDashboard },
    { name: 'Productos', href: '/admin/productos/', icon: LuPackage },
    { name: 'Contenido Web', href: '/admin/contenido/', icon: LuSettings },
  ];

  return (
    <div class="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div class="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <Link href="/" class="flex items-center gap-2 text-white">
            <LuDroplets class="h-5 w-5 text-primary-500" />
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
                    ? 'bg-primary-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon class={`h-5 w-5 ${isActive ? 'text-primary-200' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div class="p-4 border-t border-slate-800">
          <button class="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
            <LuLogOut class="h-5 w-5" />
            Cerrar Sesión
          </button>
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
