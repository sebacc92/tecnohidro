import { component$, useSignal } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { LuSearch, LuDroplets, LuMenu, LuX, LuFacebook, LuInstagram, LuLinkedin } from '@qwikest/icons/lucide';

export const Header = component$(() => {
  const isMenuOpen = useSignal(false);
  const loc = useLocation();

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/nosotros/', label: 'Nosotros' },
    { href: '/productos/', label: 'Catálogo' },
    { href: '/contacto/', label: 'Contacto' },
  ];

  return (
    <header class="sticky top-0 z-50 w-full border-b bg-white">
      <div class="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        <Link href="/" class="flex items-center gap-2">
          <img src="/logo-tecno-hidro.webp" alt="Tecnohidro" width={200} height={60} class="h-12 w-auto object-contain" />
        </Link>

        {/* Desktop Navigation */}
        <nav class="hidden md:flex gap-8">
          {navLinks.map((link) => {
            const isActive = loc.url.pathname === link.href || (link.href !== '/' && loc.url.pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                class={`text-base font-semibold transition-colors ${isActive ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div class="flex items-center gap-6">
          <div class="relative hidden sm:block">
            <LuSearch class="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar productos..."
              class="h-11 w-72 md:w-80 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-base outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-sm"
            />
          </div>

          <div class="hidden lg:flex items-center gap-4 border-l pl-6 border-slate-200">
            <a href="https://www.facebook.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#1877F2] transition-colors" aria-label="Facebook">
              <LuFacebook class="h-6 w-6" />
            </a>
            <a href="https://www.instagram.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#E4405F] transition-colors" aria-label="Instagram">
              <LuInstagram class="h-6 w-6" />
            </a>
            <a href="https://www.linkedin.com/company/tecnohidro-s.a." target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#0A66C2] transition-colors" aria-label="LinkedIn">
              <LuLinkedin class="h-6 w-6" />
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            class="md:hidden p-2 text-slate-600 hover:text-primary-600 transition-colors"
            onClick$={() => (isMenuOpen.value = !isMenuOpen.value)}
            aria-label="Toggle menu"
          >
            {isMenuOpen.value ? <LuX class="h-7 w-7" /> : <LuMenu class="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMenuOpen.value && (
        <div class="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-lg">
          <nav class="flex flex-col py-4 px-4 gap-4">
            {navLinks.map((link) => {
              const isActive = loc.url.pathname === link.href || (link.href !== '/' && loc.url.pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  class={`text-base font-medium py-2 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'
                    }`}
                  onClick$={() => (isMenuOpen.value = false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <div class="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-4">
              <div class="flex items-center gap-4 py-2">
                <a href="https://www.facebook.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#1877F2]" aria-label="Facebook">
                  <LuFacebook class="h-6 w-6" />
                </a>
                <a href="https://www.instagram.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#E4405F]" aria-label="Instagram">
                  <LuInstagram class="h-6 w-6" />
                </a>
                <a href="https://www.linkedin.com/company/tecnohidro-s.a." target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#0A66C2]" aria-label="LinkedIn">
                  <LuLinkedin class="h-6 w-6" />
                </a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
});
