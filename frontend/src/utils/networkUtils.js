import { API_URL } from '../config/api';

// Constantes de configuración
const MAX_RETRIES = 3;
const MAX_BACKOFF_TIME = 8000; // 8 segundos máximo
const BACKOFF_BASE = 2; // Base para el backoff exponencial

// Helper: esperar un tiempo determinado
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: calcular tiempo de espera exponencial
const calculateBackoffTime = (attempt) => {
  return Math.min(1000 * Math.pow(BACKOFF_BASE, attempt), MAX_BACKOFF_TIME);
};

/**
 * Verifica el estado del servidor con reintentos y backoff exponencial
 * 
 * @param {number} maxRetries - Número máximo de intentos (default: 3)
 * @returns {Promise<boolean>} true si el servidor responde, false en caso contrario
 */
const checkServerStatus = async (maxRetries = MAX_RETRIES) => {
  console.log(`Verificando servidor en: ${API_URL}`);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt + 1} de ${maxRetries} para verificar el servidor...`);
      
      // Tiempo de espera exponencial: 2^attempt segundos (2, 4, 8 segundos)
      if (attempt > 0) {
        const backoffTime = calculateBackoffTime(attempt);
        console.log(`Esperando ${backoffTime/1000} segundos antes del siguiente intento...`);
        await wait(backoffTime);
      }

      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Servidor respondió exitosamente:', data);
        return true;
      } else {
        console.log(`⚠️ Servidor respondió con status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Intento ${attempt + 1} falló:`, error.message);
      
      // Si es el último intento, informamos del fallo
      if (attempt === maxRetries - 1) {
        console.error(`❌ No se pudo establecer conexión con el servidor después de ${maxRetries} intentos`);
        console.error(`💡 Verifica que el servidor esté corriendo en: ${API_URL}`);
        return false;
      }
    }
  }
  return false;
};

export { checkServerStatus }; 