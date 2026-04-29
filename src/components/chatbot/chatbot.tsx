import { component$, useStore, $, useVisibleTask$, useSignal } from '@builder.io/qwik';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const Chatbot = component$(() => {
  const state = useStore({
    isOpen: false,
    isLoading: false,
    messages: [
      {
        role: 'assistant',
        content: '¡Hola! Soy el asistente virtual de Tecnohidro. ¿En qué te puedo ayudar con insumos de agua, gas y cloacas?',
      },
    ] as Message[],
    sessionId: '',
  });

  const inputValue = useSignal('');
  const messagesContainerRef = useSignal<HTMLDivElement>();

  // Initialize session
  useVisibleTask$(() => {
    let sId = sessionStorage.getItem('chatbot_session_id');
    if (!sId) {
      sId = 'sess-' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('chatbot_session_id', sId);
    }
    state.sessionId = sId;
  });

  // Scroll to bottom when messages update
  useVisibleTask$(({ track }) => {
    track(() => state.messages.length);
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
    }
  });

  const sendMessage = $(async () => {
    if (!inputValue.value.trim() || state.isLoading) return;

    const userMsg = inputValue.value.trim();
    inputValue.value = '';

    // Add user message to state
    state.messages.push({ role: 'user', content: userMsg });
    state.isLoading = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: state.messages.filter(m => m.role !== 'system').slice(-5),
          sessionId: state.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la conexión');
      }

      const data = await response.json();
      
      if (data.reply) {
        state.messages.push(data.reply);
      } else {
        state.messages.push({
          role: 'assistant',
          content: 'Ocurrió un error al procesar tu solicitud, intenta nuevamente.',
        });
      }
    } catch (error) {
      console.error('Error de red en chat:', error);
      state.messages.push({
        role: 'assistant',
        content: 'Lo lamento, no pude contactar al servidor. Revisa tu conexión o intenta más tarde.',
      });
    } finally {
      state.isLoading = false;
    }
  });

  return (
    <>
      {!state.isOpen && (
        <span class="fixed z-30 w-14 h-14 bottom-6 right-6 bg-primary-500/40 rounded-full animate-pulse shadow-[0_0_15px_rgba(234,88,12,0.6)] opacity-75 pointer-events-none sm:h-16 sm:w-16"></span>
      )}
      <button
        onClick$={() => (state.isOpen = !state.isOpen)}
        class={[
          "fixed z-40 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center border border-slate-200 cursor-pointer",
          state.isOpen ? "bg-slate-900 text-white w-12 h-12 bottom-6 right-6 sm:h-14 sm:w-14" : "bg-white text-orange-600 w-14 h-14 bottom-6 right-6 sm:h-16 sm:w-16" 
        ]}
        aria-label="Abrir asistente virtual"
      >
        {state.isOpen ? (
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
             <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
           </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0-4.43 3.65-8.08 8.08-8.08h3.33c4.43 0 8.08 3.65 8.08 8.08s-3.65 8.08-8.08 8.08H7.5A5.25 5.25 0 012.25 15.6zm10.74-2.5h.01M9.75 10.25h.01M14.25 10.25h.01" />
          </svg>
        )}
      </button>

      {state.isOpen && (
        <div class="fixed z-50 bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 h-[28rem] bg-slate-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div class="bg-slate-900 text-white p-4 flex items-center gap-3">
             <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
             <div>
               <h3 class="font-semibold text-sm">Asistente Tecnohidro</h3>
               <p class="text-[10px] text-slate-300">Soporte Técnico & Ventas</p>
             </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={messagesContainerRef}
            class="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-50"
          >
            {state.messages.map((msg, i) => (
              <div 
                key={i} 
                class={["flex", msg.role === 'user' ? "justify-end" : "justify-start"]}
              >
                <div 
                  class={[
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary-600 text-white rounded-br-none" 
                      : "bg-white border border-slate-100 text-slate-800 rounded-bl-none"
                  ]}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {state.isLoading && (
              <div class="flex justify-start">
                <div class="bg-white border border-slate-100 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-1">
                  <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
                  <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div class="p-3 bg-white border-t border-slate-100">
            <form 
              preventdefault:submit
              onSubmit$={sendMessage}
              class="flex gap-2"
            >
              <input
                type="text"
                bind:value={inputValue}
                placeholder="Escribe tu consulta..."
                class="flex-1 bg-slate-50 text-sm rounded-full px-4 py-2 border border-slate-200 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors"
                disabled={state.isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.value.trim() || state.isLoading}
                class="bg-slate-900 text-white p-2 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-colors hover:bg-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 translate-x-0.5">
                  <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                </svg>
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
});
