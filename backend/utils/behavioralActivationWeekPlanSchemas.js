/**
 * Esquemas Joi — plan semanal BA (#88).
 */
import Joi from 'joi';

export function getUpdateWeekPlanSchema(copy) {
  return Joi.object({
    weekStart: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': copy.joiWeekStartInvalid,
      }),
    slots: Joi.array()
      .items(
        Joi.object({
          slotId: Joi.string().trim().required().max(64).messages({
            'any.required': copy.joiSlotIdRequired,
          }),
          dayOffset: Joi.number().integer().min(0).max(6).required().messages({
            'any.required': copy.joiDayOffsetRequired,
          }),
          activityDescription: Joi.string()
            .trim()
            .required()
            .min(1)
            .max(500)
            .messages({
              'string.empty': copy.joiActivityEmpty,
              'string.max': copy.joiActivityMax,
              'any.required': copy.joiActivityRequired,
            }),
          activityType: Joi.string()
            .valid('pleasant', 'routine')
            .optional()
            .default('pleasant')
            .messages({
              'any.only': copy.joiTypeInvalid,
            }),
          status: Joi.string()
            .valid('planned', 'completed', 'skipped')
            .optional()
            .default('planned')
            .messages({
              'any.only': copy.joiSlotStatusInvalid,
            }),
          completedLogId: Joi.string()
            .pattern(/^[a-fA-F0-9]{24}$/)
            .optional()
            .allow(null)
            .messages({
              'string.pattern.base': copy.joiCompletedLogInvalid,
            }),
          linkedTaskId: Joi.string()
            .pattern(/^[a-fA-F0-9]{24}$/)
            .optional()
            .allow(null),
          linkedHabitId: Joi.string()
            .pattern(/^[a-fA-F0-9]{24}$/)
            .optional()
            .allow(null),
        }),
      )
      .min(1)
      .max(7)
      .required()
      .messages({
        'array.min': copy.joiSlotsMin,
        'array.max': copy.joiSlotsMax,
        'any.required': copy.joiSlotsRequired,
      }),
  });
}
