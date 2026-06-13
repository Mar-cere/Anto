/**
 * Consentimiento granular para señales #215 / #216 / insights #208.
 */
import User from '../models/User.js';

const DEFAULT_CONSENT = {
  typingTelemetry: { enabled: false, enabledAt: null },
  digitalHealth: {
    enabled: false,
    enabledAt: null,
    steps: false,
    sleep: false,
    screenTime: false,
  },
  weeklyInsights: { enabled: true, enabledAt: null },
};

export function normalizeSignalConsent(raw) {
  const base = raw && typeof raw === 'object' ? raw : {};
  return {
    typingTelemetry: {
      enabled: base.typingTelemetry?.enabled === true,
      enabledAt: base.typingTelemetry?.enabledAt || null,
    },
    digitalHealth: {
      enabled: base.digitalHealth?.enabled === true,
      enabledAt: base.digitalHealth?.enabledAt || null,
      steps: base.digitalHealth?.steps === true,
      sleep: base.digitalHealth?.sleep === true,
      screenTime: base.digitalHealth?.screenTime === true,
    },
    weeklyInsights: {
      enabled: base.weeklyInsights?.enabled !== false,
      enabledAt: base.weeklyInsights?.enabledAt || null,
    },
  };
}

export async function getSignalConsentForUser(userId) {
  const user = await User.findById(userId).select('signalConsent').lean();
  return normalizeSignalConsent(user?.signalConsent || DEFAULT_CONSENT);
}

export async function updateSignalConsentForUser(userId, patch = {}) {
  const current = await getSignalConsentForUser(userId);
  const next = normalizeSignalConsent(current);
  const now = new Date();

  if (patch.typingTelemetry && typeof patch.typingTelemetry.enabled === 'boolean') {
    next.typingTelemetry = {
      ...next.typingTelemetry,
      enabled: patch.typingTelemetry.enabled,
      enabledAt: patch.typingTelemetry.enabled ? now : null,
    };
  }

  if (patch.digitalHealth && typeof patch.digitalHealth === 'object') {
    next.digitalHealth = { ...next.digitalHealth };
    if (typeof patch.digitalHealth.enabled === 'boolean') {
      next.digitalHealth.enabled = patch.digitalHealth.enabled;
      next.digitalHealth.enabledAt = patch.digitalHealth.enabled ? now : null;
      if (!patch.digitalHealth.enabled) {
        next.digitalHealth.steps = false;
        next.digitalHealth.sleep = false;
        next.digitalHealth.screenTime = false;
      }
    }
    ['steps', 'sleep', 'screenTime'].forEach((key) => {
      if (typeof patch.digitalHealth[key] === 'boolean') {
        if (patch.digitalHealth[key] && !next.digitalHealth.enabled) {
          next.digitalHealth.enabled = true;
          next.digitalHealth.enabledAt = now;
        }
        next.digitalHealth[key] = patch.digitalHealth[key];
      }
    });
  }

  if (patch.weeklyInsights && typeof patch.weeklyInsights.enabled === 'boolean') {
    next.weeklyInsights = {
      ...next.weeklyInsights,
      enabled: patch.weeklyInsights.enabled,
      enabledAt: patch.weeklyInsights.enabled ? now : null,
    };
  }

  await User.findByIdAndUpdate(userId, { $set: { signalConsent: next } });
  return next;
}

export function isTypingTelemetryAllowed(consent) {
  return normalizeSignalConsent(consent).typingTelemetry.enabled === true;
}

export function isDigitalHealthAllowed(consent) {
  return normalizeSignalConsent(consent).digitalHealth.enabled === true;
}

export function isWeeklyInsightsAllowed(consent) {
  return normalizeSignalConsent(consent).weeklyInsights.enabled !== false;
}

export default {
  normalizeSignalConsent,
  getSignalConsentForUser,
  updateSignalConsentForUser,
  isTypingTelemetryAllowed,
  isDigitalHealthAllowed,
  isWeeklyInsightsAllowed,
};
