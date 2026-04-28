import { component$, Slot } from '@builder.io/qwik';
import { routeLoader$, type RequestHandler } from '@builder.io/qwik-city';
import { Header } from '../components/ui/header';
import { Footer } from '../components/ui/footer';
import { WhatsAppButton } from '../components/ui/whatsapp-button';
import { Chatbot } from '../components/chatbot/chatbot';
import { getDb } from '~/db/client';
import { categories } from '~/db/schema';

export const useNavigationCategories = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  const allCats = await db.select().from(categories);
  
  // Nivel 1 (Raíces que deben mostrarse en el menú)
  const roots = allCats.filter(c => !c.parent_id && c.show_in_menu !== false);
  
  const tree = roots.map(root => {
    // Nivel 2
    const children = allCats.filter(c => c.parent_id === root.id).map(child => {
      // Nivel 3
      const subChildren = allCats.filter(sub => sub.parent_id === child.id);
      return {
        ...child,
        children: subChildren
      };
    });
    
    return {
      ...root,
      children
    };
  });
  
  return tree;
});

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
  cacheControl({
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    maxAge: 5,
  });
};

export default component$(() => {
  const categoriesSignal = useNavigationCategories();

  return (
    <div class="flex min-h-screen flex-col font-sans bg-slate-50">
      <Header categoriesTree={categoriesSignal.value || []} />
      <main class="flex-1">
        <Slot />
      </main>
      <Footer />
      <WhatsAppButton />
      <Chatbot />
    </div>
  );
});
