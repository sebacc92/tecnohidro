import { component$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { LuMapPin, LuPhone, LuMail, LuFacebook, LuInstagram, LuLinkedin, LuSend } from '@qwikest/icons/lucide';
import { buttonVariants } from '../../components/ui/button/button';

export default component$(() => {
  return (
    <div class="bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div class="bg-primary-900 text-white py-16 md:py-24 text-center">
        <div class="container mx-auto px-4">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Conéctate con nosotros</h1>
          <p class="text-lg md:text-xl text-primary-200 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Envíanos tu consulta o visítanos en nuestro local.
          </p>
        </div>
      </div>

      <div class="container mx-auto px-4 md:px-8 py-16 -mt-12">
        {/* Form Section */}
        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-12 max-w-4xl mx-auto mb-16 relative z-10">
          <h2 class="text-2xl font-bold text-slate-800 mb-6">Envíanos un mensaje</h2>
          <form class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="name" class="text-sm font-medium text-slate-700">Nombre completo</label>
                <input type="text" id="name" class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 outline-none transition-colors" placeholder="Juan Pérez" />
              </div>
              <div class="space-y-2">
                <label for="email" class="text-sm font-medium text-slate-700">Correo electrónico</label>
                <input type="email" id="email" class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 outline-none transition-colors" placeholder="juan@ejemplo.com" />
              </div>
            </div>
            <div class="space-y-2">
              <label for="subject" class="text-sm font-medium text-slate-700">Asunto</label>
              <input type="text" id="subject" class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 outline-none transition-colors" placeholder="Consulta sobre presupuesto" />
            </div>
            <div class="space-y-2">
              <label for="message" class="text-sm font-medium text-slate-700">Mensaje</label>
              <textarea id="message" rows={5} class="w-full rounded-md border border-slate-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 outline-none transition-colors resize-none" placeholder="Escribe tu mensaje aquí..."></textarea>
            </div>
            <button type="button" class={buttonVariants({ look: 'primary', size: 'lg', class: 'w-full md:w-auto flex items-center justify-center gap-2' })}>
              <LuSend class="w-5 h-5" />
              Enviar Mensaje
            </button>
          </form>
        </div>

        {/* 4 Items Grid */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 max-w-6xl mx-auto">
          {/* Dirección */}
          <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:border-primary-200 hover:shadow-md transition-all">
            <div class="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
              <LuMapPin class="w-7 h-7" />
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">Dirección</h3>
            <p class="text-slate-600 text-sm">Av. 72 e/14 y 15 nº 970<br/>B1900 La Plata, Bs. As.</p>
          </div>

          {/* Llámenos */}
          <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:border-primary-200 hover:shadow-md transition-all">
            <div class="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
              <LuPhone class="w-7 h-7" />
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">Llámenos</h3>
            <p class="text-slate-600 text-sm">+54 221 453-2144<br/>Lun - Vie: 8:00 a 17:00 hs</p>
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
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d26165.862291253154!2d-57.934515!3d-34.938238!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95a2e8be78dbe745%3A0x42a9e3e0e0a5b92c!2sAberturas%20Costa!5e0!3m2!1ses-419!2sus!4v1776987501854!5m2!1ses-419!2sus" 
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
