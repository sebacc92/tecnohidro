import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { getDb } from "~/db/client";
import { products, categories } from "~/db/schema";
import { eq } from "drizzle-orm";
import { ShareButton } from "~/components/ui/share-button";
import { LuCheck, LuMessageCircle } from '@qwikest/icons/lucide';

export const useProductLoader = routeLoader$(async (requestEvent) => {
  const db = getDb(requestEvent.env);
  const productId = requestEvent.params.id;

  const result = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      images: products.images,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(eq(products.id, productId))
    .limit(1);

  if (!result || result.length === 0) {
    throw requestEvent.redirect(302, "/productos/");
  }

  return result[0];
});

export default component$(() => {
  const productLoader = useProductLoader();
  const product = productLoader.value;

  const phone = "5492214636161"; // WhatsApp number from ContactButton
  const consultMessage = `Hola, estoy interesado en el producto: ${product.name} (Catalogado en ${product.categoryName || 'General'}). ¿Me podrían brindar más información?`;

  const activeImageIndex = useSignal(0);
  const images = (product.images && Array.isArray(product.images)) ? (product.images as string[]) : [];

  return (
    <div class="min-h-screen bg-slate-50 py-12 sm:py-24">
      <div class="container mx-auto px-6 md:px-12 max-w-6xl">
        <div class="mb-6 flex items-center gap-2 text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
          <a href="/" class="hover:text-cyan-600 transition-colors">Inicio</a>
          <span>/</span>
          <a href="/productos/" class="hover:text-cyan-600 transition-colors">Catálogo</a>
          <span>/</span>
          <span class="text-slate-800 font-semibold">{product.name}</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Imagen / Galería */}
          <div class="flex flex-col gap-4 p-4 lg:p-6 bg-slate-50/50">
            <div class="relative bg-slate-100 aspect-[4/3] lg:aspect-auto h-full rounded-2xl overflow-hidden border border-slate-200/50 shadow-sm flex items-center justify-center">
              {images.length > 0 ? (
                <img 
                  src={images[activeImageIndex.value]} 
                  alt={product.name} 
                  class="w-full h-full object-contain transition-opacity duration-300" 
                />
              ) : (
                <div class="flex items-center justify-center h-full text-slate-400 min-h-[300px]">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {images.length > 1 && (
              <div class="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {images.map((url: string, index: number) => (
                  <button
                    key={index}
                    onClick$={() => activeImageIndex.value = index}
                    class={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all snap-start ${
                      activeImageIndex.value === index ? 'border-cyan-600 opacity-100 shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={url} alt={`Miniatura ${index + 1}`} class="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div class="p-8 md:p-12 flex flex-col">
            <div class="mb-2">
              <span class="text-xs font-bold text-cyan-700 uppercase tracking-widest bg-cyan-50 px-3 py-1 rounded-full">
                {product.categoryName || 'General'}
              </span>
            </div>
            
            <h1 class="font-heading text-3xl md:text-4xl font-bold text-slate-900 mt-4 mb-4">
              {product.name}
            </h1>
            
            {product.description && (
              <p class="text-slate-600 text-base leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            <div class="grid grid-cols-2 gap-6 mb-10 py-6 border-y border-slate-100">
              {product.price !== null && product.price > 0 && (
                <div>
                  <span class="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Precio Unitario</span>
                  <span class="text-slate-800 font-bold text-xl">${product.price.toLocaleString('es-AR')}</span>
                </div>
              )}
              {product.stock !== null && (
                <div>
                  <span class="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Disponibilidad</span>
                  {product.stock > 0 ? (
                    <span class="flex items-center text-green-600 font-medium gap-1">
                      <LuCheck class="w-4 h-4" /> En Stock
                    </span>
                  ) : (
                    <span class="text-amber-600 font-medium">Consultar Stock</span>
                  )}
                </div>
              )}
            </div>

            <div class="mt-auto flex flex-col sm:flex-row gap-4">
              <a 
                href={`https://wa.me/${phone}?text=${encodeURIComponent(consultMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 inline-flex items-center justify-center gap-2 bg-cyan-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-cyan-700 transition-colors shadow-lg"
              >
                <LuMessageCircle class="w-6 h-6" />
                Consultar ahora
              </a>
              <div class="sm:w-1/3">
                <ShareButton product={{ id: product.id, name: product.name }} design="large" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const product = resolveValue(useProductLoader);
  return {
    title: `${product.name} | Tecnohidro`,
    meta: [
      {
        name: "description",
        content: product.description || `Consultar por ${product.name} en Tecnohidro. Especialistas en soluciones hídricas e infraestructura.`,
      },
    ],
  };
};
