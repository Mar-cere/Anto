/**
 * Esquemas Joi de usuario por idioma (copy).
 */
import Joi from 'joi';
import { ALL_ONBOARDING_FOCUS_LABELS } from '../constants/onboardingFocusLabels.js';
import {
  isValidCountryPreference,
  isValidRegionCountryPreference,
  sanitizeCountryPreference,
  sanitizeRegionCountryPreference,
} from './countryPreferences.js';
import { normalizePreferencesNotifications } from './preferencesNotifications.js';

export function getUpdateProfileSchema(copy) {
  return Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': copy.joiNameMin,
        'string.max': copy.joiNameMax,
      }),
    username: Joi.string()
      .min(3)
      .max(20)
      .pattern(/^[a-z0-9_]+$/)
      .trim()
      .lowercase()
      .optional()
      .messages({
        'string.min': copy.joiUsernameMin,
        'string.max': copy.joiUsernameMax,
        'string.pattern.base': copy.joiUsernamePattern,
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .trim()
      .lowercase()
      .optional()
      .messages({
        'string.email': copy.joiEmailInvalid,
      }),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto'),
      // Legacy: boolean; actual: objeto con enabled / canales / sesiones
      notifications: Joi.alternatives()
        .try(
          Joi.boolean(),
          Joi.object({
            enabled: Joi.boolean(),
            emailEnabled: Joi.boolean(),
            pushEnabled: Joi.boolean(),
            scheduledSessions: Joi.object({
              enabled: Joi.boolean(),
              sessions: Joi.array().max(10),
              lastNotificationAt: Joi.date().allow(null),
              pausedUntil: Joi.date().allow(null),
            }).unknown(true),
          }).unknown(true)
        )
        .custom((value) => normalizePreferencesNotifications(value)),
      language: Joi.string().valid('es', 'en'),
      timezone: Joi.string().trim().max(64),
      /** País explícito (ISO, legacy o prefijo telefónico) para números de emergencia */
      country: Joi.string()
        .trim()
        .max(16)
        .allow(null, '')
        .optional()
        .custom((value, helpers) => {
          if (value == null || value === '') return null;
          if (!isValidCountryPreference(value)) {
            return helpers.error('any.invalid');
          }
          return sanitizeCountryPreference(value);
        }),
      regionCountry: Joi.string()
        .trim()
        .max(2)
        .allow(null, '')
        .optional()
        .custom((value, helpers) => {
          if (value == null || value === '') return null;
          if (!isValidRegionCountryPreference(value)) {
            return helpers.error('any.invalid');
          }
          return sanitizeRegionCountryPreference(value);
        }),
      responseStyle: Joi.string().valid(
        'brief',
        'balanced',
        'deep',
        'empatico',
        'estructurado'
      ),
      privacy: Joi.object({
        profileVisibility: Joi.string().valid('public', 'private', 'friends'),
      }),
      chatPreferences: Joi.object({
        reduceStockEmpathy: Joi.boolean(),
        avoidApologyOpenings: Joi.boolean(),
        preferQuestions: Joi.boolean(),
      }),
    }).optional(),
    notificationPreferences: Joi.object({
      enabled: Joi.boolean(),
      morning: Joi.object({
        enabled: Joi.boolean(),
        hour: Joi.number().min(0).max(23),
        minute: Joi.number().min(0).max(59),
      }),
      evening: Joi.object({
        enabled: Joi.boolean(),
        hour: Joi.number().min(0).max(23),
        minute: Joi.number().min(0).max(59),
      }),
      types: Joi.object({
        dailyReminders: Joi.boolean(),
        habitReminders: Joi.boolean(),
        taskReminders: Joi.boolean(),
        motivationalMessages: Joi.boolean(),
        betweenSessionsMessages: Joi.boolean(),
        commitmentWeeklyReminders: Joi.boolean(),
      }),
    }).optional(),
  });
}

export function getUpdatePasswordSchema(copy) {
  return Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': copy.joiCurrentPasswordRequired,
    }),
    newPassword: Joi.string()
      .min(8)
      .required()
      .messages({
        'string.min': copy.joiNewPasswordMin8,
        'any.required': copy.joiNewPasswordRequired,
      }),
  });
}

export function getReacceptTermsSchema(copy) {
  return Joi.object({
    termsAccepted: Joi.boolean().valid(true).required().messages({
      'any.only': copy.joiTermsRequired,
      'any.required': copy.joiTermsRequired,
    }),
    privacyAccepted: Joi.boolean().valid(true).required().messages({
      'any.only': copy.joiPrivacyRequired,
      'any.required': copy.joiPrivacyRequired,
    }),
  });
}

const onboardingFocusValue = Joi.string()
  .trim()
  .max(500)
  .allow('', null)
  .custom((value, helpers) => {
    if (value == null || value === '') return value;
    if (ALL_ONBOARDING_FOCUS_LABELS.includes(value)) return value;
    return helpers.error('any.only');
  });

export function getOnboardingPreferencesSchema() {
  return Joi.object({
    whatExpectFromApp: onboardingFocusValue,
    whatToImproveOrWorkOn: onboardingFocusValue,
    typeOfSpecialist: onboardingFocusValue,
  }).min(1);
}

export function getEmergencyContactSchema(copy) {
  return Joi.object({
    name: Joi.string().required().trim().min(2).max(100).messages({
      'string.empty': copy.joiContactNameRequired,
      'string.min': copy.joiContactNameMin,
      'string.max': copy.joiContactNameMax,
    }),
    email: Joi.string().required().email().trim().lowercase().messages({
      'string.empty': copy.joiContactEmailRequired,
      'string.email': copy.joiEmailInvalid,
    }),
    phone: Joi.string().required().trim().min(8).max(20).messages({
      'string.empty': copy.joiContactPhoneRequired,
      'string.min': copy.joiContactPhoneMin,
      'string.max': copy.joiContactPhoneMax,
      'any.required': copy.joiContactPhoneRequired,
    }),
    relationship: Joi.string().allow(null, '').trim().max(50).optional(),
  });
}
