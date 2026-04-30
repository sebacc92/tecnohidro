import { component$, useSignal, $ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { siteContent } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { LuSave, LuCheckCircle2, LuImage, LuTrash2, LuLayout, LuQuote, LuUsers, LuFilm, LuPlus } from '@qwikest/icons/lucide';
import { upload } from '@vercel/blob/client';
import imageCompression from 'browser-image-compression';

interface Slide {
  url: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export const useSiteContent = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  const data = await db.select().from(siteContent);
  const contentMap: Record<string, string> = {};
  for (const item of data) {
    contentMap[item.key] = item.value;
  }
  return contentMap;
});

export const useSaveContent = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      const updateOrInsert = async (key: string, value: string) => {
        const existing = await db.select().from(siteContent).where(eq(siteContent.key, key));
        if (existing.length > 0) {
          await db.update(siteContent).set({ value }).where(eq(siteContent.key, key));
        } else {
          await db.insert(siteContent).values({ key, value });
        }
      };

      // Save hero slides as JSON
      await updateOrInsert('home_hero_slides', data.home_hero_slides);

      // Save highlight phrases as JSON
      const highlightPhrases: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const p = (data as any)[`home_highlight_phrase_${i}`]?.trim();
        if (p) highlightPhrases.push(p);
      }
      await updateOrInsert('home_highlight_phrases', JSON.stringify(highlightPhrases));

      // Save weekly offer fields
      await updateOrInsert('home_weekly_offer_image', data.home_weekly_offer_image || '');
      await updateOrInsert('home_weekly_offer_link', data.home_weekly_offer_link || '');

      // Save Nosotros fields
      await updateOrInsert('nosotros_gallery', data.nosotros_gallery || '[]');
      await updateOrInsert('nosotros_reel_video', data.nosotros_reel_video || '');

      return { success: true };
    } catch (error) {
      console.error('Error saving content:', error);
      return { success: false, error: 'Hubo un error al guardar el contenido.' };
    }
  },
  zod$({
    home_hero_slides: z.string().min(1, 'El contenido del slider es obligatorio'),
    home_highlight_phrase_1: z.string().optional(),
    home_highlight_phrase_2: z.string().optional(),
    home_highlight_phrase_3: z.string().optional(),
    home_highlight_phrase_4: z.string().optional(),
    home_highlight_phrase_5: z.string().optional(),
    home_weekly_offer_image: z.string().optional(),
    home_weekly_offer_link: z.string().optional(),
    nosotros_gallery: z.string().optional(),
    nosotros_reel_video: z.string().optional(),
  })
);

