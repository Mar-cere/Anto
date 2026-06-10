/**
 * Esquema Joi — vincular slot BA a tarea/hábito (fase 1).
 */
import Joi from 'joi';

export function getSyncBaFromLogSchema(copy) {
  return Joi.object({
    slotId: Joi.string().trim().required().max(64).messages({
      'any.required': copy.joiSlotIdRequired,
    }),
    weekStart: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': copy.joiWeekStartInvalid,
      }),
    logId: Joi.string()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .required()
      .messages({
        'string.pattern.base': copy.joiCompletedLogInvalid,
        'any.required': copy.joiCompletedLogInvalid,
      }),
  });
}

export function getLinkBaProductSchema(copy) {
  return Joi.object({
    slotId: Joi.string().trim().required().max(64).messages({
      'any.required': copy.joiSlotIdRequired,
    }),
    weekStart: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': copy.joiWeekStartInvalid,
      }),
    productKind: Joi.string()
      .valid('task', 'habit', 'auto')
      .optional()
      .default('auto')
      .messages({
        'any.only': copy.joiProductKindInvalid,
      }),
    logId: Joi.string()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .optional()
      .allow(null)
      .messages({
        'string.pattern.base': copy.joiCompletedLogInvalid,
      }),
  });
}
