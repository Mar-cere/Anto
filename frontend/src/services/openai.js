// IA en frontend deshabilitada:
// Todas las llamadas de IA deben pasar por backend para evitar exponer llaves/proveedores.
export const OPENAI_API_KEY = '';
// Mantener un default válido para tests/config, aunque no se use desde el frontend.
export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

