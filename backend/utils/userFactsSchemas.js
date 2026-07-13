/**
 * Schemas Joi para validación de endpoints de user-facts.
 * Mensajes localizados desde userFactsApiCopy.
 */

import Joi from 'joi';

const VALID_CATEGORIES = ['work', 'family', 'study', 'health', 'relationships', 'commitment', 'other'];
const VALID_SOURCES = ['user', 'assistant'];

/**
 * Schema para crear un nuevo hecho (POST /api/user-facts)
 */
export function getCreateUserFactSchema(copy) {
  return Joi.object({
    fact: Joi.string().trim().min(5).max(150).required().messages({
      'any.required': copy.joiFactRequired,
      'string.base': copy.joiFactString,
      'string.min': copy.joiFactMin,
      'string.max': copy.joiFactMax,
    }),
    category: Joi.string()
      .valid(...VALID_CATEGORIES)
      .default('other')
      .messages({
        'any.only': copy.joiCategoryInvalid,
      }),
    source: Joi.string()
      .valid(...VALID_SOURCES)
      .default('user')
      .messages({
        'any.only': copy.joiSourceInvalid,
      }),
    conversationId: Joi.string().pattern(/^[a-f\d]{24}$/i).allow(null).messages({
      'string.pattern.base': copy.joiConversationIdInvalid,
    }),
  });
}

/**
 * Schema para actualizar un hecho existente (PUT /api/user-facts/:id)
 */
export function getUpdateUserFactSchema(copy) {
  return Joi.object({
    fact: Joi.string().trim().min(5).max(150).messages({
      'string.base': copy.joiFactString,
      'string.min': copy.joiFactMin,
      'string.max': copy.joiFactMax,
    }),
    category: Joi.string()
      .valid(...VALID_CATEGORIES)
      .messages({
        'any.only': copy.joiCategoryInvalid,
      }),
    isActive: Joi.boolean().messages({
      'boolean.base': copy.joiIsActiveInvalid,
    }),
  }).min(1); // Al menos un campo debe estar presente
}
