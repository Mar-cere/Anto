/**
 * Esquemas Joi de jerarquía de exposición (#87).
 */
import Joi from 'joi';

export function getCreateExposurePlanSchema(copy) {
  return Joi.object({
    title: Joi.string()
      .trim()
      .required()
      .min(1)
      .max(200)
      .messages({
        'string.empty': copy.joiTitleEmpty,
        'string.max': copy.joiTitleMax,
        'any.required': copy.joiTitleRequired,
      }),
    steps: Joi.array()
      .items(
        Joi.string().trim().required().min(1).max(500).messages({
          'string.empty': copy.joiStepEmpty,
          'string.max': copy.joiStepMax,
        }),
      )
      .min(2)
      .max(15)
      .required()
      .messages({
        'array.min': copy.joiStepsMin,
        'array.max': copy.joiStepsMax,
      }),
  });
}

export function getLogExposureAttemptSchema(copy) {
  return Joi.object({
    stepIndex: Joi.number().integer().min(0).required(),
    peakSuds: Joi.number()
      .integer()
      .min(0)
      .max(100)
      .required()
      .messages({
        'any.required': copy.joiPeakSudsRequired,
        'number.min': copy.joiSudsMin,
        'number.max': copy.joiSudsMax,
      }),
    endSuds: Joi.number()
      .integer()
      .min(0)
      .max(100)
      .required()
      .messages({
        'any.required': copy.joiEndSudsRequired,
        'number.min': copy.joiSudsMin,
        'number.max': copy.joiSudsMax,
      }),
    notes: Joi.string().trim().max(500).optional().allow('').default('').messages({
      'string.max': copy.joiNotesMax,
    }),
  });
}
