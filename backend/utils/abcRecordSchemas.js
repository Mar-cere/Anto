/**
 * Esquemas Joi del autorregistro ABC por idioma (copy).
 */
import Joi from 'joi';

export function getCreateAbcRecordSchema(copy) {
  return Joi.object({
    activatingEvent: Joi.string()
      .trim()
      .required()
      .min(1)
      .max(1000)
      .messages({
        'string.empty': copy.joiActivatingEmpty,
        'string.min': copy.joiActivatingMin,
        'string.max': copy.joiActivatingMax,
        'any.required': copy.joiActivatingRequired,
      }),
    beliefs: Joi.string()
      .trim()
      .required()
      .min(1)
      .max(1000)
      .messages({
        'string.empty': copy.joiBeliefsEmpty,
        'string.min': copy.joiBeliefsMin,
        'string.max': copy.joiBeliefsMax,
        'any.required': copy.joiBeliefsRequired,
      }),
    emotions: Joi.string().trim().max(200).optional().allow('').default('').messages({
      'string.max': copy.joiEmotionsMax,
    }),
    emotionIntensity: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .messages({
        'number.min': copy.joiIntensityMin,
        'number.max': copy.joiIntensityMax,
      }),
    consequence: Joi.string().trim().max(1000).optional().allow('').default('').messages({
      'string.max': copy.joiConsequenceMax,
    }),
    entryDate: Joi.date().optional(),
  });
}
