/**
 * Analizador de Contexto - Detecta intención, tema y urgencia en mensajes del usuario
 */
import { PATRONES_INTENCION, PATRONES_TEMA } from '../config/patrones.js';

class ContextAnalyzer {
  constructor() {
    // Patrones de detección
    this.intenciones = PATRONES_INTENCION;
    this.temas = PATRONES_TEMA;
    
    // Valores por defecto para análisis
    this.defaultValues = {
      intencion: {
        tipo: 'CONVERSACION_GENERAL',
        confianza: 0.5,
        requiereSeguimiento: false
      },
      tema: {
        categoria: 'GENERAL',
        subtema: null,
        confianza: 0.5
      }
    };
    
    // Constantes de configuración
    this.CONFIANZA_DETECCION = 0.8;
    this.CONFIANZA_DEFAULT = 0.5;
    this.URGENCIA_NORMAL = 'NORMAL';
    this.URGENCIA_ALTA = 'ALTA';
    this.FASE_CONVERSACION_INICIAL = 'INICIAL';
    this.INTENCIONES_SEGUIMIENTO = ['CRISIS', 'AYUDA_EMOCIONAL'];
    this.PATRONES_URGENCIA = ['urgente', 'emergencia', 'crisis', 'ayuda.*ahora', 'grave'];
  }
  
  // Helper: validar que el contenido es un string válido
  isValidString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }
  
  // Helper: validar que el mensaje tiene contenido válido
  isValidMessage(mensaje) {
    return mensaje && this.isValidString(mensaje.content);
  }
  
  // Helper: buscar patrón en contenido (case-insensitive)
  matchesPattern(contenido, patrones) {
    if (!Array.isArray(patrones) || !this.isValidString(contenido)) {
      return false;
    }
    return patrones.some(patron => new RegExp(patron, 'i').test(contenido));
  }
  
  // Helper: detectar patrón en diccionario de patrones
  detectarPatron(contenido, diccionarioPatrones) {
    if (!this.isValidString(contenido)) {
      return null;
    }
    
    try {
      for (const [clave, patrones] of Object.entries(diccionarioPatrones)) {
        if (this.matchesPattern(contenido, patrones)) {
          return clave;
        }
      }
    } catch (error) {
      console.error('[ContextAnalyzer] Error en detección de patrón:', error, contenido);
    }
    
    return null;
  }

  /**
   * Analiza el mensaje para detectar intención, tema y urgencia
   * @param {Object} mensaje - El mensaje a analizar (debe tener propiedad 'content')
   * @returns {Object} Análisis del mensaje con intención, tema, urgencia y contexto
   */
  async analizarMensaje(mensaje) {
    if (!this.isValidMessage(mensaje)) {
      console.warn('[ContextAnalyzer] Mensaje inválido:', mensaje);
      return this.getAnalisisDefault();
    }
    
    try {
      const contenidoActual = this.analizarContenidoActual(mensaje);
      return {
        intencion: contenidoActual.intencion,
        tema: contenidoActual.tema,
        urgencia: contenidoActual.urgencia || this.URGENCIA_NORMAL,
        contexto: {
          faseConversacion: this.FASE_CONVERSACION_INICIAL,
          temasRecurrentes: [],
          patronesIdentificados: []
        },
        sugerencias: []
      };
    } catch (error) {
      console.error('[ContextAnalyzer] Error en análisis de mensaje:', error, mensaje);
      return this.getAnalisisDefault();
    }
  }

  /**
   * Analiza el contenido actual del mensaje
   * @param {Object} mensaje - El mensaje a analizar
   * @returns {Object} Intención, tema y urgencia detectados
   */
  analizarContenidoActual(mensaje) {
    if (!this.isValidMessage(mensaje)) {
      console.warn('[ContextAnalyzer] Mensaje inválido en analizarContenidoActual:', mensaje);
      return {
        intencion: this.defaultValues.intencion,
        tema: this.defaultValues.tema,
        urgencia: this.URGENCIA_NORMAL
      };
    }
    
    const contenido = mensaje.content.toLowerCase();
    return {
      intencion: this.detectarIntencion(contenido),
      tema: this.detectarTema(contenido),
      urgencia: this.evaluarUrgencia(contenido)
    };
  }

  /**
   * Detecta la intención principal del mensaje
   * @param {string} contenido - Contenido del mensaje en minúsculas
   * @returns {Object} Intención detectada con tipo, confianza y si requiere seguimiento
   */
  detectarIntencion(contenido) {
    const tipo = this.detectarPatron(contenido, this.intenciones);
    
    if (tipo) {
      return {
        tipo,
        confianza: this.CONFIANZA_DETECCION,
        requiereSeguimiento: this.INTENCIONES_SEGUIMIENTO.includes(tipo)
      };
    }
    
    return this.defaultValues.intencion;
  }

  /**
   * Detecta el tema principal del mensaje
   * @param {string} contenido - Contenido del mensaje en minúsculas
   * @returns {Object} Tema detectado con categoría y confianza
   */
  detectarTema(contenido) {
    const categoria = this.detectarPatron(contenido, this.temas);
    
    if (categoria) {
      return {
        categoria,
        subtema: null,
        confianza: this.CONFIANZA_DETECCION
      };
    }
    
    return this.defaultValues.tema;
  }

  /**
   * Evalúa la urgencia del mensaje
   * @param {string} contenido - Contenido del mensaje en minúsculas
   * @returns {string} Nivel de urgencia (ALTA o NORMAL)
   */
  evaluarUrgencia(contenido) {
    if (!this.isValidString(contenido)) {
      return this.URGENCIA_NORMAL;
    }
    
    return this.matchesPattern(contenido, this.PATRONES_URGENCIA)
      ? this.URGENCIA_ALTA
      : this.URGENCIA_NORMAL;
  }

  /**
   * Devuelve un análisis por defecto cuando no se puede analizar el mensaje
   * @returns {Object} Análisis por defecto con valores seguros
   */
  getAnalisisDefault() {
    return {
      intencion: this.defaultValues.intencion,
      tema: this.defaultValues.tema,
      urgencia: this.URGENCIA_NORMAL,
      contexto: {
        faseConversacion: this.FASE_CONVERSACION_INICIAL,
        temasRecurrentes: [],
        patronesIdentificados: []
      },
      sugerencias: []
    };
  }
}

export default new ContextAnalyzer(); 