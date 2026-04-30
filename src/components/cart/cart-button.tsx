import { component$, useContext } from '@builder.io/qwik';
import { LuShoppingCart } from '@qwikest/icons/lucide';
import { CartContext, useCartActions } from '~/context/cart';

export const CartButton = component$(() => {
  const state = useContext(CartContext);
  const { toggleCart } = useCartActions();

  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <button
      onClick$={toggleCart}
      class="relative p-2 text-slate-600 hover:text-orange-600 transition-colors group focus:outline-none"
      aria-label="Ver carrito"
    >
      <LuShoppingCart class="w-6 h-6 xl:w-7 xl:h-7" />
      {totalItems > 0 && (
        <span class="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-1 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-600 rounded-full shadow-sm">
          {totalItems}
        </span>
      )}
    </button>
  );
});
