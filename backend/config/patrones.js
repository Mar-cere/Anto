/**
 * Patrones de Análisis - Define patrones de intención y temas para análisis de mensajes
 * Estos patrones se usan para detectar la intención del usuario y los temas de conversación
 */

/**
 * Patrones de Intención - Detectan la intención principal del mensaje del usuario
 */
export const PATRONES_INTENCION = {
  /**
   * Patrones de crisis - Requieren atención inmediata
   */
  CRISIS: [
    'necesito.*ayuda.*urgente',
    'no.*puedo.*más',
    'no quiero seguir',
    'quiero.*terminar.*todo',
    'no.*quiero.*vivir',
    'emergencia',
    'ayuda urgente',
    'me rindo',
    'no encuentro salida',
    'no tiene sentido',
    'quiero rendirme',
    'no.*vale.*la.*pena'
  ],

  /**
   * Patrones de ayuda emocional - Indican necesidad de apoyo emocional
   */
  AYUDA_EMOCIONAL: [
    'me.*siento.*mal',
    '(me siento|estoy).*triste',
    '(me siento|estoy).*deprimid(o|a)',
    'necesito.*hablar',
    'ayuda.*emocional',
    '(me siento|estoy).*sol(o|a)',
    '(me siento|estoy).*ansios(o|a)',
    '(me siento|estoy).*estresad(o|a)',
    '(me siento|estoy).*preocupad(o|a)',
    '(me siento|estoy).*abrumad(o|a)'
  ],

  /**
   * Patrones de consulta importante - Indican necesidad de consejo u orientación
   */
  CONSULTA_IMPORTANTE: [
    'necesito.*consejo',
    'que.*debo.*hacer',
    'ayuda.*decision',
    'qué hago',
    'qué debería hacer',
    'no sé qué hacer',
    'puedes aconsejarme',
    'me das un consejo',
    'me puedes ayudar con una decisión',
    'tengo una duda importante',
    'necesito orientación'
  ],

  /**
   * Patrones de conversación general - Saludos y conversación casual
   */
  CONVERSACION_GENERAL: [
    'hola',
    'buenos días',
    'buenas tardes',
    'buenas noches',
    '(como|qué).*estas',
    'cómo estás',
    'que.*tal',
    '¿qué tal?',
    '¿cómo va?',
    '¿cómo te va?',
    'saludos',
    'hey',
    'buen día',
    'qué pasa',
    'qué cuentas'
  ]
};

/**
 * Patrones de Tema - Detectan los temas principales de la conversación
 */
export const PATRONES_TEMA = {
  /**
   * Patrones emocionales - Emociones y estados emocionales
   */
  EMOCIONAL: [
    'triste(za)?',
    'deprimid(o|a)',
    'feliz',
    'alegr(ía|e)',
    'ansiedad',
    'ansios(o|a)',
    'miedo',
    'temor',
    'estres(ado|ada)?',
    'preocupad(o|a)',
    'abrumad(o|a)',
    'soledad',
    'culpa',
    'vergüenza',
    'enojo',
    'ira',
    'rabia',
    'frustración',
    'impotencia',
    'nostalgia',
    'apatía',
    'desánimo',
    'desmotivad(o|a)'
  ],

  /**
   * Patrones de relaciones - Relaciones interpersonales y familiares
   */
  RELACIONES: [
    'pareja',
    'relación',
    'relaciones',
    'novio',
    'novia',
    'espos(o|a)',
    'familia',
    'madre',
    'padre',
    'hij(o|a)',
    'herman(o|a)',
    'amig(o|a)',
    'amistad',
    'compañer(o|a)',
    'conflicto familiar',
    'conflicto de pareja',
    'divorcio',
    'separación',
    'pérdida',
    'duelo'
  ],

  /**
   * Patrones de trabajo y estudio - Ámbito laboral y académico
   */
  TRABAJO_ESTUDIO: [
    'trabajo',
    'empleo',
    'oficina',
    'jefe',
    'colega',
    'compañer(o|a) de trabajo',
    'proyecto',
    'tarea',
    'estudio',
    'universidad',
    'escuela',
    'examen',
    'clase',
    'profesor',
    'maestro',
    'rendimiento',
    'estrés laboral',
    'estrés académico',
    'desempleo',
    'búsqueda de trabajo'
  ],

  /**
   * Patrones de salud - Salud física y mental
   */
  SALUD: [
    'salud',
    'enfermedad',
    'dolor',
    'malestar',
    'síntoma',
    'cansancio',
    'insomnio',
    'fiebre',
    'gripe',
    'lesión',
    'hospital',
    'doctor',
    'médic(o|a)',
    'terapia',
    'tratamiento',
    'ansiedad física',
    'ataque de pánico'
  ],

  /**
   * Patrones generales - Temas generales de vida y desarrollo personal
   */
  GENERAL: [
    'vida',
    'futuro',
    'presente',
    'pasado',
    'situación',
    'problema',
    'dificultad',
    'meta',
    'objetivo',
    'logro',
    'cambio',
    'rutina',
    'motivación',
    'esperanza',
    'incertidumbre',
    'decisión',
    'proyecto personal',
    'crecimiento',
    'desarrollo'
  ]
};
