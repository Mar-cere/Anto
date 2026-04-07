/**
 * Helper: envuelve una promesa con timeout.
 * Nota: si la operación subyacente no soporta abort, esta función solo limita
 * cuánto esperamos (no cancela la ejecución interna).
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} timeoutMs
 * @param {{ label?: string, timeoutError?: Error }} [options]
 * @returns {Promise<T>}
 */
export async function withTimeout(promise, timeoutMs, options = {}) {
  const ms = Number(timeoutMs);
  if (!Number.isFinite(ms) || ms <= 0) {
    return await promise;
  }

  const label = options.label || 'operation';
  const timeoutError =
    options.timeoutError ||
    Object.assign(new Error(`Timeout en ${label} (${ms}ms)`), { code: 'TIMEOUT' });

  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(timeoutError), ms);
        // No mantener vivo el proceso solo por el timer
        timer.unref?.();
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

