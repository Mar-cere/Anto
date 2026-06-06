/**
 * Esquemas Joi de activación conductual (#88).
 */
import Joi from 'joi';

export function getCreateBehavioralActivationSchema(copy) {
  return Joi.object({
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
    moodBefore: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'any.required': copy.joiMoodBeforeRequired,
        'number.min': copy.joiMoodMin,
        'number.max': copy.joiMoodMax,
      }),
    moodAfter: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'any.required': copy.joiMoodAfterRequired,
        'number.min': copy.joiMoodMin,
        'number.max': copy.joiMoodMax,
      }),
    notes: Joi.string().trim().max(500).optional().allow('').default('').messages({
      'string.max': copy.joiNotesMax,
    }),
    entryDate: Joi.date().optional(),
  });
}
