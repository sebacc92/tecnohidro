import { component$ } from '@builder.io/qwik';
import { LuInstagram } from '@qwikest/icons/lucide';

export interface InstagramPostProps {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption?: string;
}

export const MOCK_INSTAGRAM_POSTS: InstagramPostProps[] = [
  {
    id: 'mock-1',
    mediaUrl: 'https://placehold.co/600x600/e2e8f0/475569?text=Instagram+Post+1',
    permalink: 'https://www.instagram.com/tecnohidrosa/',
    caption: '¡Nuevos insumos en stock!',
  },
  {
    id: 'mock-2',
    mediaUrl: 'https://placehold.co/600x600/e2e8f0/475569?text=Instagram+Post+2',
    permalink: 'https://www.instagram.com/tecnohidrosa/',
    caption: 'Calidad garantizada para tu obra.',
  },
  {
    id: 'mock-3',
    mediaUrl: 'https://placehold.co/600x600/e2e8f0/475569?text=Instagram+Post+3',
    permalink: 'https://www.instagram.com/tecnohidrosa/',
    caption: 'Todo para instalaciones de agua y gas.',
  },
  {
    id: 'mock-4',
    mediaUrl: 'https://placehold.co/600x600/e2e8f0/475569?text=Instagram+Post+4',
    permalink: 'https://www.instagram.com/tecnohidrosa/',
    caption: 'Atención especializada.',
  },
  {
    id: 'mock-5',
    mediaUrl: 'https://placehold.co/600x600/e2e8f0/475569?text=Instagram+Post+5',
    permalink: 'https://www.instagram.com/tecnohidrosa/',
    caption: 'Herramientas de nivel profesional.',
  },
  {
    id: 'mock-6',
    mediaUrl: 'https://placehold.co/600x600/e2e8f0/475569?text=Instagram+Post+6',
    permalink: 'https://www.instagram.com/tecnohidrosa/',
    caption: 'Envíos a todo el país.',
  },
];

type SocialFeedProps = {
  posts?: InstagramPostProps[];
};

export const SocialFeed = component$<SocialFeedProps>(({ posts }) => {
  const safePosts = posts && posts.length > 0 ? posts : MOCK_INSTAGRAM_POSTS;

  return (
    <section class="py-16 bg-white border-t border-slate-100">
      <div class="container mx-auto px-4 md:px-8">
        <header class="flex flex-col items-center justify-between gap-6 md:flex-row mb-12">
          <div class="text-center md:text-left">
            <h2 class="text-3xl font-bold tracking-tight text-slate-900 mb-2">
              Síguenos en Instagram
            </h2>
            <p class="text-slate-500">
              Enterate de nuestras novedades, ofertas y productos destacados.
            </p>
          </div>

          <a
            href="https://www.instagram.com/tecnohidrosa/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-6 py-3 rounded-lg font-medium transition hover:border-primary-300 hover:text-primary-600 hover:shadow-sm"
          >
            <LuInstagram class="w-5 h-5" />
            <span>@tecnohidrosa</span>
          </a>
        </header>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {safePosts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              class="group relative block aspect-square overflow-hidden bg-slate-100 rounded-xl border border-slate-100 shadow-sm"
            >
              <img
                src={post.mediaUrl}
                alt={post.caption || 'Publicación de Instagram Tecnohidro'}
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              <div class="absolute inset-0 flex items-center justify-center bg-primary-900/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <LuInstagram class="w-8 h-8 text-white drop-shadow-md" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
});
