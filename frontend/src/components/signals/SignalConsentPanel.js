/**
 * Panel de consentimiento granular (#215 / #216 / #208).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import signalsService from '../../services/signalsService';
import { getDigitalHealthAvailability } from '../../services/digitalHealthBridge';

const ICON_SIZE = 24;
const ICON_GAP = 16;

const DEFAULTS_ES = {
  TITLE: 'Señales opcionales',
  TYPING: 'Ritmo al escribir (sin guardar más palabras)',
  TYPING_HINT: 'Mide pausas y retoques del borrador para detectar carga cognitiva.',
  HEALTH: 'Salud digital (pasos, sueño, pantalla)',
  HEALTH_HINT: 'Requiere permisos del dispositivo cuando estén disponibles.',
  WEEKLY: 'Informe semanal de patrones',
  WEEKLY_HINT: 'Resumen observacional, no diagnóstico.',
  SAVING: 'Guardando…',
};

const DEFAULTS_EN = {
  TITLE: 'Optional signals',
  TYPING: 'Writing pace (no extra words stored)',
  TYPING_HINT: 'Measures pauses and edits in drafts to detect cognitive load.',
  HEALTH: 'Digital health (steps, sleep, screen)',
  HEALTH_HINT: 'Requires device permissions when available.',
  WEEKLY: 'Weekly pattern report',
  WEEKLY_HINT: 'Observational summary, not a diagnosis.',
  SAVING: 'Saving…',
};

const KEY_MAP = {
  TITLE: 'SIGNAL_CONSENT_TITLE',
  TYPING: 'SIGNAL_CONSENT_TYPING',
  TYPING_HINT: 'SIGNAL_CONSENT_TYPING_HINT',
  HEALTH: 'SIGNAL_CONSENT_HEALTH',
  HEALTH_HINT: 'SIGNAL_CONSENT_HEALTH_HINT',
  WEEKLY: 'SIGNAL_CONSENT_WEEKLY',
  WEEKLY_HINT: 'SIGNAL_CONSENT_WEEKLY_HINT',
  SAVING: 'SIGNAL_CONSENT_SAVING',
};

const ROWS = [
  {
    key: 'typing',
    icon: 'keyboard-outline',
    labelKey: 'TYPING',
    hintKey: 'TYPING_HINT',
    getValue: (consent) => consent.typingTelemetry?.enabled === true,
    buildPatch: (enabled) => ({ typingTelemetry: { enabled } }),
  },
  {
    key: 'health',
    icon: 'heart-pulse',
    labelKey: 'HEALTH',
    hintKey: 'HEALTH_HINT',
    getValue: (consent) => consent.digitalHealth?.enabled === true,
    buildPatch: (enabled) => ({
      digitalHealth: {
        enabled,
        steps: enabled,
        sleep: enabled,
        screenTime: enabled,
      },
    }),
  },
  {
    key: 'weekly',
    icon: 'chart-bell-curve',
    labelKey: 'WEEKLY',
    hintKey: 'WEEKLY_HINT',
    getValue: (consent) => consent.weeklyInsights?.enabled !== false,
    buildPatch: (enabled) => ({ weeklyInsights: { enabled } }),
  },
];

export default function SignalConsentPanel({ compact = false, embedded = false }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(() => {
    const base = language === 'en' ? DEFAULTS_EN : DEFAULTS_ES;
    const t = { ...base };
    Object.entries(KEY_MAP).forEach(([local, remote]) => {
      if (translated?.[remote]) t[local] = translated[remote];
    });
    return t;
  }, [translated, language]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(null);
  const [healthAvailable, setHealthAvailable] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await signalsService.getSignalConsent();
      setConsent(data);
    } catch {
      setConsent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    void getDigitalHealthAvailability()
      .then((info) => setHealthAvailable(info?.available === true))
      .catch(() => setHealthAvailable(false));
  }, [load]);

  const patchConsent = useCallback(async (patch) => {
    try {
      setSaving(true);
      const next = await signalsService.updateSignalConsent(patch);
      setConsent(next);
      if (patch?.digitalHealth?.enabled === true) {
        void signalsService.syncDigitalPhenotype().catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: embedded
          ? {}
          : {
              borderRadius: 14,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              padding: compact ? SPACING.SCREEN_EDGE_INSET : 14,
              marginBottom: 14,
              backgroundColor: colors.cardBackground || colors.surface || colors.background,
            },
        embeddedHeader: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 12,
          paddingBottom: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        title: {
          fontSize: embedded ? 13 : compact ? 14 : 15,
          fontWeight: '700',
          color: embedded ? colors.textSecondary : colors.text,
          letterSpacing: embedded ? 0.2 : 0,
          marginBottom: embedded ? 0 : 10,
        },
        row: embedded
          ? {
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            }
          : {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 10,
            },
        rowLast: {
          borderBottomWidth: 0,
        },
        copy: embedded ? { flex: 1, marginLeft: ICON_GAP, minWidth: 0 } : { flex: 1 },
        label: {
          fontSize: 14,
          fontWeight: embedded ? '500' : '600',
          color: colors.text,
          marginBottom: embedded ? 2 : 2,
        },
        hint: { fontSize: 12, lineHeight: 17, color: colors.textSecondary },
        saving: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 4,
          paddingHorizontal: embedded ? SPACING.SCREEN_EDGE_INSET : 0,
          paddingBottom: embedded ? 10 : 0,
        },
        loadingRow: {
          paddingVertical: 20,
          alignItems: 'center',
        },
      }),
    [colors, compact, embedded],
  );

  if (loading) {
    return (
      <View style={styles.wrap}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!consent) return null;

  return (
    <View style={styles.wrap}>
      {embedded ? (
        <View style={styles.embeddedHeader}>
          <Text style={styles.title}>{TEXTS.TITLE}</Text>
        </View>
      ) : (
        <Text style={styles.title}>{TEXTS.TITLE}</Text>
      )}
      {ROWS.map((row, index) => (
        <View
          key={row.key}
          style={[styles.row, embedded && index === ROWS.length - 1 && !saving ? styles.rowLast : null]}
        >
          {embedded ? (
            <MaterialCommunityIcons name={row.icon} size={ICON_SIZE} color={colors.primary} />
          ) : null}
          <View style={styles.copy}>
            <Text style={styles.label}>{TEXTS[row.labelKey]}</Text>
            <Text style={styles.hint}>
              {row.key === 'health' && !healthAvailable
                ? language === 'en'
                  ? 'Coming soon on this device. Writing pace and weekly reports are available now.'
                  : 'Próximamente en este dispositivo. Ritmo al escribir e informes semanales sí están disponibles.'
                : TEXTS[row.hintKey]}
            </Text>
          </View>
          <Switch
            value={row.getValue(consent)}
            onValueChange={(enabled) => patchConsent(row.buildPatch(enabled))}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel={TEXTS[row.labelKey]}
            accessibilityHint={TEXTS[row.hintKey]}
            disabled={saving || (row.key === 'health' && !healthAvailable)}
          />
        </View>
      ))}
      {saving ? <Text style={styles.saving}>{TEXTS.SAVING}</Text> : null}
    </View>
  );
}
