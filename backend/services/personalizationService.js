/**
 * Servicio de Personalización - Gestiona preferencias, patrones y estilos de comunicación del usuario
 */
import mongoose from 'mongoose';
import UserProfile from '../models/UserProfile.js';

// Constantes de configuración
const COMMUNICATION_STYLE_NEUTRAL = 'neutral';
const RESPONSE_LENGTH_MEDIUM = 'MEDIUM';
const RESPONSE_LENGTH_MEDIA = 'MEDIA';
const EMOTION_NEUTRAL = 'neutral';
const DEFAULT_STYLE_BASE = 'EMPATICO';
const DEFAULT_GREETING = 'Hola';
const DEFAULT_TONE = 'neutral';
const DEFAULT_STRUCTURE = 'flexible';
const DEFAULT_PERIOD = 'tarde';
const PATTERNS_LIMIT = 10;

// Períodos del día
const PERIODOS = {
  MADRUGADA: { inicio: 0, fin: 5, nombre: 'madrugada' },
  MAÑANA: { inicio: 6, fin: 11, nombre: 'mañana' },
  MEDIODIA: { inicio: 12, fin: 14, nombre: 'mediodía' },
  TARDE: { inicio: 15, fin: 18, nombre: 'tarde' },
  NOCHE: { inicio: 19, fin: 23, nombre: 'noche' }
};

const ESTILOS_COMUNICACION = {
  EMPATICO: {
    tono: 'cálido',
    validación: true,
    reflexivo: true,
    estructurado: false
  },
  DIRECTO: {
    tono: 'claro',
    validación: false,
    reflexivo: false,
    estructurado: true
  },
  EXPLORATORIO: {
    tono: 'curioso',
    validación: true,
    reflexivo: true,
    estructurado: false
  },
  ESTRUCTURADO: {
    tono: 'organizado',
    validación: false,
    reflexivo: true,
    estructurado: true
  }
};

class PersonalizationService {
  constructor() {
    // Constantes de configuración
    this.COMMUNICATION_STYLE_NEUTRAL = COMMUNICATION_STYLE_NEUTRAL;
    this.RESPONSE_LENGTH_MEDIUM = RESPONSE_LENGTH_MEDIUM;
    this.EMOTION_NEUTRAL = EMOTION_NEUTRAL;
  }
  
  // Helper: validar que el userId es válido
  isValidUserId(userId) {
    return userId && (
      typeof userId === 'string' || 
      userId instanceof mongoose.Types.ObjectId ||
      mongoose.Types.ObjectId.isValid(userId)
    );
  }
  
  // Helper: obtener estructura de perfil por defecto
  getDefaultProfileStructure(userId) {
    return {
      userId,
      preferences: {
        communicationStyle: COMMUNICATION_STYLE_NEUTRAL,
        responseLength: RESPONSE_LENGTH_MEDIUM,
        topicsOfInterest: [],
        triggerTopics: []
      },
      patrones: {
        emocionales: [],
        conexion: [],
        temas: []
      }
    };
  }

  /**
   * Obtiene el perfil de usuario o crea uno por defecto si no existe
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Object>} Perfil de usuario
   */
  async getUserProfile(userId) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      let profile = await UserProfile.findOne({ userId });
      if (!profile) {
        profile = await this.createDefaultProfile(userId);
      }
      
