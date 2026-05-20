/**
 * Respuestas de validación Joi localizadas.
 */
export function validationErrorBody(copy, error, extra = {}) {
  return {
    message: copy.invalidData,
    errors: error.details.map((detail) => detail.message),
    ...extra,
  };
}

export function validateBody(schema, body, options = {}) {
  return schema.validate(body, { stripUnknown: true, ...options });
}
