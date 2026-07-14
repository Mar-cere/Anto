/**
 * Schemas Joi para validación de endpoints de scheduled-sessions.
 * Mensajes localizados desde scheduledSessionsApiCopy.
 */

import Joi from 'joi';

/**
 * Validador custom para asegurar que el time esté en formato HH:mm válido
 */
const timeFormatValidator = (value, helpers) => {
  const trimmed = value.trim();
  
  // Regex para formato HH:mm (24h)
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
    return helpers.error('string.pattern.base');
  }
  
  return trimmed;
};

/**
 * Validador custom para label: rechazar newlines, tabs, caracteres problemáticos
 */
const labelValidator = (value, helpers) => {
  if (!value) return value;
  
  const trimmed = value.trim();
  
  // Rechazar newlines, tabs
  if (/[\r\n\t]/.test(trimmed)) {
    return helpers.error('string.pattern.base');
  }
  
  // Rechazar caracteres problemáticos
  if (/<|>|\{|\}/.test(trimmed)) {
    return helpers.error('string.pattern.base');
  }
  
  return trimmed;
};

/**
 * Schema para crear una nueva sesión programada (POST /api/scheduled-sessions)
 */
export function getCreateSessionSchema(copy) {
  return Joi.object({
    dayOfWeek: Joi.number()
      .integer()
      .min(0)
      .max(6)
      .required()
      .messages({
        'any.required': copy.joiDayOfWeekRequired,
        'number.base': copy.joiDayOfWeekNumber,
        'number.min': copy.joiDayOfWeekRange,
        'number.max': copy.joiDayOfWeekRange,
        'number.integer': copy.joiDayOfWeekInteger,
      }),
    time: Joi.string()
      .trim()
      .custom(timeFormatValidator)
      .required()
      .messages({
        'any.required': copy.joiTimeRequired,
        'string.base': copy.joiTimeString,
        'string.pattern.base': copy.joiTimeFormat,
      }),
    label: Joi.string()
      .trim()
      .max(50)
      .custom(labelValidator)
      .allow(null, '')
      .messages({
        'string.base': copy.joiLabelString,
        'string.max': copy.joiLabelMax,
        'string.pattern.base': copy.joiLabelInvalid,
      }),
  });
}

/**
 * Schema para actualizar una sesión existente (PUT /api/scheduled-sessions/:sessionId)
 */
export function getUpdateSessionSchema(copy) {
  return Joi.object({
    dayOfWeek: Joi.number()
      .integer()
      .min(0)
      .max(6)
      .messages({
        'number.base': copy.joiDayOfWeekNumber,
        'number.min': copy.joiDayOfWeekRange,
        'number.max': copy.joiDayOfWeekRange,
        'number.integer': copy.joiDayOfWeekInteger,
      }),
    time: Joi.string()
      .trim()
      .custom(timeFormatValidator)
      .messages({
        'string.base': copy.joiTimeString,
        'string.pattern.base': copy.joiTimeFormat,
      }),
    isActive: Joi.boolean().messages({
      'boolean.base': copy.joiIsActiveInvalid,
    }),
    label: Joi.string()
      .trim()
      .max(50)
      .custom(labelValidator)
      .allow(null, '')
      .messages({
        'string.base': copy.joiLabelString,
        'string.max': copy.joiLabelMax,
        'string.pattern.base': copy.joiLabelInvalid,
      }),
    notificationId: Joi.string()
      .trim()
      .max(128)
      .allow(null, '')
      .messages({
        'string.base': copy.joiNotificationIdString,
        'string.max': copy.joiNotificationIdMax,
      }),
  }).min(1); // Al menos un campo debe estar presente
}

/**
 * Schema para pausar todas las sesiones (POST /api/scheduled-sessions/pause)
 */
export function getPauseSessionsSchema(copy) {
  return Joi.object({
    pauseDays: Joi.number()
      .integer()
      .min(1)
      .max(90)
      .required()
      .messages({
        'any.required': copy.joiPauseDaysRequired,
        'number.base': copy.joiPauseDaysNumber,
        'number.min': copy.joiPauseDaysRange,
        'number.max': copy.joiPauseDaysRange,
        'number.integer': copy.joiPauseDaysInteger,
      }),
  });
}
