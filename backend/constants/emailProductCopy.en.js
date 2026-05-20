/**
 * Reusable product email copy (English).
 */
import { APP_NAME } from './app.js';

export function getEmailLegalMedicalDisclaimerPlainEn() {
  return `${APP_NAME} offers AI-assisted emotional wellbeing conversation. It does not replace diagnosis, treatment, or care from a mental health professional; if you need it, seek in-person or phone support in your area.`;
}

export const emailCtaLabelEn = {
  openApp: () => `Open ${APP_NAME}`,
  weeklySummary: () => 'Open my summary in the app',
  trialPremium: () => 'View plans or continue',
  trialWeeklySummary: () => 'Open my weekly summary',
  resetPassword: () => 'Reset password',
};
