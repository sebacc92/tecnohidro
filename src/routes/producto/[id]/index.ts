import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { products } from '~/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Redirección permanente al detalle canónico del producto.
 *
 * `/producto/{id}` era una segunda página de detalle, duplicada de
 * `/productos/{slug}`. Se eliminó, pero el botón de compartir venía generando
 * links con este formato, así que quedan enlaces vivos en WhatsApp y redes.
 *
 * El 301 los preserva y consolida en la URL canónica la señal de SEO que antes
 * se repartía entre dos páginas. La consulta es una búsqueda por clave primaria
 * y la respuesta se cachea en el CDN, así que el costo es despreciable.
 */
export const onGet: RequestHandler = async ({ params, env, redirect, cacheControl }) => {
  cacheControl({ maxAge: 60 * 60 * 24, staleWhileRevalidate: 60 * 60 * 24 * 30 });

  let slug: string | null = null;

  // La búsqueda va aislada en el try: `redirect()` corta el handler lanzando,
  // así que llamarlo acá adentro haría que este mismo catch se lo tragara.
  try {
    const db = getDb(env);
    const rows = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, params.id))
      .limit(1);

    if (rows.length > 0) slug = rows[0].slug;
  } catch (err) {
    console.error('Error resolviendo redirección de producto:', err);
  }

  // Producto inexistente o fallo de base: al catálogo.
  throw redirect(301, slug ? `/productos/${slug}/` : '/productos/');
};
