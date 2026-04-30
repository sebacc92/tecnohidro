import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { type DocumentHead, Form, routeAction$, zod$, z } from '@builder.io/qwik-city';
import { LuMapPin, LuPhone, LuMail, LuFacebook, LuInstagram, LuLinkedin, LuSend, LuCheckCircle } from '@qwikest/icons/lucide';
import { buttonVariants } from '../../components/ui/button/button';

declare global {
  interface Window {
    turnstile: any;
  }
}

export const useSendContactEmail = routeAction$(async (datos, requestEvent) => {
  const { env, fail, request } = requestEvent;
  const token = (datos as any)['cf-turnstile-response'];

  if (!token) {
    return fail(400, { message: 'Por favor, completa la verificación de seguridad.' });
  }

  const secretKey = env.get('TURNSTILE_SECRET_KEY');
  if (!secretKey) {
    console.error('Falta TURNSTILE_SECRET_KEY en .env.local');
    return fail(500, { message: 'Error de configuración del servidor' });
  }

  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip');
  if (ip) formData.append('remoteip', ip);

  const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const verifyResult = await verifyResponse.json();
  if (!verifyResult.success) {
    console.error('Turnstile verification failed:', verifyResult);
    return fail(400, { message: 'Verificación de seguridad fallida. Intenta nuevamente.' });
  }

  const apiKey = env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.error('Falta la API Key de Resend en .env.local');
    return fail(500, { message: 'Error de configuración del servidor' });
  }

  const targetEmail = env.get('CONTACT_EMAIL') || 'info@tecnohidro.com.ar';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: targetEmail,
        subject: `Nuevo contacto web de: ${datos.name} - ${datos.subject}`,
        html: `
          <h1>Nuevo mensaje desde TECNOHIDRO</h1>
          <p><strong>Nombre:</strong> ${datos.name}</p>
          <p><strong>Email del cliente:</strong> ${datos.email}</p>
          <p><strong>Asunto:</strong> ${datos.subject}</p>
          <p><strong>Mensaje:</strong></p>
          <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc; color: #333;">
            ${String(datos.message).replace(/\n/g, '<br/>')}
          </blockquote>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error Resend API:', errorData);
      return fail(500, { message: 'No se pudo enviar el correo, por favor intenta más tarde.' });
    }

    return { success: true };

  } catch (error) {
    console.error('Error interno conectando a Resend:', error);
    return fail(500, { message: 'Ocurrió un error inesperado.' });
  }
}, zod$({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  subject: z.string().min(2, 'El asunto es requerido'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  'cf-turnstile-response': z.string().optional()
}));

export default component$(() => {
  const action = useSendContactEmail();
  const containerRef = useSignal<HTMLElement>();
  const turnstileToken = useSignal("");

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => containerRef.value);

    if (typeof window === "undefined" || !containerRef.value) return;

    const renderWidget = () => {
      if (window.turnstile) {
        window.turnstile.render(containerRef.value, {
          sitekey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY,
          theme: "light",
          callback: function (token: string) {
            turnstileToken.value = token;
          },
          "expired-callback": function () {
            turnstileToken.value = "";
          },
        });
      }
    };

    if (!document.getElementById("turnstile-script")) {
      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }
  });

  return (
    <div class="bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div class="bg-slate-100 py-16 md:py-24 text-center">
        <div class="container mx-auto px-4">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">Conéctate con nosotros</h1>
          <p class="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Envíanos tu consulta o visítanos en nuestro local.
          </p>
        </div>
      </div>

      <div class="container mx-auto px-4 md:px-8 py-16 -mt-12">
        {/* Form Section */}
        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-12 max-w-4xl mx-auto mb-16 relative z-10">
          <h2 class="text-2xl font-bold text-slate-800 mb-6">Envíanos un mensaje</h2>
          {action.value?.success ? (
            <div class="py-12 flex flex-col items-center justify-center text-center">
              <LuCheckCircle class="w-16 h-16 text-green-500 mb-4" />
              <h3 class="text-2xl font-bold text-slate-800 mb-2">¡Mensaje enviado con éxito!</h3>
              <p class="text-slate-600">
                Gracias por contactarte con Tecnohidro. Nos comunicaremos contigo a la brevedad.
              </p>
            </div>
          ) : (
            <Form action={action} class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label for="name" class="text-sm font-medium text-slate-700">Nombre completo</label>
                  <input type="text" id="name" name="name" class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 outline-none transition-colors" placeholder="Juan Pérez" />
                  {action.value?.fieldErrors?.name && (
                    <p class="mt-1 text-sm text-red-500">{action.value.fieldErrors.name}</p>
                  )}
                </div>
                <div class="space-y-2">
                  <label for="email" class="text-sm font-medium text-slate-700">Correo electrónico</label>
                  <input type="email" id="email" name="email" class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 outline-none transition-colors" placeholder="juan@ejemplo.com" />
                  {action.value?.fieldErrors?.email && (
                    <p class="mt-1 text-sm text-red-500">{action.value.fieldErrors.email}</p>
                  )}
                </div>
              </div>
              <div class="space-y-2">
                <label for="subject" class="text-sm font-medium text-slate-700">Asunto</label>
                <input type="text" id="subject" name="subject" class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 outline-none transition-colors" placeholder="Consulta sobre presupuesto" />
                {action.value?.fieldErrors?.subject && (
                  <p class="mt-1 text-sm text-red-500">{action.value.fieldErrors.subject}</p>
                )}
              </div>
              <div class="space-y-2">
                <label for="message" class="text-sm font-medium text-slate-700">Mensaje</label>
                <textarea id="message" name="message" rows={5} class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 outline-none transition-colors resize-none" placeholder="Escribe tu mensaje aquí..."></textarea>
                {action.value?.fieldErrors?.message && (
                  <p class="mt-1 text-sm text-red-500">{action.value.fieldErrors.message}</p>
                )}
              </div>

              {action.value?.failed && (
                <p class="rounded-md bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-200">
                  {action.value.message}
                </p>
              )}

              <div class="min-h-[65px]">
                <div ref={containerRef}></div>
              </div>
              <input type="hidden" name="cf-turnstile-response" value={turnstileToken.value} />

              <button
                type="submit"
                disabled={action.isRunning || !turnstileToken.value}
                class={buttonVariants({ look: 'primary', size: 'lg', class: 'w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed' })}
              >
                {action.isRunning ? (
                  "Enviando..."
                ) : (
                  <>
                    <LuSend class="w-5 h-5" />
                    Enviar Mensaje
                  </>
                )}
              </button>
            </Form>
          )}
        </div>

        {/* 4 Items Grid */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 max-w-6xl mx-auto">
          {/* Dirección */}
          <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:border-primary-200 hover:shadow-md transition-all">
            <div class="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
              <LuMapPin class="w-7 h-7" />
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">Dirección</h3>
            <p class="text-slate-600 text-sm">Av. 72 e/14 y 15 nº 970<br />B1900 La Plata, Bs. As.</p>
          </div>

          {/* Llámenos */}
          <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:border-primary-200 hover:shadow-md transition-all">
            <div class="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
              <LuPhone class="w-7 h-7" />
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">Llámenos</h3>
            <p class="text-slate-600 text-sm">+54 221 457-1111<br />Lun - Vie: 8:00 a 17:00 hs</p>
          </div>

          {/* Email */}
          <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:border-primary-200 hover:shadow-md transition-all">
            <div class="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
              <LuMail class="w-7 h-7" />
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">Email</h3>
            <p class="text-slate-600 text-sm break-all"><a href="mailto:info@tecnohidro.com.ar" class="hover:text-primary-600 transition-colors">info@tecnohidro.com.ar</a></p>
          </div>

          {/* Redes Sociales */}
          <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:border-primary-200 hover:shadow-md transition-all">
            <div class="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
              <LuFacebook class="w-7 h-7" />
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-4">Redes Sociales</h3>
            <div class="flex gap-4">
              <a href="https://www.facebook.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#1877F2] transition-colors" aria-label="Facebook">
                <LuFacebook class="h-6 w-6" />
              </a>
              <a href="https://www.instagram.com/tecnohidrosa/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#E4405F] transition-colors" aria-label="Instagram">
                <LuInstagram class="h-6 w-6" />
              </a>
              <a href="https://www.linkedin.com/company/tecnohidro-s.a." target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#0A66C2] transition-colors" aria-label="LinkedIn">
                <LuLinkedin class="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Full width map */}
      <div class="w-full h-96 lg:h-[500px] bg-slate-200 relative">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2722.0266475454655!2d-57.93811298941308!3d-34.937988165427605!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95a2e8bc3e04c361%3A0x918b8ee8bd16ee20!2sTECNOHIDRO%20S.A.!5e0!3m2!1ses!2sar!4v1777531221261!5m2!1ses!2sar"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullscreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación Tecnohidro"
          class="absolute inset-0"
        ></iframe>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Contacto - Tecnohidro',
  meta: [
    {
      name: 'description',
      content: 'Contáctate con Tecnohidro. Visítanos en La Plata, llámanos o envíanos un mensaje.',
    },
  ],
};
