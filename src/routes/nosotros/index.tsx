import { component$ } from '@builder.io/qwik';
import { type DocumentHead, Link } from '@builder.io/qwik-city';
import { LuBuilding2, LuPackage, LuClock } from '@qwikest/icons/lucide';
import { buttonVariants } from '../../components/ui/button/button';

export default component$(() => {
  return (
    <div class="bg-white">
      {/* Hero Section */}
      <section class="relative bg-slate-900 text-white overflow-hidden">
        <div class="absolute inset-0 z-0 opacity-30">
          <img
            src="https://placehold.co/1920x600/1e293b/334155?text=Imagen+Local+o+Depósito"
            alt="Frente del local Tecnohidro"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="container relative z-10 mx-auto px-4 py-24 md:py-32 md:px-8">
          <div class="max-w-3xl">
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Sobre Tecnohidro S.A.
            </h1>
            <p class="text-xl text-slate-300 leading-relaxed font-light">
              Somos distribuidores de materiales para la construcción de Redes de infraestructura de Agua, Cloaca y Gas para obra pública y privada, con ventas por mayor y menor.
            </p>
          </div>
        </div>
      </section>

      {/* Historia y Valores */}
      <section class="py-20">
        <div class="container mx-auto px-4 md:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div class="space-y-6 text-slate-600 leading-relaxed text-lg">
              <h2 class="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Nuestra Historia</h2>
              <p>
                <strong>Tecnohidro S.A.</strong> es la continuación de un proyecto familiar creado con mucho esfuerzo, cultura de trabajo y honestidad. Estos valores se vieron remunerados en nuestros inicios gracias a la confianza que por los años 70 nos brindaron nuestros proveedores, quienes hoy en día continúan colaborando con nosotros.
              </p>
              <p>
                Con esos cimientos y respaldados por más de <strong>40 años de experiencia</strong> en el sector, logramos posicionarnos como los principales referentes en el rubro de la distribución de materiales para la construcción, reparación y ampliación de Redes de Agua Potable, Cloaca, Desagües Pluviales y Gas.
              </p>
              <p>
                Nos caracterizamos por ser referencia de calidad, ofreciendo una excelente relación calidad/precio, entrega inmediata y, sobre todo, responsabilidad con los compromisos asumidos con nuestros clientes y colaboradores tanto en la venta como en la post-venta.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <img
                src="https://placehold.co/600x800/f8fafc/94a3b8?text=Foto+Histórica/Fundadores"
                alt="Historia de Tecnohidro"
                class="rounded-xl object-cover w-full h-full aspect-[3/4] shadow-md"
              />
              <div class="grid grid-rows-2 gap-4">
                <img
                  src="https://placehold.co/600x400/f8fafc/94a3b8?text=Mostrador/Atención"
                  alt="Atención al cliente"
                  class="rounded-xl object-cover w-full h-full shadow-md"
                />
                <img
                  src="https://placehold.co/600x400/f8fafc/94a3b8?text=Flota/Entregas"
                  alt="Logística y entregas"
                  class="rounded-xl object-cover w-full h-full shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capacidad e Infraestructura */}
      <section class="py-20 bg-slate-50 border-y border-slate-100">
        <div class="container mx-auto px-4 md:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <h2 class="text-3xl font-bold text-slate-900 mb-6 tracking-tight">Soluciones a Medida</h2>
            <p class="text-lg text-slate-600">
              Nuestro principal objetivo es encontrar una solución a sus necesidades. Para ello, contamos con un <strong>equipo técnico comercial</strong> a su entera disposición, respaldado por una gran capacidad logística.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div class="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LuClock class="w-8 h-8" />
              </div>
              <h3 class="text-4xl font-extrabold text-slate-900 mb-2">+40</h3>
              <p class="text-slate-500 font-medium uppercase tracking-wide text-sm">Años de Experiencia</p>
            </div>

            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div class="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LuPackage class="w-8 h-8" />
              </div>
              <h3 class="text-4xl font-extrabold text-slate-900 mb-2">+10.000</h3>
              <p class="text-slate-500 font-medium uppercase tracking-wide text-sm">Artículos en Stock</p>
            </div>

            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div class="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LuBuilding2 class="w-8 h-8" />
              </div>
              <h3 class="text-4xl font-extrabold text-slate-900 mb-2">+2.000</h3>
              <p class="text-slate-500 font-medium uppercase tracking-wide text-sm">Metros Cuadrados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Propuesta de Valor & Cierre */}
      <section class="py-20">
        <div class="container mx-auto px-4 md:px-8 text-center max-w-4xl">
          <h2 class="text-3xl font-bold text-slate-900 mb-8">Especialistas en Redes y Saneamiento</h2>
          <p class="text-xl text-slate-600 mb-10">
            Venta de productos para Redes de Agua, Gas, Saneamiento, Herramientas y mucho más.
            <strong> Gracias por acompañarnos y confiar en Tecnohidro S.A. durante todos estos años.</strong>
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/productos" class={buttonVariants({ look: 'primary', size: 'lg' })}>
              Explorar Catálogo
            </Link>
            <Link href="/contacto" class={buttonVariants({ look: 'outline', size: 'lg' })}>
              Contactar un Asesor
            </Link>
          </div>
        </div>
      </section>

      {/* 
        Sugerencias de secciones futuras a agregar por el usuario:
        1. Marcas Aliadas (Grid de logos de proveedores).
        2. Certificaciones o Normas de Calidad si las hubiera.
        3. Carrusel de proyectos/obras emblemáticas abastecidas.
      */}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Sobre Nosotros - Tecnohidro',
  meta: [
    {
      name: 'description',
      content: 'Con más de 40 años de experiencia, somos distribuidores líderes de materiales para redes de agua, cloaca y gas.',
    },
  ],
};
