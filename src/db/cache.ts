/**
 * Caché en memoria del módulo, con TTL.
 *
 * En Vercel Edge las variables de módulo sobreviven entre invocaciones mientras
 * el isolate siga vivo, así que esto evita repetir consultas a Turso en ráfagas
 * de tráfico. Es best-effort: si el isolate se recicla, se vuelve a consultar.
 * No sirve para datos que deban ser exactos al instante.
 */
type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

/**
 * Devuelve el valor cacheado bajo `key`, o ejecuta `load()` y lo cachea por
 * `ttlMs`. Las llamadas concurrentes con la misma clave comparten una sola
 * ejecución de `load()` porque se cachea la promesa, no el resultado.
 */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<Promise<T>> | undefined;
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value;
  }

  const promise = load().catch((err) => {
    // Un fallo no debe quedar cacheado: se descarta para reintentar en la próxima.
    store.delete(key);
    throw err;
  });

  store.set(key, { value: promise, expiresAt: Date.now() + ttlMs });
  return promise;
}

/** Invalida una clave puntual, o todo el caché si no se pasa ninguna. */
export function invalidate(key?: string) {
  if (key) store.delete(key);
  else store.clear();
}
