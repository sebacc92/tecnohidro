import { component$, useSignal, useTask$, $ } from '@builder.io/qwik';
import { server$, useLocation, useNavigate, type RequestEventBase } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { LuSearch } from '@qwikest/icons/lucide';

// Definición de tipos para los resultados de búsqueda
export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  imageUrl: string | null;
}

// Función de servidor para ejecutar la búsqueda en la DB Turso
export const searchProductsServer = server$(async function (this: RequestEventBase, query: string): Promise<SearchResult[]> {
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
  const loc = useLocation();

  // Sincronizar con el valor inicial de la URL si existe
  const query = useSignal(loc.url.searchParams.get('q') || '');
  const wrapperRef = useSignal<Element>();

  // Sincronizar el input si la URL cambia (ej: al navegar entre categorías)
  useTask$(({ track }) => {
    const q = track(() => loc.url.searchParams.get('q'));
    if (q !== null) {
      query.value = q;
    }
  });

  // Debounce task para actualizar la URL
  useTask$(({ track, cleanup }) => {
    const currentQuery = track(() => query.value);
    const urlQ = loc.url.searchParams.get('q') || '';

    // No hacer nada si el valor es igual al de la URL
    if (currentQuery === urlQ) {
      return;
    }

    // Si hay menos de 2 caracteres y no está vacío, no hacemos nada aún
    if (currentQuery.length > 0 && currentQuery.length < 2) {
      return;
    }

    const timeout = setTimeout(() => {
      if (currentQuery !== urlQ) {
        const params = new URLSearchParams(loc.url.search);
        if (currentQuery) {
          params.set('q', currentQuery);
        } else {
          params.delete('q');
        }
        nav(`/productos?${params.toString()}`);
      }
    }, 500);

    cleanup(() => clearTimeout(timeout));
  });

  const handleInput = $((ev: Event) => {
    const el = ev.target as HTMLInputElement;
    query.value = el.value;
  });

  const handleKeyDown = $((ev: KeyboardEvent) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const params = new URLSearchParams(loc.url.search);
      if (query.value) {
        params.set('q', query.value);
      } else {
        params.delete('q');
      }
      nav(`/productos?${params.toString()}`);
    }
  });

  return (
    <div class="relative w-full" ref={wrapperRef}>
      <div class="relative w-full">
        <LuSearch class="absolute left-3 top-3.5 h-5 w-5 text-orange-600" />
        <input
          type="search"
          placeholder="¿Qué estás buscando?"
          value={query.value}
          onInput$={handleInput}
          onKeyDown$={handleKeyDown}
          class="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-base outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm"
          autoComplete="off"
        />
      </div>
    </div>
  );
});
