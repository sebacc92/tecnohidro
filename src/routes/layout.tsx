import { component$, Slot } from '@builder.io/qwik';
import { type RequestHandler } from '@builder.io/qwik-city';
import { Header } from '../components/ui/header';
import { Footer } from '../components/ui/footer';
import { WhatsAppButton } from '../components/ui/whatsapp-button';
import { Chatbot } from '../components/chatbot/chatbot';

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
  cacheControl({
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    maxAge: 5,
  });
};

export default component$(() => {
  return (
    <div class="flex min-h-screen flex-col font-sans bg-slate-50">
      <Header />
      <main class="flex-1">
        <Slot />
      </main>
      <Footer />
      <WhatsAppButton />
      <Chatbot />
    </div>
  );
});
