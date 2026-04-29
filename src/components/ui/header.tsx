import { component$, useSignal } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { LuMenu, LuX, LuFacebook, LuInstagram, LuLinkedin, LuChevronDown, LuPhone } from '@qwikest/icons/lucide';
import Logo from '~/media/tecnohidro.png?jsx';
import { LiveSearch } from '../LiveSearch';


export interface HeaderProps {
  categoriesTree: any[];
}

export const Header = component$<HeaderProps>(({ categoriesTree }) => {
  const isMenuOpen = useSignal(false);
  const loc = useLocation();

  const navLinks = [
    { href: '/nosotros/', label: 'Nosotros' },
    { href: '/contacto/', label: 'Contacto' },
  ];

  return (
    <header class="sticky top-0 z-50 w-full bg-white flex flex-col shadow-sm">
      {/* Top Header */}
      <div class="container mx-auto flex h-20 items-center justify-between px-4 md:px-8 gap-4">
        <Link href="/" class="flex items-center shrink-0">
          <Logo class="h-12 w-auto" />
        </Link>

        {/* Phone number & Search */}
        <div class="hidden md:flex flex-1 items-center justify-between ml-8 gap-8">
          <div class="flex items-center gap-3 text-slate-800 font-semibold text-lg whitespace-nowrap">
            <div class="bg-orange-100 p-2 rounded-full text-orange-600">
              <LuPhone class="w-5 h-5" />
            </div>
            <span>221 457-1111</span>
          </div>

          <div class="flex-1 max-w-2xl w-full">
            <LiveSearch />
          </div>
        </div>

        {/* Socials & Mobile Toggle */}
        <div class="flex items-center gap-6 shrink-0">
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
            class="md:hidden p-2 text-slate-600 hover:text-orange-500 transition-colors"
            onClick$={() => (isMenuOpen.value = !isMenuOpen.value)}
            aria-label="Toggle menu"
          >
            {isMenuOpen.value ? <LuX class="h-7 w-7" /> : <LuMenu class="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Bottom Navbar & Mega Menu */}
      <div class="hidden md:block w-full border-t border-slate-200 bg-white relative">
        <div class="container mx-auto px-4 md:px-8">
          <nav class="flex items-center justify-center">
            <ul class="flex items-stretch flex-wrap justify-center">
              {categoriesTree.map((cat) => {
                const hasChildren = cat.children && cat.children.length > 0;
                return (
                  <li key={cat.id} class="group">
                    <Link
                      href={`/categorias/${cat.slug}`}
                      class="flex items-center gap-1 px-5 py-4 text-base font-bold text-slate-700 uppercase tracking-wide group-hover:bg-[#2d2d2d] group-hover:text-white transition-colors cursor-pointer"
                    >
                      {cat.name}
                      {hasChildren && <LuChevronDown class="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" />}
                    </Link>

                    {/* Mega Menu Dropdown */}
                    {hasChildren && (
                      <div class="absolute left-0 top-full w-full bg-[#2d2d2d] border-t-2 border-orange-500 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div class="container mx-auto px-8 py-10">
                          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12">
                            {cat.children.map((child: any) => (
                              <div key={child.id} class="flex flex-col gap-3">
                                <Link
                                  href={`/categorias/${cat.slug}/${child.slug}`}
                                  class="font-bold text-white uppercase text-sm hover:text-orange-500 transition-colors border-b border-slate-600 pb-2"
                                >
                                  {child.name}
                                </Link>
                                {child.children && child.children.length > 0 ? (
                                  <ul class="flex flex-col gap-2.5 mt-1">
                                    {child.children.map((subChild: any) => (
                                      <li key={subChild.id}>
                                        <Link
                                          href={`/categorias/${cat.slug}/${child.slug}/${subChild.slug}`}
                                          class="text-slate-300 text-sm hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                                        >
                                          {subChild.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <ul class="flex flex-col gap-2.5 mt-1">
                                    <li>
                                      <Link
                                        href={`/categorias/${cat.slug}/${child.slug}`}
                                        class="text-orange-400 text-sm hover:text-orange-300 hover:translate-x-1 inline-block transition-transform duration-200"
                                      >
                                        Ver todo
                                      </Link>
                                    </li>
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}

              {/* Static Links */}
              {navLinks.map((link) => (
                <li key={link.href} class="group">
                  <Link
                    href={link.href}
                    class="flex items-center px-5 py-4 text-base font-bold text-slate-700 uppercase tracking-wide group-hover:bg-[#2d2d2d] group-hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMenuOpen.value && (
        <div class="md:hidden border-t border-slate-100 bg-white absolute top-full w-full shadow-lg max-h-[80vh] overflow-y-auto">
          {/* Mobile Search - Only visible on small screens */}
          <div class="p-4 border-b border-slate-100">
            <div class="flex items-center gap-3 text-slate-800 font-semibold mb-4">
              <div class="bg-orange-100 p-2 rounded-full text-orange-600">
                <LuPhone class="w-4 h-4" />
              </div>
              <span>221 457-1111</span>
            </div>
            <LiveSearch />
          </div>

          <nav class="flex flex-col py-2">
            {categoriesTree.map((cat) => (
              <div key={cat.id} class="flex flex-col border-b border-slate-50">
                <Link
                  href={`/categorias/${cat.slug}`}
                  class="text-base font-bold uppercase text-slate-800 py-3 px-4 hover:bg-orange-50 transition-colors"
                  onClick$={() => (isMenuOpen.value = false)}
                >
                  {cat.name}
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <div class="flex flex-col bg-slate-50 py-2">
                    {cat.children.map((child: any) => (
                      <div key={child.id} class="flex flex-col">
                        <Link
                          href={`/categorias/${cat.slug}/${child.slug}`}
                          class="text-sm font-medium uppercase text-slate-600 py-2 px-8 hover:text-orange-600"
                          onClick$={() => (isMenuOpen.value = false)}
                        >
                          {child.name}
                        </Link>
                        {child.children && child.children.length > 0 ? (
                          <div class="flex flex-col bg-slate-100 py-1">
                            {child.children.map((subChild: any) => (
                              <Link
                                key={subChild.id}
                                href={`/categorias/${cat.slug}/${child.slug}/${subChild.slug}`}
                                class="text-sm text-slate-500 py-1.5 px-12 hover:text-orange-500"
                                onClick$={() => (isMenuOpen.value = false)}
                              >
                                - {subChild.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div class="flex flex-col bg-slate-100 py-1">
                            <Link
                              href={`/categorias/${cat.slug}/${child.slug}`}
                              class="text-sm text-orange-600 font-medium py-1.5 px-12 hover:text-orange-500"
                              onClick$={() => (isMenuOpen.value = false)}
                            >
                              - Ver todo
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {navLinks.map((link) => {
              const isActive = loc.url.pathname === link.href || (link.href !== '/' && loc.url.pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  class={`text-base font-bold py-3 px-4 border-b border-slate-50 transition-colors ${isActive ? 'text-orange-600 bg-orange-50' : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  onClick$={() => (isMenuOpen.value = false)}
                >
                  {link.label}
                </Link>
              );
            })}

            <div class="pt-4 px-4 pb-6 flex items-center justify-center gap-6">
              <a href="https://www.facebook.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#1877F2]">
                <LuFacebook class="h-6 w-6" />
              </a>
              <a href="https://www.instagram.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#E4405F]">
                <LuInstagram class="h-6 w-6" />
              </a>
              <a href="https://www.linkedin.com/company/tecnohidro-s.a." target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#0A66C2]">
                <LuLinkedin class="h-6 w-6" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
});
