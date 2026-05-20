/**
 * Esquemas Joi del diario por idioma (copy).
 */
import Joi from 'joi';

export function getCreateJournalSchema(copy) {
  return Joi.object({
    content: Joi.string()
      .required()
      .min(1)
      .max(2000)
      .messages({
        'string.empty': copy.joiContentEmpty,
        'string.min': copy.joiContentMin,
        'string.max': copy.joiContentMax,
        'any.required': copy.joiContentRequired,
      }),
    entryDate: Joi.date().optional(),
    emotionalState: Joi.string()
      .valid('happy', 'grateful', 'peaceful', 'content', 'hopeful', 'other')
      .optional()
      .default('grateful'),
    tags: Joi.array().items(Joi.string().trim().max(30)).optional().default([]),
  });
}

export function getUpdateJournalSchema() {
  return Joi.object({
    content: Joi.string().min(1).max(2000).optional(),
    entryDate: Joi.date().optional(),
    emotionalState: Joi.string()
      .valid('happy', 'grateful', 'peaceful', 'content', 'hopeful', 'other')
      .optional(),
    tags: Joi.array().items(Joi.string().trim().max(30)).optional(),
    archived: Joi.boolean().optional(),
  });
}
