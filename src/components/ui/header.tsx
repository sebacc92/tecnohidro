import { component$, useSignal } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { LuMenu, LuX, LuFacebook, LuInstagram, LuLinkedin, LuPhone } from '@qwikest/icons/lucide';
import Logo from '~/media/tecnohidro.png?jsx';
import { LiveSearch } from '../LiveSearch';
import { CartButton } from '../cart/cart-button';


export const Header = component$(() => {
  const isMenuOpen = useSignal(false);
  const loc = useLocation();
  // Se considera catálogo si empieza con /productos o /categorias
  const isCatalog = loc.url.pathname.startsWith('/categorias') || loc.url.pathname.startsWith('/productos');

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/productos/', label: 'Shop' },
    { href: '/productos?ofertas=true', label: 'Ofertas' },
    { href: '/nosotros/', label: 'Nosotros' },
    { href: '/contacto/', label: 'Contacto' },
  ];

  return (
    <header class="sticky top-0 z-50 w-full bg-white shadow-md">
      {/* Main Header Container */}
      <div class="container mx-auto px-4 xl:px-8 h-20 lg:h-24 flex justify-between items-center gap-2 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-8">
        {/* Left: Logo */}
        <Link href="/" class="flex items-center shrink min-w-0">
          <Logo class="h-8 sm:h-10 lg:h-12 xl:h-16 w-auto object-contain max-w-full" />
        </Link>

        <div class="hidden lg:flex items-center justify-center min-w-0">
          <nav aria-label="Navegación principal">
            <ul class="flex items-center gap-0 xl:gap-2">
              {navLinks.map((link) => {
                const isActive = loc.url.pathname === link.href || (link.href !== '/' && loc.url.pathname.startsWith(link.href));
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      class={`px-1.5 xl:px-4 py-2 text-[11px] lg:text-[14px] xl:text-[15px] font-bold uppercase tracking-wide xl:tracking-[0.12em] transition-all duration-300 relative group whitespace-nowrap ${isActive ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'
                        }`}
                    >
                      {link.label}
                      <span class={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-orange-600 transition-all duration-300 group-hover:w-2/3 ${isActive ? 'w-2/3' : ''}`} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Right Section: Phone, Socials & Mobile Toggle */}
        <div class="flex items-center justify-end gap-2 xl:gap-4">
          {/* Phone - Compact from LG, Full from 2XL */}
          <a href="tel:2214571111" class="hidden lg:flex items-center gap-2 text-slate-800 font-bold border-l border-slate-100 pl-4 hover:text-orange-600 transition-colors group">
            <div class="bg-orange-50 p-1.5 text-orange-600 group-hover:bg-orange-100 transition-colors">
              <LuPhone class="w-4 h-4 xl:w-5 xl:h-5" />
            </div>
            <div class="flex flex-col leading-none">
              <span class="hidden 2xl:block text-[10px] uppercase text-slate-400 tracking-wider mb-1">Llamanos</span>
              <span class="text-[11px] lg:text-sm xl:text-sm">221 457-1111</span>
            </div>
          </a>

          {/* Socials - Visible only from 2XL (approx 1536px) */}
          <div class="hidden 2xl:flex items-center gap-4 border-l border-slate-100 pl-8">
            <a href="https://www.facebook.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#1877F2] transition-all hover:scale-110" aria-label="Facebook">
              <LuFacebook class="h-5 w-5" />
            </a>
            <a href="https://www.instagram.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#E4405F] transition-all hover:scale-110" aria-label="Instagram">
              <LuInstagram class="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/company/tecnohidro-s.a." target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#0A66C2] transition-all hover:scale-110" aria-label="LinkedIn">
              <LuLinkedin class="h-5 w-5" />
            </a>
          </div>

          <div class="flex items-center gap-2 pl-4 border-l border-slate-100">
            <CartButton />
            {/* Mobile Menu Toggle */}
            <button
              class="lg:hidden p-2 text-slate-600 hover:text-orange-500 transition-colors border border-slate-100 rounded-md"
              onClick$={() => (isMenuOpen.value = !isMenuOpen.value)}
              aria-label="Toggle menu"
            >
              {isMenuOpen.value ? <LuX class="h-7 w-7" /> : <LuMenu class="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMenuOpen.value && (
        <div class="lg:hidden border-t border-slate-100 bg-white absolute top-full w-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 z-50">
          <div class="p-6 space-y-8">
            {/* Mobile Search - Only on Catalog */}
            {isCatalog && (
              <div class="space-y-4">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Buscador</span>
                <LiveSearch />
              </div>
            )}

            {/* Mobile Navigation */}
            <nav class="flex flex-col gap-4">
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Menú</span>
              {navLinks.map((link) => {
                const isActive = loc.url.pathname === link.href || (link.href !== '/' && loc.url.pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    class={`text-lg font-bold py-2 border-b border-slate-50 transition-colors uppercase tracking-widest ${isActive ? 'text-orange-600 pl-2 border-orange-600' : 'text-slate-800 hover:text-orange-600'
                      }`}
                    onClick$={() => (isMenuOpen.value = false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Contact & Socials */}
            <div class="pt-6 border-t border-slate-100 space-y-6 text-center">
              <a href="tel:2214571111" class="flex items-center justify-center gap-3 text-slate-800 font-bold text-xl hover:text-orange-600 transition-colors">
                <LuPhone class="w-6 h-6 text-orange-600" />
                <span>221 457-1111</span>
              </a>
              <div class="flex items-center justify-center gap-8">
                <a href="https://www.facebook.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#1877F2]">
                  <LuFacebook class="h-8 w-8" />
                </a>
                <a href="https://www.instagram.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#E4405F]">
                  <LuInstagram class="h-8 w-8" />
                </a>
                <a href="https://www.linkedin.com/company/tecnohidro-s.a." target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#0A66C2]">
                  <LuLinkedin class="h-8 w-8" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});
