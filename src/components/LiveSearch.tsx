import { component$, useSignal, useTask$, $, useVisibleTask$ } from '@builder.io/qwik';
import { server$, useNavigate, type RequestEventBase } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { LuSearch, LuChevronRight } from '@qwikest/icons/lucide';

// Definición de tipos para los resultados de búsqueda
export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  imageUrl: string | null;
}

// Función de servidor para ejecutar la búsqueda en la DB Turso
export const searchProductsServer = server$(async function(this: RequestEventBase, query: string): Promise<SearchResult[]> {
  const db = getDb(this.env); // this.env is available in server$ scope

  
  if (!query || query.length < 3) return [];

  try {
    const rawResults = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        images: products.images,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(
        and(
          eq(products.status, 'active'),
          or(
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`)
          )
        )
      )
      .limit(5);

    // Mapear los resultados extrayendo la imagen segura
    return rawResults.map(p => {
      let imageUrl = null;
      if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        imageUrl = p.images[0];
      }
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryName: p.categoryName,
        imageUrl,
      };
    });
  } catch (error) {
    console.error('Error in searchProductsServer:', error);
    return [];
  }
});

export const LiveSearch = component$(() => {
  const nav = useNavigate();
  
  const query = useSignal('');
  const debouncedQuery = useSignal('');
  const isSearching = useSignal(false);
  const isOpen = useSignal(false);
  const results = useSignal<SearchResult[]>([]);
  const activeIndex = useSignal(-1);
  const wrapperRef = useSignal<Element>();

  // Manejador de eventos de ventana para cerrar al hacer clic afuera
  useVisibleTask$(({ cleanup }) => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
        isOpen.value = false;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    cleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });
  });

  // Debounce task
  useTask$(({ track, cleanup }) => {
    track(() => query.value);
    
    // Reset state when less than 3 characters
    if (query.value.length < 3) {
      isOpen.value = false;
      activeIndex.value = -1;
      return;
    }

    isSearching.value = true;
    isOpen.value = true;
    activeIndex.value = -1;

    const timeout = setTimeout(() => {
      debouncedQuery.value = query.value;
    }, 400);

    cleanup(() => clearTimeout(timeout));
  });

  // Fetch results when debounced query changes
  useTask$(async ({ track }) => {
    track(() => debouncedQuery.value);
    
    if (debouncedQuery.value.length >= 3) {
      const res = await searchProductsServer(debouncedQuery.value);
      results.value = res;
      isSearching.value = false;
    }
  });

  const handleInput = $((ev: Event) => {
    const el = ev.target as HTMLInputElement;
    query.value = el.value;
  });

  const handleKeyDown = $((ev: KeyboardEvent) => {
    if (!isOpen.value || query.value.length < 3) {
      if (ev.key === 'Enter' && query.value.trim().length > 0) {
        nav(`/productos?q=${encodeURIComponent(query.value.trim())}`);
      }
      return;
    }

    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1); // no incluyo "ver todos" como item seleccionable por flechas para simplificar
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      activeIndex.value = Math.max(activeIndex.value - 1, -1);
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (activeIndex.value >= 0 && activeIndex.value < results.value.length) {
        // Seleccionó un producto
        const product = results.value[activeIndex.value];
        nav(`/producto/${product.id}/`);
        isOpen.value = false;
        query.value = ''; // Limpiar luego de navegar
      } else {
        // Presionó Enter sin nada seleccionado (Buscar todo)
        nav(`/productos?q=${encodeURIComponent(query.value.trim())}`);
        isOpen.value = false;
      }
    } else if (ev.key === 'Escape') {
      isOpen.value = false;
    }
  });

  return (
    <div class="relative hidden sm:block w-full" ref={wrapperRef}>
      <div class="relative w-full">
        <LuSearch class="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar productos..."
          value={query.value}
          onInput$={handleInput}
          onKeyDown$={handleKeyDown}
          onFocus$={() => { if (query.value.length >= 3) isOpen.value = true; }}
          class="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-base outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm"
          autoComplete="off"
        />
        {isSearching.value && (
          <div class="absolute right-3 top-3">
             <svg class="animate-spin h-5 w-5 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          </div>
        )}
      </div>

      {isOpen.value && (
        <div class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          {!isSearching.value && results.value.length === 0 && (
            <div class="p-4 text-center text-slate-500 text-sm">
              No se encontraron resultados para "{query.value}"
            </div>
          )}

          {!isSearching.value && results.value.length > 0 && (
            <div class="flex flex-col">
              <ul class="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                {results.value.map((product, index) => (
                  <li key={product.id}>
                    <button
                      onClick$={() => {
                        nav(`/producto/${product.id}/`);
                        isOpen.value = false;
                        query.value = '';
                      }}
                      onMouseEnter$={() => activeIndex.value = index}
                      class={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${activeIndex.value === index ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <div class="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {product.imageUrl ? (
                           <img src={product.imageUrl} alt={product.name} class="w-full h-full object-cover" />
                        ) : (
                           <LuSearch class="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-slate-900 truncate">{product.name}</div>
                        <div class="text-xs text-orange-600 font-medium truncate">{product.categoryName || 'General'}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              
              <div class="p-2 border-t border-slate-100 bg-slate-50">
                <button
                  onClick$={() => {
                    nav(`/productos?q=${encodeURIComponent(query.value)}`);
                    isOpen.value = false;
                  }}
                  class="w-full py-2 flex items-center justify-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Ver todos los resultados <LuChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
