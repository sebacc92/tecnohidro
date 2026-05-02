import { component$, useSignal, $ } from '@builder.io/qwik';
import { type DocumentHead, Link, routeLoader$ } from '@builder.io/qwik-city';
import { LuBuilding2, LuPackage, LuClock, LuX, LuChevronLeft, LuChevronRight } from '@qwikest/icons/lucide';
import { buttonVariants } from '../../components/ui/button/button';
import { getDb } from '~/db/client';
import { siteContent } from '~/db/schema';
import { inArray } from 'drizzle-orm';

export const useNosotrosContent = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  const data = await db.select().from(siteContent).where(
    inArray(siteContent.key, ['nosotros_gallery', 'nosotros_reel_video', 'nosotros_hero_image', 'nosotros_video_preview'])
  );

  const content: Record<string, any> = {
    gallery: [],
    video: '',
    heroImage: '',
    videoPreview: ''
  };

  for (const item of data) {
    if (item.key === 'nosotros_gallery') {
      try { content.gallery = JSON.parse(item.value); } catch { content.gallery = []; }
    } else if (item.key === 'nosotros_reel_video') {
      content.video = item.value;
    } else if (item.key === 'nosotros_hero_image') {
      content.heroImage = item.value;
    } else if (item.key === 'nosotros_video_preview') {
      content.videoPreview = item.value;
    }
  }

  return content;
});

export default component$(() => {
  const content = useNosotrosContent();
  const selectedImageIndex = useSignal<number | null>(null);

  const nextImage = $(() => {
    if (selectedImageIndex.value === null) return;
    const galleryLength = content.value.gallery.length > 0 ? content.value.gallery.length : 8;
    selectedImageIndex.value = (selectedImageIndex.value + 1) % galleryLength;
  });

  const prevImage = $(() => {
    if (selectedImageIndex.value === null) return;
    const galleryLength = content.value.gallery.length > 0 ? content.value.gallery.length : 8;
    selectedImageIndex.value = (selectedImageIndex.value - 1 + galleryLength) % galleryLength;
  });

  return (
    <>
      <div class="bg-white">
        {/* Hero Section */}
        <section class="relative bg-slate-900 text-white overflow-hidden">
          <div class="absolute inset-0 z-0 opacity-30">
            <img
              src={content.value.heroImage || "https://placehold.co/1920x600/1e293b/334155?text=Imagen+Local+o+Depósito"}
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

              <div class="flex justify-center lg:justify-end">
                <div class="relative aspect-[9/16] w-full max-w-[350px] rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[12px] border-slate-900 bg-slate-900">
                  {content.value.video ? (
                    <video
                      src={content.value.video}
                      class="w-full h-full object-cover"
                      controls
                      loop
                      playsInline
                      poster={content.value.videoPreview}
                    />
                  ) : (
                    <div class="absolute inset-0 bg-slate-800 flex items-center justify-center flex-col gap-4">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p class="text-slate-400 font-medium p-4 text-center text-sm">[Video Institucional próximamente]</p>
                    </div>
                  )}
                  {/* Estética de botón de celular opcional */}
                  <div class="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-800 rounded-full"></div>
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



        {/* Galería de Imágenes */}
        <section class="py-20 bg-white">
          <div class="container mx-auto px-4 md:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
              <h2 class="text-3xl font-bold text-slate-900 mb-6 tracking-tight">Galería de Imágenes</h2>
              <p class="text-lg text-slate-600">Un recorrido visual por nuestras obras, entregas e instalaciones.</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {content.value.gallery.length > 0 ? (
                content.value.gallery.map((url: string, i: number) => (
                  <div
                    key={i}
                    onClick$={() => selectedImageIndex.value = i}
                    class="aspect-square bg-slate-100 rounded-xl overflow-hidden group cursor-pointer relative shadow-sm border border-slate-100"
                  >
                    <img
                      src={url}
                      alt={`Galería de Tecnohidro ${i + 1}`}
                      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>
                ))
              ) : (
                [1, 2, 3, 4, 5, 6, 7, 8].map((item, idx) => (
                  <div
                    key={item}
                    onClick$={() => selectedImageIndex.value = idx}
                    class="aspect-square bg-slate-100 rounded-xl overflow-hidden group cursor-pointer relative shadow-sm border border-slate-100"
                  >
                    <img
                      src={`https://placehold.co/600x600/f8fafc/94a3b8?text=Foto+${item}`}
                      alt={`Galería de Tecnohidro ${item}`}
                      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-50"
                      loading="lazy"
                    />
                  </div>
                ))
              )}
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

      {/* Lightbox Modal */}
      {selectedImageIndex.value !== null && (
        <div
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
          onClick$={() => selectedImageIndex.value = null}
        >
          {/* Close Button */}
          <button
            onClick$={() => selectedImageIndex.value = null}
            class="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10 p-2"
          >
            <LuX class="w-8 h-8" />
          </button>

          {/* Navigation Arrows */}
          <button
            onClick$={(e) => { e.stopPropagation(); prevImage(); }}
            class="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all hover:scale-110 p-4 z-10"
          >
            <LuChevronLeft class="w-10 h-10 md:w-16 md:h-16" />
          </button>

          <button
            onClick$={(e) => { e.stopPropagation(); nextImage(); }}
            class="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all hover:scale-110 p-4 z-10"
          >
            <LuChevronRight class="w-10 h-10 md:w-16 md:h-16" />
          </button>

          {/* Image Container */}
          <div
            class="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-300"
            onClick$={(e) => e.stopPropagation()}
          >
            <img
              src={content.value.gallery.length > 0
                ? content.value.gallery[selectedImageIndex.value!]
                : `https://placehold.co/1200x1200/f8fafc/94a3b8?text=Foto+${selectedImageIndex.value! + 1}`
              }
              alt="Vista ampliada"
              class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
              {selectedImageIndex.value! + 1} / {content.value.gallery.length > 0 ? content.value.gallery.length : 8}
            </div>
          </div>
        </div>
      )}
    </>
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
