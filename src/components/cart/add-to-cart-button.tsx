import { component$, useContext } from '@builder.io/qwik';
import { LuShoppingCart, LuCheck } from '@qwikest/icons/lucide';
import { CartContext, useCartActions, type CartItem } from '~/context/cart';

interface AddToCartButtonProps {
  product: Omit<CartItem, 'quantity'>;
  class?: string;
}

export const AddToCartButton = component$<AddToCartButtonProps>(({ product, ...props }) => {
  const state = useContext(CartContext);
  const { addItem } = useCartActions();

  const inCart = state.items.some(i => i.id === product.id);

  return (
    <button
      onClick$={() => addItem(product, 1)}
      class={`flex items-center justify-center gap-2 px-4 py-2 font-bold rounded-lg transition-all ${
        inCart 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
          : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow-md hover:-translate-y-0.5'
      } ${props.class || ''}`}
    >
      {inCart ? (
        <>
          <LuCheck class="w-4 h-4" />
          <span>En el carrito</span>
        </>
      ) : (
        <>
          <LuShoppingCart class="w-4 h-4" />
          <span>Agregar al Carrito</span>
        </>
      )}
    </button>
  );
});
