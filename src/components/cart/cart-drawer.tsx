import { component$, useContext, $ } from '@builder.io/qwik';
import { LuX, LuTrash2, LuMinus, LuPlus, LuMessageCircle, LuShoppingCart } from '@qwikest/icons/lucide';
import { CartContext, useCartActions } from '~/context/cart';

export const CartDrawer = component$((props: { whatsappNumber: string }) => {
  const state = useContext(CartContext);
  const { toggleCart, updateQuantity, removeItem, clearCart } = useCartActions();

  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
  
  const handleCheckout = $(() => {
    if (state.items.length === 0) return;

    let message = `¡Hola Tecnohidro! Quiero confirmar el siguiente pedido:\n\n`;
    
    let total = 0;
    state.items.forEach(item => {
      const priceText = item.price ? ` ($${item.price.toLocaleString('es-AR')})` : '';
      const skuText = item.sku ? `[SKU: ${item.sku}] ` : '';
      message += `- ${item.quantity}x ${skuText}${item.name}${priceText}\n`;
      if (item.price) {
        total += item.price * item.quantity;
      }
    });

    if (total > 0) {
      message += `\n*Total estimado: $${total.toLocaleString('es-AR')}*`;
    }
    
    message += `\n\nPor favor, confirmarme disponibilidad y pasos a seguir. ¡Gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${props.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  });

  if (!state.isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] transition-opacity"
        onClick$={toggleCart}
      />
      
      {/* Drawer */}
      <div class="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
            Tu Carrito
            <span class="bg-orange-100 text-orange-600 text-xs py-0.5 px-2 rounded-full">{totalItems}</span>
          </h2>
          <button 
            onClick$={toggleCart}
            class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <LuX class="w-6 h-6" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          {state.items.length === 0 ? (
            <div class="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
              <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <LuShoppingCart class="w-10 h-10" />
              </div>
              <div>
                <p class="text-lg font-bold text-slate-700">El carrito está vacío</p>
                <p class="text-sm text-slate-500 max-w-[200px] mt-1 mx-auto">Explora nuestro catálogo y agrega productos para cotizar.</p>
              </div>
            </div>
          ) : (
            <div class="space-y-6">
              {state.items.map(item => (
                <div key={item.id} class="flex gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                  <div class="w-20 h-20 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    {item.image ? (
                      <img src={item.image} alt={item.name} class="w-full h-full object-cover" />
                    ) : (
                      <div class="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium">Sin foto</div>
                    )}
                  </div>
                  
                  <div class="flex-1 min-w-0 flex flex-col">
                    <div class="flex justify-between items-start gap-2">
                      <h3 class="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{item.name}</h3>
                      <button onClick$={() => removeItem(item.id)} class="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1">
                        <LuTrash2 class="w-4 h-4" />
                      </button>
                    </div>
                    {item.sku && <p class="text-[10px] text-slate-400 mt-1 uppercase font-mono">SKU: {item.sku}</p>}
                    
                    <div class="mt-auto flex items-center justify-between pt-2">
                      <div class="flex items-center border border-slate-200 rounded-md bg-slate-50">
                        <button 
                          onClick$={() => updateQuantity(item.id, item.quantity - 1)}
                          class="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-200 transition-colors rounded-l-md"
                        >
                          <LuMinus class="w-3 h-3" />
                        </button>
                        <span class="w-8 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                        <button 
                          onClick$={() => updateQuantity(item.id, item.quantity + 1)}
                          class="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-200 transition-colors rounded-r-md"
                        >
                          <LuPlus class="w-3 h-3" />
                        </button>
                      </div>
                      
                      {item.price ? (
                        <span class="font-bold text-slate-900 text-sm">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                      ) : (
                        <span class="text-[10px] font-medium text-slate-400 italic">A cotizar</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {state.items.length > 0 && (
          <div class="border-t border-slate-100 p-6 bg-slate-50">
            <div class="flex justify-between items-center mb-4">
               <span class="text-slate-600 text-sm">Total estimado</span>
               <span class="text-2xl font-extrabold text-slate-900">
                 ${state.items.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0).toLocaleString('es-AR')}
               </span>
            </div>
            <p class="text-[10px] text-slate-500 mb-6 leading-tight">
              Los precios son estimativos. La confirmación final del stock y cotización se realizará vía WhatsApp con un asesor.
            </p>
            <button 
              onClick$={handleCheckout}
              class="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <LuMessageCircle class="w-5 h-5" />
              Confirmar por WhatsApp
            </button>
            <button 
              onClick$={clearCart}
              class="w-full mt-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
});
