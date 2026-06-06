/**
 * Esquemas Joi de pensamientos automáticos (#89).
 */
import Joi from 'joi';
import cognitiveDistortionDetector from '../services/cognitiveDistortionDetector.js';

const VALID_DISTORTION_TYPES = Object.keys(cognitiveDistortionDetector.getAllDistortions());

export function getCreateAutomaticThoughtSchema(copy) {
  return Joi.object({
    situation: Joi.string()
      .trim()
      .required()
      .min(1)
      .max(500)
      .messages({
        'string.empty': copy.joiSituationEmpty,
        'string.max': copy.joiSituationMax,
        'any.required': copy.joiSituationRequired,
      }),
    automaticThought: Joi.string()
      .trim()
      .required()
      .min(1)
      .max(500)
      .messages({
        'string.empty': copy.joiThoughtEmpty,
        'string.max': copy.joiThoughtMax,
        'any.required': copy.joiThoughtRequired,
      }),
    emotion: Joi.string().trim().max(100).optional().allow('').default('').messages({
      'string.max': copy.joiEmotionMax,
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
    distortionType: Joi.string()
      .trim()
      .valid('', ...VALID_DISTORTION_TYPES)
      .optional()
      .allow('')
      .default('')
      .messages({
        'any.only': copy.joiDistortionTypeInvalid,
      }),
    distortionName: Joi.string()
      .trim()
      .max(200)
      .optional()
      .allow('')
      .default('')
      .messages({
        'string.max': copy.joiDistortionNameMax,
      }),
    balancedThought: Joi.string()
      .trim()
      .max(500)
      .optional()
      .allow('')
      .default('')
      .messages({
        'string.max': copy.joiBalancedMax,
      }),
    notes: Joi.string().trim().max(500).optional().allow('').default('').messages({
      'string.max': copy.joiNotesMax,
    }),
    entryDate: Joi.date().optional(),
  });
}
