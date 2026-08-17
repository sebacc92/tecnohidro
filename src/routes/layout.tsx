import { component$, Slot } from '@builder.io/qwik';
import { type RequestHandler, routeLoader$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { siteContent } from '~/db/schema';
import { cached } from '~/db/cache';
import { eq } from 'drizzle-orm';
import { Header } from '../components/ui/header';
import { Footer } from '../components/ui/footer';
import { WhatsAppButton } from '../components/ui/whatsapp-button';
import { Chatbot } from '../components/chatbot/chatbot';
import { CartProvider } from '~/context/cart';
import { CartDrawer } from '~/components/cart/cart-drawer';

export const onGet: RequestHandler = async ({ cacheControl, url }) => {
  // El panel y las APIs no deben quedar en el CDN: sus respuestas son privadas
  // y dependen de la sesión. `admin/layout!.tsx` lo refuerza con no-cache.
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
    return;
  }

  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
  //
  // El catálogo cambia unas pocas veces por día: 5 minutos de frescura evitan
  // que el CDN revalide en casi cada visita, y el stale-while-revalidate de una
  // semana mantiene la respuesta instantánea mientras se refresca de fondo.
  cacheControl({
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    maxAge: 60 * 5,
  });
};

export const useChatbotAvatar = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  // Este loader corre en absolutamente todas las páginas del sitio. El avatar
  // cambia muy de vez en cuando, así que se cachea en memoria del isolate.
  return cached('layout:chatbot-avatar', 5 * 60 * 1000, async () => {
    const result = await db
      .select({ value: siteContent.value })
      .from(siteContent)
      .where(eq(siteContent.key, 'ai_avatar_url'))
      .limit(1);
    return result.length > 0 ? result[0].value : '';
  });
});

export default component$(() => {
  const chatbotAvatar = useChatbotAvatar();
  return (
    <CartProvider>
      <div class="flex min-h-screen flex-col font-sans bg-slate-50">
        <Header />
        <main class="flex-1">
          <Slot />
        </main>
        <Footer />
        <WhatsAppButton />
        <Chatbot avatarUrl={chatbotAvatar.value} />
        <CartDrawer whatsappNumber="5492214636161" />
      </div>
    </CartProvider>
  );
});
