import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { LuMapPin, LuPhone, LuMail, LuFacebook, LuInstagram, LuLinkedin } from '@qwikest/icons/lucide';
import Logo from '~/media/th-withe.png?jsx';

export const Footer = component$(() => {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="bg-slate-900 text-slate-200">
      <div class="container mx-auto px-4 py-12 md:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" class="inline-flex items-center mb-4">
              <Logo class="h-12 w-auto" />
            </Link>
            <p class="text-slate-400 text-sm max-w-xs mb-6">
              Distribuidora líder en insumos de agua, gas y cloacas para profesionales e industrias.
            </p>
            <div class="flex items-center gap-4">
              <a href="https://www.facebook.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-white transition-colors" aria-label="Facebook">
                <LuFacebook class="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                <LuInstagram class="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/tecnohidro-s.a." target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <LuLinkedin class="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 class="text-white font-semibold mb-4">Enlaces Rápidos</h3>
            <ul class="space-y-2 text-sm text-slate-400">
              <li><Link href="/" class="hover:text-primary-400 transition-colors">Inicio</Link></li>
              <li><Link href="/productos" class="hover:text-primary-400 transition-colors">Catálogo Completo</Link></li>
              <li><Link href="/nosotros" class="hover:text-primary-400 transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/contacto" class="hover:text-primary-400 transition-colors">Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h3 class="text-white font-semibold mb-4">Contacto</h3>
            <ul class="space-y-3 text-sm text-slate-400">
              <li class="flex items-start gap-3">
                <LuMapPin class="h-5 w-5 text-primary-400 shrink-0" />
                <span>Av. 72 e/14 y 15 nº 970, B1900 La Plata, Buenos Aires</span>
              </li>
              <li class="flex items-center gap-3">
                <LuPhone class="h-5 w-5 text-primary-400 shrink-0" />
                <span>+54 221 453-2144</span>
              </li>
              <li class="flex items-center gap-3">
                <LuMail class="h-5 w-5 text-primary-400 shrink-0" />
                <span>info@tecnohidro.com.ar</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <p>&copy; {currentYear} Tecnohidro. Todos los derechos reservados.</p>
          <p class="mt-4 md:mt-0">
            Desarrollado por{' '}
            <a
              href="https://indesign.ar"
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-primary-400 hover:text-primary-300 underline decoration-primary-400/50 underline-offset-2 transition-colors"
            >
              indesign
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
});
