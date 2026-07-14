/**
 * Copy bilingüe para API de focos de acompañamiento (#2).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    // Endpoints generales
    themesSuccess: 'Temas de foco disponibles obtenidos',
    activeSuccess: 'Foco activo obtenido',
    startedSuccess: 'Foco iniciado',
    updatedSuccess: 'Foco actualizado',
    completedSuccess: 'Foco completado',
    
    // Errores
    themesError: 'Error al obtener temas de foco',
    activeError: 'Error al obtener foco activo',
    startError: 'Error al iniciar foco',
    updateError: 'Error al actualizar foco',
    completeError: 'Error al completar foco',
    
    alreadyActive: 'Ya tienes un foco activo. Complétalo o páusalo antes de iniciar uno nuevo',
    noActiveFocus: 'No tienes un foco activo',
    invalidTheme: 'Tema de foco no válido',
    invalidStatus: 'Estado de foco no válido',
    cannotCompleteNonActive: 'Solo puedes completar un foco activo',
    
    // Rate limiting
    rateLimitStart: 'Demasiados intentos de iniciar foco. Espera un momento',
    rateLimitUpdate: 'Demasiadas actualizaciones de foco. Espera un momento',
    
    // Validación Joi
    joiThemeIdRequired: 'El tema de foco es requerido',
    joiThemeIdInvalid: 'El tema de foco no es válido',
    joiDurationWeeksMin: 'La duración debe ser de al menos 1 semana',
    joiDurationWeeksMax: 'La duración no puede exceder 12 semanas',
    joiCustomGoalMax: 'El objetivo personalizado no puede exceder 200 caracteres',
    joiStatusInvalid: 'El estado debe ser active, paused o completed',
    joiEventTypeRequired: 'El tipo de evento es requerido',
    joiEventTypeInvalid: 'El tipo de evento no es válido',
    joiMetadataInvalid: 'La metadata debe ser un objeto',
    
    // Telemetría
    telemetryLogged: 'Telemetría registrada correctamente',
    telemetryError: 'Error al registrar telemetría',
    
    // Copy de temas
    themes: {
      anxiety: {
        name: 'Ansiedad',
        description: 'Trabaja con preocupación, tensión y estrategias de regulación',
        onboardingPrompt: '¿Qué te gustaría explorar sobre la ansiedad en las próximas semanas?',
      },
      boundaries: {
        name: 'Límites',
        description: 'Fortalece tu capacidad de decir que no y proteger tu espacio',
        onboardingPrompt: '¿En qué áreas de tu vida necesitas trabajar límites?',
      },
      selfCare: {
        name: 'Autocuidado',
        description: 'Construye hábitos sostenibles de bienestar físico y emocional',
        onboardingPrompt: '¿Qué aspectos de tu autocuidado quieres fortalecer?',
      },
    },
  },
  en: {
    // Endpoints generales
    themesSuccess: 'Available focus themes retrieved',
    activeSuccess: 'Active focus retrieved',
    startedSuccess: 'Focus started',
    updatedSuccess: 'Focus updated',
    completedSuccess: 'Focus completed',
    
    // Errores
    themesError: 'Error retrieving focus themes',
    activeError: 'Error retrieving active focus',
    startError: 'Error starting focus',
    updateError: 'Error updating focus',
    completeError: 'Error completing focus',
    
    alreadyActive: 'You already have an active focus. Complete or pause it before starting a new one',
    noActiveFocus: 'You do not have an active focus',
    invalidTheme: 'Invalid focus theme',
    invalidStatus: 'Invalid focus status',
    cannotCompleteNonActive: 'You can only complete an active focus',
    
    // Rate limiting
    rateLimitStart: 'Too many attempts to start focus. Please wait',
    rateLimitUpdate: 'Too many focus updates. Please wait',
    
    // Validación Joi
    joiThemeIdRequired: 'Focus theme is required',
    joiThemeIdInvalid: 'Focus theme is not valid',
    joiDurationWeeksMin: 'Duration must be at least 1 week',
    joiDurationWeeksMax: 'Duration cannot exceed 12 weeks',
    joiCustomGoalMax: 'Custom goal cannot exceed 200 characters',
    joiStatusInvalid: 'Status must be active, paused, or completed',
    joiEventTypeRequired: 'Event type is required',
    joiEventTypeInvalid: 'Event type is not valid',
    joiMetadataInvalid: 'Metadata must be an object',
    
    // Telemetría
    telemetryLogged: 'Telemetry logged successfully',
    telemetryError: 'Error logging telemetry',
    
    // Copy de temas
    themes: {
      anxiety: {
        name: 'Anxiety',
        description: 'Work with worry, tension, and regulation strategies',
        onboardingPrompt: 'What would you like to explore about anxiety in the coming weeks?',
      },
      boundaries: {
        name: 'Boundaries',
        description: 'Strengthen your ability to say no and protect your space',
        onboardingPrompt: 'In what areas of your life do you need to work on boundaries?',
      },
      selfCare: {
        name: 'Self-care',
        description: 'Build sustainable habits of physical and emotional well-being',
        onboardingPrompt: 'What aspects of your self-care do you want to strengthen?',
      },
    },
  },
};

export function focusApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
