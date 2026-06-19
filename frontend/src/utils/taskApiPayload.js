/**
 * Normaliza el cuerpo de respuesta del API de tareas.
 */
export function resolveCreatedTaskFromApi(response) {
  if (!response || typeof response !== 'object') return null;
  const payload = response.data ?? response;
  if (payload && typeof payload === 'object' && payload._id) return payload;
  if (payload?.data && typeof payload.data === 'object' && payload.data._id) {
    return payload.data;
  }
  return null;
}
