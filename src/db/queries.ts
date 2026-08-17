import { getDb } from './client';
import { categories } from './schema';
import { cached } from './cache';
import { asc } from 'drizzle-orm';

type Db = ReturnType<typeof getDb>;

/** Árbol de categorías tal como lo consumen los listados y los breadcrumbs. */
export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number | null;
};

const CATEGORIES_TTL_MS = 5 * 60 * 1000;

/**
 * Categorías del sitio, cacheadas en memoria del isolate.
 *
 * Casi todas las páginas públicas necesitan el árbol completo para armar filtros
 * y breadcrumbs, y antes cada una hacía su propio `select().from(categories)`
 * trayendo además `description` e `image`, que ningún consumidor lee.
 *
 * Vienen ya ordenadas por `sort_order` y nombre, que es como las mostraba cada
 * ruta después de reordenarlas en JS.
 */
export function getCategories(db: Db): Promise<CategoryNode[]> {
  return cached('categories:all', CATEGORIES_TTL_MS, async () => {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parent_id: categories.parent_id,
        sort_order: categories.sort_order,
      })
      .from(categories)
      .orderBy(asc(categories.sort_order), asc(categories.name));

    return rows;
  });
}

/** Categorías raíz, en orden de presentación. */
export function rootCategories(all: CategoryNode[]): CategoryNode[] {
  return all.filter((c) => !c.parent_id);
}

/** Hijas directas de `parentId`, en orden de presentación. */
export function childCategories(all: CategoryNode[], parentId: string): CategoryNode[] {
  return all.filter((c) => c.parent_id === parentId);
}
