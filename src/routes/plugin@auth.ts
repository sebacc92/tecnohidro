import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { users } from '~/db/schema';
import { eq } from 'drizzle-orm';

export const onRequest: RequestHandler = async ({ url, cookie, redirect, sharedMap, env }) => {
  // Ignorar assets estáticos si llegaran a pasar por aquí
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|css|js|ico|svg|webp)$/i)) {
    return;
  }

  if (!url.pathname.startsWith('/admin')) {
    return;
  }

  const isLoginRoute = url.pathname.startsWith('/admin/login');
  const sessionCookie = cookie.get('auth_session');

  if (!sessionCookie && !isLoginRoute) {
    throw redirect(302, '/admin/login/');
  }

  if (sessionCookie) {
    const db = getDb(env);
    const userId = parseInt(sessionCookie.value, 10);
    
    if (isNaN(userId)) {
      cookie.delete('auth_session', { path: '/' });
      if (!isLoginRoute) throw redirect(302, '/admin/login/');
      return;
    }

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userRows.length === 0) {
      cookie.delete('auth_session', { path: '/' });
      if (!isLoginRoute) throw redirect(302, '/admin/login/');
      return;
    }

    const user = userRows[0];
    sharedMap.set('user', user);

    if (isLoginRoute) {
      throw redirect(302, '/admin/');
    }
  }
};
