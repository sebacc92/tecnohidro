import { component$, useSignal, $ } from '@builder.io/qwik';
import { LuChevronLeft, LuChevronRight } from '@qwikest/icons/lucide';

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
}

export const ProductImageCarousel = component$<ProductImageCarouselProps>(({ images, productName }) => {
  const currentIndex = useSignal(0);

  const nextImage = $((e: Event) => {
    e.stopPropagation();
    currentIndex.value = (currentIndex.value + 1) % images.length;
  });

  const prevImage = $((e: Event) => {
    e.stopPropagation();
    currentIndex.value = (currentIndex.value - 1 + images.length) % images.length;
  });

  if (!images || images.length === 0) {
    return (
      <div class="flex items-center justify-center h-full w-full bg-slate-100 text-slate-400 aspect-square">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div class="relative w-full h-full group">
      <img
        src={images[currentIndex.value]}
        alt={`${productName} - Imagen ${currentIndex.value + 1}`}
        class="w-full h-full object-cover transition-opacity duration-300"
        loading={currentIndex.value === 0 ? "lazy" : "eager"}
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick$={prevImage}
            preventdefault:click
            class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10"
            aria-label="Imagen anterior"
          >
            <LuChevronLeft class="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick$={nextImage}
            preventdefault:click
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10"
            aria-label="Siguiente imagen"
          >
            <LuChevronRight class="w-5 h-5" />
          </button>

          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                class={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex.value ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
