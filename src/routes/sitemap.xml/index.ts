import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products, categories } from '~/db/schema';
import { cached } from '~/db/cache';
import { eq } from 'drizzle-orm';

/**
 * Sitemap generado desde la base.
 *
 * Existe sobre todo por costo: sin él los bots descubren el catálogo tanteando
 * `/productos?q=...&page=...`, y cada combinación es un cache miss que dispara
 * una consulta. Con el sitemap van directo a URLs estables y cacheables.
 *
 * Se cachea una hora en el CDN y en memoria, así que el costo real ronda una
 * consulta por hora sin importar cuántos bots pasen.
 */

const SITEMAP_TTL_MS = 60 * 60 * 1000;

type UrlEntry = { loc: string; changefreq: string; priority: string };

const STATIC_ROUTES: Array<Omit<UrlEntry, 'loc'> & { path: string }> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/productos/', changefreq: 'daily', priority: '0.9' },
  { path: '/nosotros/', changefreq: 'monthly', priority: '0.5' },
  { path: '/contacto/', changefreq: 'monthly', priority: '0.5' },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const onGet: RequestHandler = async ({ env, url, send, cacheControl }) => {
  cacheControl({ maxAge: 60 * 60, staleWhileRevalidate: 60 * 60 * 24 });

  const db = getDb(env);
  const origin = url.origin;

  try {
    const paths = await cached('sitemap:paths', SITEMAP_TTL_MS, async () => {
      const [cats, prods] = await db.batch([
        db
          .select({ slug: categories.slug, parentId: categories.parent_id, id: categories.id })
          .from(categories),
        db
          .select({ slug: products.slug })
          .from(products)
          .where(eq(products.status, 'active')),
      ]);

      const bySlug = new Map(cats.map((c) => [c.id, c.slug]));
      const entries: Array<Omit<UrlEntry, 'loc'> & { path: string }> = [...STATIC_ROUTES];

      for (const cat of cats) {
        if (!cat.parentId) {
          entries.push({ path: `/categorias/${cat.slug}/`, changefreq: 'weekly', priority: '0.8' });
          continue;
        }
        const parentSlug = bySlug.get(cat.parentId);
        // Una subcategoría cuyo padre no existe no tiene URL navegable.
        if (!parentSlug) continue;
        entries.push({
          path: `/categorias/${parentSlug}/${cat.slug}/`,
          changefreq: 'weekly',
          priority: '0.7',
        });
      }

      for (const prod of prods) {
        entries.push({ path: `/productos/${prod.slug}/`, changefreq: 'weekly', priority: '0.6' });
      }

      return entries;
    });

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (entry) =>
      `  <url>\n    <loc>${escapeXml(origin + entry.path)}</loc>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;

    send(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }),
    );
  } catch (error) {
    console.error('Error generando sitemap:', error);
    // Ante un fallo de base se devuelve al menos las rutas estáticas, para no
    // servirle un 500 a los buscadores.
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_ROUTES.map(
  (entry) =>
    `  <url>\n    <loc>${escapeXml(origin + entry.path)}</loc>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
).join('\n')}
</urlset>
`;
    send(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }),
    );
  }
};
