/**
 * Esquemas Joi de Cloudinary por idioma (copy).
 */
import Joi from 'joi';

const ALLOWED_FORMATS = ['jpg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 5242880;

export function getSignatureSchema(copy) {
  return Joi.object({
    type: Joi.string()
      .valid('background', 'attachment')
      .required()
      .messages({
        'any.only': copy.joiTypeInvalid,
        'any.required': copy.joiTypeRequired,
      }),
    folder: Joi.string().required().trim().messages({
      'any.required': copy.joiFolderRequired,
    }),
    allowed_formats: Joi.array().items(Joi.string()).default(ALLOWED_FORMATS),
    max_size: Joi.number().default(MAX_FILE_SIZE).min(1024).max(10485760),
  });
}

export { ALLOWED_FORMATS, MAX_FILE_SIZE };
