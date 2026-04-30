import { component$ } from '@builder.io/qwik';
import { buttonVariants } from './ui/button/button';
import { Link } from '@builder.io/qwik-city';
import { cn } from '@qwik-ui/utils';

interface ContactButtonProps {
  productName: string;
  class?: string;
  look?: 'primary' | 'secondary' | 'alert' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const ContactButton = component$<ContactButtonProps>(({ productName, class: className, look = 'primary', size = 'md' }) => {
  const message = `Hola, quiero comprar el producto: ${productName}. ¿Cómo podemos coordinar?`;
  const whatsappUrl = `https://wa.me/5492214636161?text=${encodeURIComponent(message)}`;

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      class={cn(buttonVariants({ look, size }), "font-bold uppercase tracking-wider", className)}
    >
      Comprar
    </Link>
  );
});
