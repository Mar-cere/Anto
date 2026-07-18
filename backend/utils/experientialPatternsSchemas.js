import Joi from 'joi';
import {
  EXPERIENTIAL_FOLLOW_UP_STATUSES,
  EXPERIENTIAL_PATTERN_CATEGORIES,
} from '../models/ExperientialPattern.js';

export function getCreateExperientialPatternSchema(copy) {
  return Joi.object({
    statement: Joi.string()
      .trim()
      .min(5)
      .max(160)
      .required()
      .messages({
        'string.min': copy.statementRequired,
        'string.max': copy.statementTooLong,
        'any.required': copy.statementRequired,
        'string.empty': copy.statementRequired,
      }),
    category: Joi.string()
      .valid(...EXPERIENTIAL_PATTERN_CATEGORIES)
      .default('other')
      .messages({ 'any.only': copy.invalidCategory }),
    conversationId: Joi.string().hex().length(24).allow(null, ''),
    sourceMessageId: Joi.string().hex().length(24).allow(null, ''),
    followUpDays: Joi.number().integer().min(1).max(90).optional(),
    confidence: Joi.number().min(0).max(1).optional(),
    language: Joi.string().valid('es', 'en').optional(),
    userConfirmed: Joi.boolean().optional(),
  });
}

export function getUpdateExperientialPatternSchema(copy) {
  return Joi.object({
    statement: Joi.string().trim().min(5).max(160).optional().messages({
      'string.min': copy.statementRequired,
      'string.max': copy.statementTooLong,
    }),
    category: Joi.string()
      .valid(...EXPERIENTIAL_PATTERN_CATEGORIES)
      .optional()
      .messages({ 'any.only': copy.invalidCategory }),
    followUpStatus: Joi.string()
      .valid(...EXPERIENTIAL_FOLLOW_UP_STATUSES)
      .optional()
      .messages({ 'any.only': copy.invalidFollowUpStatus }),
    isActive: Joi.boolean().optional(),
    userConfirmed: Joi.boolean().optional(),
    archive: Joi.boolean().optional(),
  }).min(1);
}

export function getConsentSchema() {
  return Joi.object({
    enabled: Joi.boolean().required(),
  });
}
