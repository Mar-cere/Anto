/**
 * Textos reutilizables en correos de producto (aviso legal, CTAs).
 * Mantener aquí la “única fuente de verdad” del aviso médico/IA.
 */
import { APP_NAME } from './app.js';

/** Texto plano del aviso legal estándar (escapar con escapeHtmlText antes de insertar en HTML). */
export function getEmailLegalMedicalDisclaimerPlain() {
  return `${APP_NAME} ofrece conversación con inteligencia artificial orientada al bienestar emocional. No sustituye diagnóstico, tratamiento ni la atención de un profesional de la salud mental; si lo necesitas, busca ayuda presencial o telefónica en tu zona.`;
}

/** Etiquetas de botones / enlaces principales por contexto (español neutro). */
export const emailCtaLabel = {
  /** CTA genérico a la app */
  openApp: () => `Abrir ${APP_NAME}`,
  /** Resumen semanal en la app */
  weeklySummary: () => 'Abrir mi resumen en la app',
  /** Trial: planes / app */
  trialPremium: () => 'Ver planes o continuar',
  /** Resumen trial (secundario) */
  trialWeeklySummary: () => 'Abrir mi resumen semanal',
  /** Post contraseña */
  resetPassword: () => 'Restablecer contraseña',
};
