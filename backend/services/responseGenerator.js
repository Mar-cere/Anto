/**
 * Generador de Respuestas - Gestiona respuestas de respaldo (fallback) para diferentes contextos
 */
class ResponseGenerator {
  constructor() {
    // Constantes de tipos de respuesta
    this.TYPE_GENERAL = 'general';
    this.TYPE_ERROR = 'error';
    this.TYPE_EMOTIONAL = 'emotional';
    
    // Patrón para detectar contenido emocional en mensajes
    this.EMOTIONAL_PATTERN = /(?:triste|feliz|enojad[oa]|ansios[oa]|preocupad[oa]|mal|bien)/i;
    
    // Respuestas de respaldo por tipo
    this.fallbackResponses = {
      [this.TYPE_GENERAL]: [
        "Entiendo lo que me dices. ¿Podrías darme más detalles para ayudarte mejor?",
        "Me gustaría entender mejor tu situación. ¿Podrías explicarme un poco más?",
        "Gracias por compartir eso conmigo. ¿Qué te gustaría explorar sobre este tema?"
      ],
      [this.TYPE_ERROR]: [
        "Disculpa, tuve un pequeño inconveniente. ¿Podrías reformular tu mensaje?",
        "Lo siento, necesito un momento para procesar mejor. ¿Podrías expresarlo de otra manera?",
        "Perdón por la confusión. ¿Podrías ayudarme a entender mejor compartiendo más detalles?"
      ],
      [this.TYPE_EMOTIONAL]: [
        "Veo que esto es importante para ti. ¿Te gustaría contarme más sobre cómo te hace sentir?",
        "Entiendo que esta situación te afecta. ¿Qué necesitas en este momento?",
        "Estoy aquí para escucharte. ¿Cómo podría ayudarte mejor con esto?"
      ]
    };
  }
  
  // Helper: obtener respuesta de error por defecto
  getDefaultErrorResponse() {
    return this.fallbackResponses[this.TYPE_ERROR][0];
  }
  
  // Helper: validar que el tipo de respuesta es válido
  isValidType(type) {
    return type && typeof type === 'string' && this.fallbackResponses[type];
  }
  
  // Helper: detectar si el contenido tiene carga emocional
  hasEmotionalContent(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }
    return this.EMOTIONAL_PATTERN.test(content);
  }
  
  // Helper: obtener respuesta aleatoria de un array
  getRandomResponse(responses) {
    if (!Array.isArray(responses) || responses.length === 0) {
      return this.getDefaultErrorResponse();
    }
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Genera una respuesta de respaldo según el contexto y tipo
   * @param {Object} context - Contexto del mensaje o usuario
   * @param {string} type - Tipo de respuesta ('general', 'error', 'emotional')
   * @returns {Promise<string>} Respuesta generada aleatoriamente del tipo especificado
   */
  async generateResponse(context, type = this.TYPE_GENERAL) {
    try {
      // Validar y normalizar tipo de respuesta
      const responseType = this.isValidType(type) ? type : this.TYPE_GENERAL;
      const responses = this.fallbackResponses[responseType];
      
      return this.getRandomResponse(responses);
    } catch (error) {
      console.error('[ResponseGenerator] Error generando respuesta:', error, { context, type });
      return this.getDefaultErrorResponse();
    }
  }

  /**
   * Genera una respuesta de respaldo basada en el contenido del mensaje
   * Detecta automáticamente si el mensaje tiene contenido emocional
   * @param {Object} mensaje - Mensaje recibido (debe tener propiedad 'content')
   * @returns {Promise<string>} Respuesta generada según el tipo detectado
   */
  async generateFallbackResponse(mensaje) {
    try {
      // Validar que el mensaje tiene contenido válido
      if (!mensaje || typeof mensaje.content !== 'string') {
        return this.getDefaultErrorResponse();
      }
      
      // Detectar tipo de respuesta según contenido emocional
      const tieneContenidoEmocional = this.hasEmotionalContent(mensaje.content);
      const responseType = tieneContenidoEmocional ? this.TYPE_EMOTIONAL : this.TYPE_GENERAL;
      
      return await this.generateResponse(mensaje, responseType);
    } catch (error) {
      console.error('[ResponseGenerator] Error generando respuesta fallback:', error, mensaje);
      return this.getDefaultErrorResponse();
    }
  }
}

export default new ResponseGenerator(); 