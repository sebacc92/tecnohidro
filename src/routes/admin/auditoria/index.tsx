import { component$, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { chatSessions, chatMessages } from '~/db/schema';
import { desc, eq } from 'drizzle-orm';
import { LuMessageSquare, LuClock, LuUser, LuBot } from '@qwikest/icons/lucide';

// Interface for typed data
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

interface ChatSession {
  id: string;
  createdAt: Date;
  lastActive: Date;
  messages: ChatMessage[];
}

export const useAuditLogs = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  
  // Fetch sessions ordered by last active
  const sessionsData = await db.select()
    .from(chatSessions)
    .orderBy(desc(chatSessions.lastActive))
    .limit(50); // limit to last 50 for performance

  // Fetch all messages for these sessions
  const sessionsWithMessages: ChatSession[] = [];

  for (const session of sessionsData) {
    const msgs = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, session.id))
      .orderBy(chatMessages.createdAt);

    sessionsWithMessages.push({
      id: session.id,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      messages: msgs as ChatMessage[],
    });
  }

  return sessionsWithMessages;
});

export default component$(() => {
  const sessions = useAuditLogs();
  const selectedSessionId = useSignal<string | null>(null);

  const selectedSession = sessions.value.find(s => s.id === selectedSessionId.value);

  return (
    <div class="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div class="mb-6 shrink-0">
        <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <LuMessageSquare class="w-8 h-8 text-cyan-600" />
          Auditoría de Chat
        </h1>
        <p class="text-slate-500 mt-1">Historial de conversaciones entre usuarios y el Asistente IA.</p>
      </div>

      <div class="flex-1 flex gap-6 min-h-0">
        {/* Lista de sesiones */}
        <div class="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div class="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
            Últimas 50 sesiones
          </div>
          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.value.length === 0 ? (
              <p class="text-sm text-slate-400 p-4 text-center">No hay conversaciones registradas.</p>
            ) : (
              sessions.value.map((session) => (
                <button
                  key={session.id}
                  onClick$={() => selectedSessionId.value = session.id}
                  class={`w-full text-left p-3 rounded-lg transition-colors border ${
                    selectedSessionId.value === session.id 
                      ? 'bg-cyan-50 border-cyan-200' 
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-mono text-slate-500 truncate w-32">{session.id}</span>
                    <span class="text-[10px] text-slate-400 flex items-center gap-1">
                      <LuClock class="w-3 h-3" />
                      {new Date(session.lastActive).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p class="text-sm text-slate-700 truncate">
                    {session.messages.find(m => m.role === 'user')?.content || 'Sin mensajes de usuario'}
                  </p>
                  <p class="text-[10px] text-slate-400 mt-1">
                    {session.messages.length} mensajes
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detalle de mensajes */}
        <div class="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {selectedSession ? (
            <>
              <div class="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-slate-700">Sesión: {selectedSession.id}</h3>
                  <p class="text-xs text-slate-500">
                    Iniciada: {new Date(selectedSession.createdAt).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
              <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {selectedSession.messages.map((msg, idx) => (
                  <div key={idx} class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div class={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-cyan-600 text-white rounded-br-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}>
                      <div class="flex items-center gap-2 mb-1">
                        {msg.role === 'user' ? <LuUser class="w-4 h-4 opacity-75" /> : <LuBot class="w-4 h-4 text-cyan-600" />}
                        <span class="text-xs font-bold opacity-75 capitalize">
                          {msg.role === 'user' ? 'Usuario' : 'Asistente'}
                        </span>
                        <span class="text-[10px] opacity-50 ml-auto">
                          {new Date(msg.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p class="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div class="flex-1 flex flex-col items-center justify-center text-slate-400">
              <LuMessageSquare class="w-16 h-16 mb-4 opacity-20" />
              <p>Selecciona una sesión para ver la conversación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin - Auditoría Chat',
};
