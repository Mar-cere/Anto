/**
 * Esquemas Joi de autenticación por idioma (copy).
 */
import Joi from 'joi';

function emailField(copy) {
  return Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': copy.joiEmailInvalid,
      'any.required': copy.joiEmailRequired,
    });
}

function passwordField(copy) {
  return Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': copy.joiPasswordMin8,
      'any.required': copy.joiPasswordRequired,
    });
}

function usernameField(copy) {
  return Joi.string()
    .min(3)
    .max(20)
    .pattern(/^[a-z0-9_]+$/)
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.min': copy.joiUsernameMin,
      'string.max': copy.joiUsernameMax,
      'string.pattern.base': copy.joiUsernamePattern,
      'any.required': copy.joiUsernameRequired,
    });
}

function verificationCodeField(copy) {
  return Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': copy.joiCodeLength,
      'string.pattern.base': copy.joiCodePattern,
      'any.required': copy.joiCodeRequired,
    });
}

export function getRegisterSchema(copy) {
  return Joi.object({
    email: emailField(copy),
    password: passwordField(copy),
    username: usernameField(copy),
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': copy.joiNameMin,
        'string.max': copy.joiNameMax,
      }),
    termsAccepted: Joi.boolean().valid(true).required().messages({
      'any.only': copy.joiTermsRequired,
      'any.required': copy.joiTermsRequired,
    }),
    termsAcceptedAt: Joi.string().isoDate().optional(),
    privacyAccepted: Joi.boolean().valid(true).required().messages({
      'any.only': copy.joiPrivacyRequired,
      'any.required': copy.joiPrivacyRequired,
    }),
    privacyAcceptedAt: Joi.string().isoDate().optional(),
    termsVersion: Joi.string().optional(),
    language: Joi.string().valid('es', 'en').optional(),
  });
}

export function getLoginSchema(copy) {
  return Joi.object({
    email: emailField(copy),
    password: Joi.string().required().messages({
      'any.required': copy.joiPasswordRequired,
    }),
  });
}

export function getPasswordResetSchema(copy) {
  return Joi.object({
    email: emailField(copy),
  });
}

export function getVerifyCodeSchema(copy) {
  return Joi.object({
    email: emailField(copy),
    code: verificationCodeField(copy),
  });
}

export function getVerifyEmailSchema(copy) {
  return Joi.object({
    email: emailField(copy),
    code: verificationCodeField(copy),
  });
}

export function getResetPasswordSchema(copy) {
  return Joi.object({
    email: emailField(copy),
    code: verificationCodeField(copy),
    newPassword: Joi.string()
      .min(8)
      .required()
      .messages({
        'string.min': copy.joiNewPasswordMin8,
        'any.required': copy.joiNewPasswordRequired,
      }),
  });
}

export function getChangePasswordSchema(copy) {
  return Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': copy.joiCurrentPasswordRequired,
        'string.empty': copy.joiCurrentPasswordEmpty,
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': copy.joiNewPasswordMin6,
        'any.required': copy.joiNewPasswordEmpty,
        'string.empty': copy.joiNewPasswordEmpty,
      }),
  });
}