export default component$(() => {
  const content = useSiteContent();
  const saveAction = useSaveContent();
  const activeTab = useSignal<'portada' | 'frases' | 'ofertas' | 'nosotros'>('portada');
  const isUploading = useSignal<number | string | null>(null);

  // Parse existing hero slides
  let initialSlides: Slide[] = [];
  try {
    initialSlides = JSON.parse(content.value.home_hero_slides || '[]');
    if (initialSlides.length === 0) {
      // Migration logic from old format
      let oldImages: string[] = [];
      try { oldImages = JSON.parse(content.value.hero_images || '[]'); } catch { oldImages = []; }

      initialSlides = oldImages.map((url, i) => ({
        url,
        title: i === 0 ? (content.value.hero_title || 'Materiales para Redes de Agua y GAS') : '',
        subtitle: i === 0 ? (content.value.hero_desc || 'Distribuidores mayoristas especializados...') : '',
        buttonText: 'Ver Catálogo',
        buttonLink: '/productos'
      }));
    }
  } catch { initialSlides = []; }

  // Ensure we have at least 5 slots (or as many as the user wants, let's keep 5 for now)
  const slides = useSignal<Slide[]>(initialSlides.length > 0 ? initialSlides : [
    { url: '', title: '', subtitle: '', buttonText: '', buttonLink: '' }
  ]);

  // Parse existing highlight phrases
  let existingPhrases: string[] = [];
  try {
    existingPhrases = JSON.parse(content.value.home_highlight_phrases || '[]');
  } catch { existingPhrases = []; }

  const weeklyOfferImage = useSignal(content.value.home_weekly_offer_image || '');

  // Nosotros signals
  let initialGallery: string[] = [];
  try {
    initialGallery = JSON.parse(content.value.nosotros_gallery || '[]');
  } catch { initialGallery = []; }
  
  // Fill with empty strings to have exactly 12 slots
  const galleryArray = Array(12).fill('');
  initialGallery.forEach((url, i) => { if (i < 12) galleryArray[i] = url; });
  const nosotrosGallery = useSignal<string[]>(galleryArray);
  const nosotrosReelVideo = useSignal(content.value.nosotros_reel_video || '');

  const handleFileChange = $(async (idx: number | string, event: Event, element: HTMLInputElement) => {
    const file = element.files?.[0];
    if (!file) return;

    isUploading.value = idx;
    try {
      const uniqueId = Math.random().toString(36).substring(2, 8);
      
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp' as const,
          initialQuality: 0.8,
        };
        const compressedBlob = await imageCompression(file, options);
        const newFileName = typeof idx === 'number' ? `hero-slide-${idx}-${uniqueId}.webp` : `upload-${uniqueId}.webp`;
        const compressedFile = new File([compressedBlob], newFileName, { type: 'image/webp' });

        const blob = await upload(newFileName, compressedFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });

        if (typeof idx === 'number') {
          const updated = [...slides.value];
          updated[idx] = { ...updated[idx], url: blob.url };
          slides.value = updated;
        } else if (idx === 'weekly') {
          weeklyOfferImage.value = blob.url;
        } else if (typeof idx === 'string' && idx.startsWith('nosotros-gallery-')) {
          const gIdx = parseInt(idx.split('-')[2]);
          const updated = [...nosotrosGallery.value];
          updated[gIdx] = blob.url;
          nosotrosGallery.value = updated;
        }
      } else if (file.type.startsWith('video/')) {
        const newFileName = `nosotros-reel-${uniqueId}${file.name.substring(file.name.lastIndexOf('.'))}`;
        const blob = await upload(newFileName, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        if (idx === 'nosotros-video') {
          nosotrosReelVideo.value = blob.url;
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      isUploading.value = null;
      element.value = '';
    }
  });

  const addSlide = $(() => {
    if (slides.value.length < 5) {
      slides.value = [...slides.value, { url: '', title: '', subtitle: '', buttonText: '', buttonLink: '' }];
    }
  });

  const removeSlide = $((idx: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta diapositiva?')) return;
    if (slides.value.length > 1) {
      slides.value = slides.value.filter((_, i) => i !== idx);
    } else {
      slides.value = [{ url: '', title: '', subtitle: '', buttonText: '', buttonLink: '' }];
    }
  });

  const updateSlideField = $((idx: number, field: keyof Slide, val: string) => {
    const updated = [...slides.value];
    updated[idx] = { ...updated[idx], [field]: val };
    slides.value = updated;
  });

  return (
    <div class="max-w-4xl mx-auto">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Contenido Web</h1>
          <p class="text-slate-500">Gestiona los textos y visuales del sitio.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div class="flex border-b border-slate-200 mb-8 gap-8">
        <button
          onClick$={() => (activeTab.value = 'portada')}
          class={`pb-4 px-2 text-sm font-bold tracking-wide uppercase transition-all relative ${activeTab.value === 'portada' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <div class="flex items-center gap-2">
            <LuLayout class="w-4 h-4" /> Portada
          </div>
          {activeTab.value === 'portada' && <div class="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full" />}
        </button>
        <button
          onClick$={() => (activeTab.value = 'ofertas')}
          class={`pb-4 px-2 text-sm font-bold tracking-wide uppercase transition-all relative ${activeTab.value === 'ofertas' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <div class="flex items-center gap-2">
            <LuImage class="w-4 h-4" /> Ofertas
          </div>
          {activeTab.value === 'ofertas' && <div class="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full" />}
        </button>
        <button
          onClick$={() => (activeTab.value = 'frases')}
          class={`pb-4 px-2 text-sm font-bold tracking-wide uppercase transition-all relative ${activeTab.value === 'frases' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <div class="flex items-center gap-2">
            <LuQuote class="w-4 h-4" /> Frases
          </div>
          {activeTab.value === 'frases' && <div class="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full" />}
        </button>
        <button
          onClick$={() => (activeTab.value = 'nosotros')}
          class={`pb-4 px-2 text-sm font-bold tracking-wide uppercase transition-all relative ${activeTab.value === 'nosotros' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <div class="flex items-center gap-2">
            <LuUsers class="w-4 h-4" /> Nosotros
          </div>
          {activeTab.value === 'nosotros' && <div class="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full" />}
        </button>
      </div>

      {saveAction.value?.success && (
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700">
          <LuCheckCircle2 class="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium">Cambios guardados</h3>
            <p class="text-sm opacity-90">Los contenidos se han actualizado correctamente.</p>
          </div>
        </div>
      )}

      <Form action={saveAction} class="space-y-8">
        <input type="hidden" name="home_hero_slides" value={JSON.stringify(slides.value.filter(s => s.url))} />
        <input type="hidden" name="home_weekly_offer_image" value={weeklyOfferImage.value} />
        <input type="hidden" name="nosotros_gallery" value={JSON.stringify(nosotrosGallery.value.filter(url => url))} />
        <input type="hidden" name="nosotros_reel_video" value={nosotrosReelVideo.value} />

        {activeTab.value === 'portada' && (
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-slate-800">Slider de la Portada</h2>
              <button
                type="button"
                onClick$={addSlide}
                disabled={slides.value.length >= 5}
                class="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                + Añadir Diapositiva
              </button>
            </div>

            {slides.value.map((slide, idx) => (
              <div key={idx} class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span class="text-xs font-black text-slate-400 uppercase tracking-widest">Diapositiva {idx + 1}</span>
                  <button
                    type="button"
                    onClick$={() => removeSlide(idx)}
                    class="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <LuTrash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Image Column */}
                  <div class="space-y-4">
                    <label class="text-xs font-bold text-slate-500 uppercase">Imagen de Fondo</label>
                    <div class="relative aspect-[16/7] rounded-lg overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 group">
                      {slide.url ? (
                        <>
                          <img src={slide.url} class="w-full h-full object-cover" />
                          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label class="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-xl hover:scale-105 transition-transform">
                              Cambiar Imagen
                              <input type="file" class="hidden" accept="image/*" onChange$={(e, el) => handleFileChange(idx, e, el)} />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                          <LuImage class="w-8 h-8 text-slate-300 mb-2" />
                          <span class="text-xs font-bold text-slate-400 uppercase">Subir Imagen</span>
                          <input type="file" class="hidden" accept="image/*" onChange$={(e, el) => handleFileChange(idx, e, el)} />
                        </label>
                      )}
                      {isUploading.value === idx && (
                        <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <div class="flex flex-col items-center gap-2">
                            <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <span class="text-[10px] font-bold text-orange-600 uppercase">Subiendo...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Column */}
                  <div class="space-y-4">
                    <div class="grid grid-cols-1 gap-4">
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500 uppercase">Título</label>
                        <input
                          type="text"
                          value={slide.title}
                          onInput$={(e, el) => updateSlideField(idx, 'title', el.value)}
                          placeholder="Título impactante..."
                          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500 uppercase">Subtítulo</label>
                        <textarea
                          value={slide.subtitle}
                          onInput$={(e, el) => updateSlideField(idx, 'subtitle', el.value)}
                          rows={2}
                          placeholder="Descripción breve..."
                          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 outline-none transition-colors resize-none"
                        />
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500 uppercase">Texto Botón</label>
                        <input
                          type="text"
                          value={slide.buttonText}
                          onInput$={(e, el) => updateSlideField(idx, 'buttonText', el.value)}
                          placeholder="Ver Catálogo"
                          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500 uppercase">Link Botón</label>
                        <input
                          type="text"
                          value={slide.buttonLink}
                          onInput$={(e, el) => updateSlideField(idx, 'buttonLink', el.value)}
                          placeholder="/productos"
                          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab.value === 'ofertas' && (
          <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 class="font-bold text-slate-800">Oferta de la Semana</h2>
                <p class="text-xs text-slate-500 mt-1">Sube una imagen impactante para la oferta destacada semanal.</p>
              </div>
              <div class="p-6 space-y-6">
                <div class="space-y-4">
                  <label class="text-xs font-bold text-slate-500 uppercase">Imagen del Banner</label>
                  <div class="relative aspect-[21/9] rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 group max-w-2xl">
                    {weeklyOfferImage.value ? (
                      <>
                        <img src={weeklyOfferImage.value} class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label class="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-xl">
                            Cambiar Imagen
                            <input type="file" class="hidden" accept="image/*" onChange$={(e, el) => handleFileChange('weekly', e, el)} />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                        <LuImage class="w-10 h-10 text-slate-300 mb-2" />
                        <span class="text-xs font-bold text-slate-400 uppercase">Subir Banner Semanal</span>
                        <input type="file" class="hidden" accept="image/*" onChange$={(e, el) => handleFileChange('weekly', e, el)} />
                      </label>
                    )}
                    {isUploading.value === 'weekly' && (
                      <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div class="flex flex-col items-center gap-2">
                          <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          <span class="text-[10px] font-bold text-orange-600 uppercase">Subiendo...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div class="space-y-1 max-w-xl">
                  <label class="text-xs font-bold text-slate-500 uppercase">Enlace del Banner</label>
                  <input
                    type="text"
                    name="home_weekly_offer_link"
                    value={content.value.home_weekly_offer_link || ''}
                    placeholder="/productos/oferta-especial"
                    class="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition-colors"
                  />
                  <p class="text-[10px] text-slate-400 mt-1">URL a la que redirigirá el banner al hacer clic.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab.value === 'frases' && (
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 class="font-bold text-slate-800">Frases Destacadas</h2>
              <p class="text-xs text-slate-500 mt-1">Estas frases rotan automáticamente en la página de inicio.</p>
            </div>
            <div class="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} class="space-y-1">
                  <div class="flex gap-3 items-center">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black border border-orange-100">{i}</span>
                    <input
                      type="text"
                      name={`home_highlight_phrase_${i}`}
                      value={existingPhrases[i - 1] || ''}
                      placeholder={`Escribe la frase ${i} aquí...`}
                      class="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab.value === 'nosotros' && (
          <div class="space-y-8">
            {/* Galería Nosotros */}
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 class="font-bold text-slate-800">Galería de Imágenes (Página Nosotros)</h2>
                <p class="text-xs text-slate-500 mt-1">Sube hasta 12 imágenes para mostrar en la galería de la sección "Nosotros".</p>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {nosotrosGallery.value.map((url, i) => (
                    <div key={i} class="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 group">
                      {url ? (
                        <>
                          <img src={url} class="w-full h-full object-cover" />
                          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label class="cursor-pointer bg-white text-slate-900 p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                              <LuImage class="w-4 h-4" />
                              <input type="file" class="hidden" accept="image/*" onChange$={(e, el) => handleFileChange(`nosotros-gallery-${i}`, e, el)} />
                            </label>
                            <button
                              type="button"
                              onClick$={() => {
                                const updated = [...nosotrosGallery.value];
                                updated[i] = '';
                                nosotrosGallery.value = updated;
                              }}
                              class="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                            >
                              <LuTrash2 class="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                          <LuPlus class="w-6 h-6 text-slate-300 mb-1" />
                          <span class="text-[10px] font-bold text-slate-400 uppercase">Subir</span>
                          <input type="file" class="hidden" accept="image/*" onChange$={(e, el) => handleFileChange(`nosotros-gallery-${i}`, e, el)} />
                        </label>
                      )}
                      {isUploading.value === `nosotros-gallery-${i}` && (
                        <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <div class="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reel Institucional */}
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 class="font-bold text-slate-800">Video / Reel Institucional</h2>
                <p class="text-xs text-slate-500 mt-1">Sube un video vertical para la sección de "Nuestro Espacio".</p>
              </div>
              <div class="p-6">
                <div class="max-w-md">
                  <div class="relative aspect-[9/16] w-full max-w-[250px] mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 group">
                    {nosotrosReelVideo.value ? (
                      <>
                        <video src={nosotrosReelVideo.value} class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label class="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-xl hover:scale-105 transition-transform">
                            Cambiar Video
                            <input type="file" class="hidden" accept="video/*" onChange$={(e, el) => handleFileChange('nosotros-video', e, el)} />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors p-4 text-center">
                        <LuFilm class="w-10 h-10 text-slate-300 mb-2" />
                        <span class="text-xs font-bold text-slate-400 uppercase">Subir Video Vertical (Reel)</span>
                        <input type="file" class="hidden" accept="video/*" onChange$={(e, el) => handleFileChange('nosotros-video', e, el)} />
                      </label>
                    )}
                    {isUploading.value === 'nosotros-video' && (
                      <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div class="flex flex-col items-center gap-2">
                          <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          <span class="text-[10px] font-bold text-orange-600 uppercase">Subiendo Video...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div class="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saveAction.isRunning || !!isUploading.value}
            class="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl active:scale-95"
          >
            {saveAction.isRunning ? (
              <span>Guardando...</span>
            ) : (
              <>
                <LuSave class="h-5 w-5" />
                Guardar Todos los Cambios
              </>
            )}
          </button>
        </div>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Contenido Web',
};
