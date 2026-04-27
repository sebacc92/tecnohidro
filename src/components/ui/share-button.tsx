import { component$, $, useSignal, useTask$ } from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';
import { LuShare2, LuCheck } from '@qwikest/icons/lucide';

interface ShareButtonProps {
  product: {
    id: string;
    name: string;
  };
  design?: 'small' | 'large';
}

export const ShareButton = component$<ShareButtonProps>(({ product, design = 'small' }) => {
  const isCopied = useSignal(false);
  const canShare = useSignal(false);

  useTask$(() => {
    if (isBrowser) {
      canShare.value = !!navigator.share;
    }
  });

  const handleShare = $(async () => {
    const url = `${window.location.origin}/producto/${product.id}/`;
    
    if (canShare.value) {
      try {
        await navigator.share({
          title: `Tecnohidro - ${product.name}`,
          text: `Mira este producto: ${product.name}`,
          url: url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        isCopied.value = true;
        setTimeout(() => {
          isCopied.value = false;
        }, 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  });

  if (design === 'large') {
    return (
      <button
        type="button"
        onClick$={handleShare}
        class="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors"
      >
        {isCopied.value ? <LuCheck class="h-5 w-5 text-green-600" /> : <LuShare2 class="h-5 w-5" />}
        {isCopied.value ? '¡Copiado!' : (canShare.value ? 'Compartir' : 'Copiar link')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick$={handleShare}
      class="mt-5 ml-2 inline-flex items-center justify-center p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
      title={canShare.value ? "Compartir producto" : "Copiar enlace"}
    >
      {isCopied.value ? <LuCheck class="h-5 w-5 text-green-600" /> : <LuShare2 class="h-5 w-5" />}
    </button>
  );
});
