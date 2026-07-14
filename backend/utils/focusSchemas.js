/**
 * Schemas de validación Joi para rutas de foco de acompañamiento (#2).
 */
import Joi from 'joi';
import { FOCUS_THEMES, FOCUS_STATUS, MAX_FOCUS_DURATION_WEEKS, MIN_FOCUS_DURATION_WEEKS } from '../constants/focusThemes.js';

/**
 * Schema para iniciar un nuevo foco.
 */
export function getStartFocusSchema(copy) {
  return Joi.object({
    themeId: Joi.string()
      .valid(...Object.keys(FOCUS_THEMES))
      .required()
      .messages({
        'any.required': copy.joiThemeIdRequired,
        'any.only': copy.joiThemeIdInvalid,
      }),
    durationWeeks: Joi.number()
      .integer()
      .min(MIN_FOCUS_DURATION_WEEKS)
      .max(MAX_FOCUS_DURATION_WEEKS)
      .optional()
      .messages({
        'number.min': copy.joiDurationWeeksMin,
        'number.max': copy.joiDurationWeeksMax,
      }),
    customGoal: Joi.string()
      .trim()
      .max(200)
      .allow('', null)
      .optional()
      .messages({
        'string.max': copy.joiCustomGoalMax,
      }),
  });
}

/**
 * Schema para actualizar un foco activo.
 */
export function getUpdateFocusSchema(copy) {
  return Joi.object({
    customGoal: Joi.string()
      .trim()
      .max(200)
      .allow('', null)
      .optional()
      .messages({
        'string.max': copy.joiCustomGoalMax,
      }),
    status: Joi.string()
      .valid(FOCUS_STATUS.ACTIVE, FOCUS_STATUS.PAUSED)
      .optional()
      .messages({
        'any.only': copy.joiStatusInvalid,
      }),
  }).min(1);
}

/**
 * Schema para registrar evento de telemetría.
 */
export function getTelemetryEventSchema(copy) {
  const VALID_EVENT_TYPES = [
    'focus_started',
    'focus_paused',
    'focus_resumed',
    'focus_completed',
    'focus_progress_viewed',
    'focus_onboarding_opened',
    'focus_onboarding_skipped',
    'focus_dashboard_viewed',
  ];

  return Joi.object({
    eventType: Joi.string()
      .valid(...VALID_EVENT_TYPES)
      .required()
      .messages({
        'any.required': copy.joiEventTypeRequired || 'Event type is required',
        'any.only': copy.joiEventTypeInvalid || 'Invalid event type',
      }),
    themeId: Joi.string()
      .valid(...Object.keys(FOCUS_THEMES))
      .optional()
      .allow(null)
      .messages({
        'any.only': copy.joiThemeIdInvalid,
      }),
    metadata: Joi.object()
      .optional()
      .default({})
      .messages({
        'object.base': copy.joiMetadataInvalid || 'Metadata must be an object',
      }),
  });
}