      return profile;
    } catch (error) {
      console.error('[PersonalizationService] Error obteniendo perfil de usuario:', error, { userId });
      return this.getDefaultProfile(userId);
    }
  }

  /**
   * Crea un perfil de usuario por defecto en la base de datos
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Object>} Perfil creado
   */
  async createDefaultProfile(userId) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      // Crear perfil (Mongoose timestamps maneja createdAt y updatedAt automáticamente)
      return await UserProfile.create(this.getDefaultProfileStructure(userId));
    } catch (error) {
      console.error('[PersonalizationService] Error creando perfil por defecto:', error, { userId });
      return this.getDefaultProfile(userId);
    }
  }

  /**
   * Devuelve un perfil por defecto (no persistente) para uso en memoria
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Object} Perfil por defecto
   */
  getDefaultProfile(userId) {
    return this.getDefaultProfileStructure(userId);
  }

  /**
   * Obtiene el prompt personalizado para el usuario
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Object>} Prompt personalizado con estilo, longitud, temas y triggers
   */
  async getPersonalizedPrompt(userId) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      const profile = await this.getUserProfile(userId);
      return {
        style: profile.preferences?.communicationStyle || COMMUNICATION_STYLE_NEUTRAL,
        responseLength: profile.preferences?.responseLength || RESPONSE_LENGTH_MEDIUM,
        topics: profile.preferences?.topicsOfInterest || [],
        triggers: profile.preferences?.triggerTopics || []
      };
    } catch (error) {
      console.error('[PersonalizationService] Error obteniendo prompt personalizado:', error, { userId });
      return {
        style: COMMUNICATION_STYLE_NEUTRAL,
        responseLength: RESPONSE_LENGTH_MEDIUM,
        topics: [],
        triggers: []
      };
    }
  }

  /**
   * Obtiene o crea el perfil del usuario (versión alternativa con estructura diferente)
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Object>} Perfil del usuario
   */
  async getOrCreateProfile(userId) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      let userProfile = await UserProfile.findOne({ userId });
      
      if (!userProfile) {
        userProfile = await UserProfile.create({
          userId,
          preferencias: {
            estiloBase: DEFAULT_STYLE_BASE,
            longitudRespuesta: RESPONSE_LENGTH_MEDIA,
            temas: {
              preferidos: ['general'],
              evitados: []
            },
            adaptabilidad: {
              emocional: true,
              contextual: true,
              temporal: true
            }
          },
          patrones: {
            temporales: {},
            emocionales: {},
            tematicos: {}
          }
        });
      }
      
      return userProfile;
    } catch (error) {
      console.error('[PersonalizationService] Error obteniendo perfil:', error, { userId });
      throw error;
    }
  }

  /**
   * Analiza el período temporal actual del día
   * @returns {Object} Período actual con características
   */
  analizarPeriodoTemporal() {
    const hora = new Date().getHours();
    const periodo = Object.values(PERIODOS).find(
      p => hora >= p.inicio && hora <= p.fin
    ) || PERIODOS.TARDE;

    return {
      ...periodo,
      caracteristicas: this.getCaracteristicasPeriodo(periodo.nombre)
    };
  }

  /**
   * Obtiene las características de un período del día
   * @param {string} nombrePeriodo - Nombre del período (madrugada, mañana, mediodía, tarde, noche)
   * @returns {Object} Características del período (energía, profundidad, longitud ideal, tono preferido)
   */
  getCaracteristicasPeriodo(nombrePeriodo) {
    const caracteristicas = {
      madrugada: {
        energía: 'baja',
        profundidad: 'alta',
        longitudIdeal: 'CORTA',
        tonoPreferido: 'suave'
      },
      mañana: {
        energía: 'alta',
        profundidad: 'media',
        longitudIdeal: 'MEDIA',
        tonoPreferido: 'energético'
      },
      mediodía: {
        energía: 'media',
        profundidad: 'baja',
        longitudIdeal: 'CORTA',
        tonoPreferido: 'práctico'
      },
      tarde: {
        energía: 'media',
        profundidad: 'alta',
        longitudIdeal: 'MEDIA',
        tonoPreferido: 'reflexivo'
      },
      noche: {
        energía: 'baja',
        profundidad: 'alta',
        longitudIdeal: 'MEDIA',
        tonoPreferido: 'tranquilo'
      }
    };

    return caracteristicas[nombrePeriodo] || caracteristicas.tarde;
  }

  /**
   * Analiza los patrones del usuario (emocionales, temporales, temáticos)
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<Object>} Patrones analizados con estilo de comunicación recomendado
   */
  async analizarPatronesUsuario(userProfile) {
    const patrones = {
      emocionales: this.analizarPatronEmocional(userProfile.patrones?.emocionales),
      temporales: this.analizarPatronTemporal(userProfile.patrones?.temporales),
      tematicos: this.analizarPatronTematico(userProfile.patrones?.tematicos)
    };

    return {
      ...patrones,
      estiloComunicacionRecomendado: this.determinarEstiloComunicacion(patrones)
    };
  }

  /**
   * Analiza el patrón emocional del usuario
   * @param {Object} patronesEmocionales - Patrones emocionales del perfil
   * @returns {Object} Análisis del patrón emocional (tendencia, intensidad, estabilidad)
   */
  analizarPatronEmocional(patronesEmocionales) {
    const ultimasEmociones = patronesEmocionales?.ultimas || [];
    const tendenciaEmocional = this.calcularTendenciaEmocional(ultimasEmociones);

    return {
      tendencia: tendenciaEmocional,
      intensidad: this.calcularIntensidadEmocional(ultimasEmociones),
      estabilidad: this.calcularEstabilidadEmocional(ultimasEmociones)
    };
  }

  /**
   * Calcula la tendencia emocional basada en las emociones más frecuentes
   * @param {Array} emociones - Lista de emociones
   * @returns {string} Emoción más frecuente o 'neutral' si no hay emociones
   */
  calcularTendenciaEmocional(emociones) {
    if (!Array.isArray(emociones) || emociones.length === 0) {
      return EMOTION_NEUTRAL;
    }
    
    const frecuencias = emociones.reduce((acc, emocion) => {
      acc[emocion] = (acc[emocion] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(frecuencias)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
  
  /**
   * Calcula la intensidad emocional promedio
   * @param {Array} emociones - Lista de emociones
   * @returns {string} Intensidad ('alta', 'media', 'baja')
   */
  calcularIntensidadEmocional(emociones) {
    if (!Array.isArray(emociones) || emociones.length === 0) {
      return 'media';
    }
    // Implementación simplificada - puede mejorarse con análisis real
    return 'media';
  }
  
  /**
   * Calcula la estabilidad emocional basada en variabilidad
   * @param {Array} emociones - Lista de emociones
   * @returns {string} Estabilidad ('alta', 'media', 'baja')
   */
  calcularEstabilidadEmocional(emociones) {
    if (!Array.isArray(emociones) || emociones.length < 2) {
      return 'media';
    }
    // Implementación simplificada - puede mejorarse con análisis real
    const uniqueEmotions = new Set(emociones).size;
    return uniqueEmotions > emociones.length / 2 ? 'baja' : 'alta';
  }
  
  /**
   * Analiza el patrón temporal del usuario
   * @param {Object} patronesTemporales - Patrones temporales del perfil
   * @returns {Object} Análisis del patrón temporal
   */
  analizarPatronTemporal(patronesTemporales) {
    if (!patronesTemporales || typeof patronesTemporales !== 'object') {
      return { frecuencia: 'media' };
    }
    // Implementación simplificada - puede mejorarse con análisis real
    return { frecuencia: 'media' };
  }
  
  /**
   * Analiza el patrón temático del usuario
   * @param {Object} patronesTematicos - Patrones temáticos del perfil
   * @returns {Object} Análisis del patrón temático
   */
  analizarPatronTematico(patronesTematicos) {
    if (!patronesTematicos || typeof patronesTematicos !== 'object') {
      return { temas: [] };
    }
    // Implementación simplificada - puede mejorarse con análisis real
    return { temas: [] };
  }

  /**
   * Determina el estilo de comunicación recomendado basado en los patrones
   * @param {Object} patrones - Patrones analizados (emocionales, temporales, temáticos)
   * @returns {Object} Estilo de comunicación recomendado
   */
  determinarEstiloComunicacion(patrones) {
    const { emocionales, temporales } = patrones;
    
    if (emocionales?.intensidad === 'alta') {
      return ESTILOS_COMUNICACION.EMPATICO;
    }
    
    if (emocionales?.estabilidad === 'baja') {
      return ESTILOS_COMUNICACION.EXPLORATORIO;
    }
    
    if (temporales?.frecuencia === 'alta') {
      return ESTILOS_COMUNICACION.ESTRUCTURADO;
    }
    
    return ESTILOS_COMUNICACION.DIRECTO;
  }

  /**
   * Genera una configuración personalizada para el usuario
   * @param {Object} userProfile - Perfil del usuario
   * @param {Object} periodo - Período temporal actual
   * @param {Object} patrones - Patrones analizados
   * @param {Object} contextData - Datos del contexto
   * @returns {Promise<Object>} Configuración personalizada con saludos, estilo, configuración de respuesta y contexto
   */
  async generarConfiguracionPersonalizada(userProfile, periodo, patrones, contextData) {
    const { estiloBase } = userProfile.preferencias;
    const estiloComunicacion = patrones.estiloComunicacionRecomendado;
    const caracteristicasPeriodo = periodo.caracteristicas;

    return {
      saludos: this.generarSaludo(periodo.nombre, patrones),
      estiloComunicacion: {
        ...ESTILOS_COMUNICACION[estiloBase],
        ...estiloComunicacion,
        adaptaciones: this.generarAdaptaciones(contextData)
      },
      configuracionRespuesta: {
        longitud: this.determinarLongitudRespuesta(caracteristicasPeriodo, patrones),
        tono: this.determinarTono(caracteristicasPeriodo, patrones),
        estructura: this.determinarEstructura(patrones)
      },
      contexto: {
        periodo: periodo.nombre,
        patronesActivos: patrones,
        ultimaInteraccion: userProfile.patrones.temporales.ultima
      }
    };
  }

  /**
   * Actualiza los patrones de interacción del usuario
   * @param {string|ObjectId} userId - ID del usuario
   * @param {Object} data - Datos de la interacción (emotion, topic, interactionType, responseQuality)
   * @returns {Promise<void>}
   */
  async updateInteractionPattern(userId, data) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      const { emotion, topic, interactionType, responseQuality } = data;
      const periodo = this.analizarPeriodoTemporal();

      // Actualizar patrones (Mongoose timestamps maneja updatedAt automáticamente)
      const update = {
        $push: {
          'patrones.emocionales.ultimas': {
            $each: [emotion],
            $slice: -PATTERNS_LIMIT
          },
          'patrones.tematicos.ultimos': {
            $each: [topic],
            $slice: -PATTERNS_LIMIT
          }
        },
        $inc: {
          [`patrones.temporales.${periodo.nombre}.frecuencia`]: 1,
          [`patrones.tematicos.frecuencias.${topic}`]: 1
        },
        $set: {
          [`patrones.temporales.${periodo.nombre}.ultimaEmocion`]: emotion,
          'ultimaInteraccion.calidad': responseQuality
          // Nota: Mongoose timestamps maneja updatedAt automáticamente
        }
      };

      await UserProfile.findOneAndUpdate({ userId }, update, { new: true });
    } catch (error) {
      console.error('[PersonalizationService] Error actualizando patrón:', error, { userId, data });
    }
  }

  /**
   * Genera un saludo personalizado según el período y patrones
   * @param {string} nombrePeriodo - Nombre del período del día
   * @param {Object} patrones - Patrones del usuario
   * @returns {string} Saludo personalizado
   */
  generarSaludo(nombrePeriodo, patrones) {
    // Implementación simplificada - puede mejorarse con análisis real
    return DEFAULT_GREETING;
  }
  
  /**
   * Genera adaptaciones según el contexto de datos
   * @param {Object} contextData - Datos del contexto
   * @returns {Object} Adaptaciones generadas
   */
  generarAdaptaciones(contextData) {
    // Implementación simplificada - puede mejorarse con análisis real
    return {};
  }
  
  /**
   * Determina la longitud de respuesta ideal
   * @param {Object} caracteristicasPeriodo - Características del período
   * @param {Object} patrones - Patrones del usuario
   * @returns {string} Longitud de respuesta ('CORTA', 'MEDIA', 'LARGA')
   */
  determinarLongitudRespuesta(caracteristicasPeriodo, patrones) {
    return caracteristicasPeriodo?.longitudIdeal || RESPONSE_LENGTH_MEDIA;
  }
  
  /**
   * Determina el tono ideal de respuesta
   * @param {Object} caracteristicasPeriodo - Características del período
   * @param {Object} patrones - Patrones del usuario
   * @returns {string} Tono ideal
   */
  determinarTono(caracteristicasPeriodo, patrones) {
    return caracteristicasPeriodo?.tonoPreferido || DEFAULT_TONE;
  }
  
  /**
   * Determina la estructura ideal de respuesta
   * @param {Object} patrones - Patrones del usuario
   * @returns {string} Estructura ideal
   */
  determinarEstructura(patrones) {
    return DEFAULT_STRUCTURE;
  }

  /**
   * Obtiene la configuración por defecto para personalización
   * @returns {Object} Configuración por defecto
   */
  getDefaultConfiguration() {
    return {
      saludos: DEFAULT_GREETING,
      estiloComunicacion: ESTILOS_COMUNICACION.EMPATICO,
      configuracionRespuesta: {
        longitud: RESPONSE_LENGTH_MEDIA,
        tono: DEFAULT_TONE,
        estructura: DEFAULT_STRUCTURE
      },
      contexto: {
        periodo: DEFAULT_PERIOD,
        patronesActivos: null,
        ultimaInteraccion: null
      }
    };
  }
}

export default new PersonalizationService(); 