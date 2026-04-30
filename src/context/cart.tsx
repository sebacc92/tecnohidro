import { createContextId, component$, Slot, useContextProvider, useStore, useVisibleTask$, $, useContext } from '@builder.io/qwik';

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number | null;
  image: string | null;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export const CartContext = createContextId<CartState>('tecnohidro-cart-context');

export const CartProvider = component$(() => {
  const state = useStore<CartState>({
    items: [],
    isOpen: false,
  });

  // Load from local storage on mount
  useVisibleTask$(() => {
    const savedCart = localStorage.getItem('tecnohidro_cart');
    if (savedCart) {
      try {
        state.items = JSON.parse(savedCart);
      } catch (e) {
        console.error('Error parsing cart from local storage', e);
      }
    }
  });

  // Save to local storage whenever items change
  useVisibleTask$(({ track }) => {
    track(() => state.items.length);
    // Track quantities deep change
    const quantities = state.items.map(i => i.quantity).join(',');
    track(() => quantities);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('tecnohidro_cart', JSON.stringify(state.items));
    }
  });

  useContextProvider(CartContext, state);

  return <Slot />;
});

// Helper actions
export const useCartActions = () => {
  const state = useContext(CartContext);

  const addItem = $((item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const existingIndex = state.items.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      // Create a new array to trigger reactivity for nested objects if needed, 
      // though mutating deep is supported by useStore
      state.items[existingIndex].quantity += quantity;
      state.items = [...state.items]; // Force update just in case
    } else {
      state.items.push({ ...item, quantity });
    }
    state.isOpen = true; // Open drawer when item added
  });

  const removeItem = $((id: string) => {
    state.items = state.items.filter((i) => i.id !== id);
  });

  const updateQuantity = $((id: string, quantity: number) => {
    const itemIndex = state.items.findIndex((i) => i.id === id);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        removeItem(id);
      } else {
        state.items[itemIndex].quantity = quantity;
        state.items = [...state.items]; // Force update
      }
    }
  });

  const clearCart = $(() => {
    state.items = [];
  });

  const toggleCart = $(() => {
    state.isOpen = !state.isOpen;
  });

  return { addItem, removeItem, updateQuantity, clearCart, toggleCart };
};
