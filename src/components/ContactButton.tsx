import { component$ } from '@builder.io/qwik';
import { buttonVariants } from './ui/button/button';
import { LuMessageCircle } from '@qwikest/icons/lucide';
import { Link } from '@builder.io/qwik-city';
import { cn } from '@qwik-ui/utils';

interface ContactButtonProps {
  productName: string;
  class?: string;
  look?: 'primary' | 'secondary' | 'alert' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const ContactButton = component$<ContactButtonProps>(({ productName, class: className, look = 'primary', size = 'md' }) => {
  const message = `Hola, estoy interesado en el producto: ${productName}. ¿Me podrían brindar más información?`;
  const whatsappUrl = `https://wa.me/5492214636161?text=${encodeURIComponent(message)}`; 

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      class={cn(buttonVariants({ look, size }), className)}
    >
      <LuMessageCircle class="mr-2 h-5 w-5" />
      Consultar ahora
    </Link>
  );
});
