import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { instagramPosts } from '~/db/schema';

export const onGet: RequestHandler = async ({ env, request, json }) => {
  // Verificación de seguridad para asegurar que solo invocadores autorizados (ej: Vercel Cron)
  // puedan ejecutar este endpoint.
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.get('CRON_SECRET');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    json(401, { error: 'Unauthorized' });
    return;
  }

  try {
    const beholdUrl = env.get('BEHOLD_URL');
    if (!beholdUrl) {
      json(500, { error: 'Missing BEHOLD_URL configuration' });
      return;
    }

    const res = await fetch(beholdUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      json(res.status, { error: 'Failed to fetch Instagram feed' });
      return;
    }

    const data = (await res.json()) as {
      posts?: Array<{
        id: string;
        mediaUrl?: string;
        permalink?: string;
        caption?: string;
        mediaType?: string;
        thumbnailUrl?: string;
        timestamp?: string;
      }>;
    };

    if (!data.posts || data.posts.length === 0) {
      json(200, { success: true, count: 0 });
      return;
    }

    // Limitar a los 12 posts más recientes para no saturar la base de datos
    const topPosts = data.posts.slice(0, 12);

    const postsToInsert = topPosts.map(post => {
      // Usamos el thumbnailUrl si es un video, sino la mediaUrl
      const imageUrl = (post.mediaType === 'VIDEO' && post.thumbnailUrl)
        ? post.thumbnailUrl
        : post.mediaUrl;

      return {
        id: post.id,
        permalink: post.permalink || '',
        mediaUrl: imageUrl || '',
        mediaType: post.mediaType || 'IMAGE',
        caption: post.caption || '',
        timestamp: post.timestamp || new Date().toISOString(),
      };
    }).filter(p => p.id && p.mediaUrl && p.permalink);

    if (postsToInsert.length === 0) {
      json(200, { success: true, count: 0, message: 'No valid posts to insert' });
      return;
    }

    const db = getDb(env);

    // Borramos los posts anteriores e insertamos los nuevos cacheables
    await db.delete(instagramPosts);
    await db.insert(instagramPosts).values(postsToInsert);

    json(200, { success: true, count: postsToInsert.length });
  } catch (err: any) {
    json(500, { error: 'Internal Server Error', message: err.message });
  }
};
