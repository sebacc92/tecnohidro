import { type RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '../../../db/client';
import { siteContent, categories, chatSessions, chatMessages, products } from '../../../db/schema';
import OpenAI from 'openai';

export const onPost: RequestHandler = async (requestEvent) => {
  try {
    const { request, env, json } = requestEvent;

    const db = getDb(env);
    
    // Fetch site content for settings
    const contentData = await db.select().from(siteContent);
    const contentMap = contentData.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    // Check if chatbot is enabled before processing
    // Default to true if not explicitly disabled
    if (contentMap['ai_enabled'] === 'false') {
      json(403, { error: 'El Chatbot se encuentra deshabilitado actualmente.' });
      return;
    }

    const body = await request.json();
    if (!body || !body.messages) {
      json(400, { error: 'Faltan mensajes en la petición.' });
      return;
    }

    const { messages, sessionId } = body;

    if (sessionId) {
      await db.insert(chatSessions).values({
        id: sessionId,
        createdAt: new Date(),
        lastActive: new Date()
      }).onConflictDoUpdate({
        target: chatSessions.id,
        set: { lastActive: new Date() }
      });

      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        const idStr = 'msg-' + Date.now().toString() + Math.floor(Math.random() * 1000);
        await db.insert(chatMessages).values({
          id: idStr,
          sessionId: sessionId,
          role: 'user',
          content: lastUserMessage.content,
          createdAt: new Date()
        });
      }
    }

    // Fetch categories and products for context
    const [allCategories, allProducts] = await Promise.all([
      db.select().from(categories),
      db.select().from(products)
    ]);
    const categoryNames = allCategories.map((c) => c.name).join(', ');
    const catalogoDetallado = allProducts.map(p => `- ${p.name} (Categoría ID: ${p.category_id || 'N/A'}) - Estado: ${p.status}`).join('\n');

    const whatsappNumber = contentMap['whatsapp_number'] || '+5492214636161';
    const aiKnowledge = contentMap['ai_knowledge'] || 'Ofrecemos la mejor calidad en insumos de infraestructura y domiciliarios.';
    const aiCallToAction = contentMap['ai_call_to_action'] || 'Para cotizaciones exactas y compras mayoristas, por favor contactá a nuestro asesor vía WhatsApp:';
    const aiTone = contentMap['ai_tone'] || 'Profesional, técnico, amigable y directo.';

    // System prompt tailored for Tecnohidro
    const systemPrompt = `Eres el Asistente Técnico y Comercial de Tecnohidro. Tu propósito único y exclusivo es asesorar a clientes, profesionales (arquitectos, plomeros, ingenieros) y empresas sobre insumos de agua, gas, cloacas y herramientas.

CONOCIMIENTO INSTITUCIONAL:
- Identidad: Distribuidora líder de insumos para obras de agua, gas y cloacas.
- Especialización: Línea Infraestructura, Línea Domiciliaria y Herramientas profesionales.
- Logística: Proveemos a instaladores, consorcios y particulares. 
- Marcas principales con las que trabajamos: Genebre, Tigre, JuntaMas, Latyn, Pluvius, Wavin, Saladillo, Waterplast, Bosch, Irimo, Barovo, Kushiro.

DATOS EN TIEMPO REAL:
- WhatsApp de Contacto: ${whatsappNumber}
- Categorías Activas: ${categoryNames}
- Novedades/Info Adicional: "${aiKnowledge}"

Especificaciones del Catálogo (Muestra representativa):
${catalogoDetallado}

REGLAS DE COMPORTAMIENTO (CRÍTICAS):
1. RESTRICCIÓN DE DOMINIO: Si el usuario pregunta sobre cualquier tema que no esté relacionado con Tecnohidro, construcción, plomería, gas, cloacas o herramientas, responde: "Lo siento, como asistente de Tecnohidro solo puedo ayudarte con consultas relacionadas a insumos de obra y herramientas. ¿En qué material estás interesado hoy?"
2. REGLA DE ORO (PRECIOS Y COTIZACIONES): Ante preguntas sobre precios exactos, cotizaciones de planos o stock específico en grandes cantidades, di: "${aiCallToAction} ${whatsappNumber}". Puedes dar precios aproximados solo si figuran en tu conocimiento, pero siempre deriva la venta final al WhatsApp.
3. CUALIFICACIÓN: Intenta detectar si el cliente es instalador, arquitecto o particular para adaptar tu respuesta técnica.
4. TONO: ${aiTone} Responde en párrafos cortos, claro y resolutivo. Usa términos técnicos correctos (ej: termofusión, epoxi, sigas, pvc).`;

    const openaiApiKey = env.get('OPENAI_API_KEY') || (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : '');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY no está configurada.');
      json(500, { error: 'API Key de OpenAI no configurada.' });
      return;
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }))
    ];

    let replyText = '';
    const fallbackMessage = `Ups, en este momento tengo muchas consultas simultáneas. 😅 Por favor, para darte una atención rápida, escribinos directamente a nuestro WhatsApp oficial: ${whatsappNumber}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: openAiMessages as any,
          max_tokens: 500,
          temperature: 0.3,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      replyText = response.choices[0]?.message?.content || '';

      if (!replyText) {
        console.error('OpenAI validación fallida: respuesta vacía');
        replyText = fallbackMessage;
      }
    } catch (openaiErr: any) {
      console.error('Error procesando respuesta o timeout de OpenAI:', openaiErr);
      replyText = fallbackMessage;
    }

    if (sessionId) {
      const idStr = 'msg-' + Date.now().toString() + Math.floor(Math.random() * 1000);
      await db.insert(chatMessages).values({
        id: idStr,
        sessionId: sessionId,
        role: 'assistant',
        content: replyText,
        createdAt: new Date()
      });
    }

    json(200, { reply: { role: 'assistant', content: replyText } });
  } catch (err: any) {
    console.error('Chatbot error:', err);
    requestEvent.json(500, { error: err.message || 'Error inesperado del servidor.' });
  }
};
