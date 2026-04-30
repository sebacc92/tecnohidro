import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { users } from '~/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { LuCheckCircle2, LuKeyRound, LuUser } from '@qwikest/icons/lucide';

export const useChangePasswordAction = routeAction$(
  async (data, { env, sharedMap }) => {
    const user = sharedMap.get('user');
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: 'Las nuevas contraseñas no coinciden' };
    }

    const db = getDb(env);

    // Verify current password
    const userRows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const dbUser = userRows[0];

    const isValid = await bcrypt.compare(data.currentPassword, dbUser.password_hash);
    if (!isValid) {
      return { success: false, error: 'La contraseña actual es incorrecta' };
    }

    // Hash new password and save
    const newHash = await bcrypt.hash(data.newPassword, 10);
    await db.update(users).set({ password_hash: newHash }).where(eq(users.id, user.id));

    return { success: true };
  },
  zod$({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
  })
);

export default component$(() => {
  const action = useChangePasswordAction();

  return (
    <div class="max-w-2xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <LuUser class="w-8 h-8 text-orange-600" />
          Mi Perfil
        </h1>
        <p class="text-slate-500 mt-1">Gestiona tu cuenta y cambia tu contraseña.</p>
      </div>

      {action.value?.success && (
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-700">
          <LuCheckCircle2 class="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium">Contraseña actualizada</h3>
            <p class="text-sm opacity-90">Tu contraseña se ha cambiado correctamente. Usa tu nueva contraseña en tu próximo inicio de sesión.</p>
          </div>
        </div>
      )}

      {action.value?.success === false && action.value?.error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {action.value.error}
        </div>
      )}

      <Form action={action} class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 md:p-8 space-y-6">
          <div class="flex items-center gap-2 mb-2">
            <LuKeyRound class="w-5 h-5 text-slate-400" />
            <h2 class="text-lg font-bold text-slate-800">Cambiar Contraseña</h2>
          </div>
          
          <div class="space-y-4">
            <div class="space-y-2">
              <label for="currentPassword" class="text-sm font-bold text-slate-700">Contraseña Actual</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                required
                class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
              />
              {action.value?.fieldErrors?.currentPassword && <p class="text-xs text-red-500">{action.value.fieldErrors.currentPassword}</p>}
            </div>

            <div class="space-y-2">
              <label for="newPassword" class="text-sm font-bold text-slate-700">Nueva Contraseña</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                required
                class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
              />
              {action.value?.fieldErrors?.newPassword && <p class="text-xs text-red-500">{action.value.fieldErrors.newPassword}</p>}
            </div>

            <div class="space-y-2">
              <label for="confirmPassword" class="text-sm font-bold text-slate-700">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
              />
              {action.value?.fieldErrors?.confirmPassword && <p class="text-xs text-red-500">{action.value.fieldErrors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        <div class="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
          <button
            type="submit"
            disabled={action.isRunning}
            class="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {action.isRunning ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </div>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Mi Perfil - Admin',
};
