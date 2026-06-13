/**
 * Panel de consentimiento granular (#215 / #216 / #208).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import signalsService from '../services/signalsService';

const DEFAULTS = {
  TITLE: 'Señales opcionales',
  TYPING: 'Ritmo al escribir (sin guardar más palabras)',
  TYPING_HINT: 'Mide pausas y retoques del borrador para detectar carga cognitiva.',
  HEALTH: 'Salud digital (pasos, sueño, pantalla)',
  HEALTH_HINT: 'Requiere permisos del dispositivo cuando estén disponibles.',
  WEEKLY: 'Informe semanal de patrones',
  WEEKLY_HINT: 'Resumen observacional, no diagnóstico.',
  SAVING: 'Guardando…',
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

export default function SignalConsentPanel({ compact = false }) {
  const { colors } = useTheme();
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(() => {
    const t = { ...DEFAULTS };
    Object.entries(KEY_MAP).forEach(([local, remote]) => {
      if (translated?.[remote]) t[local] = translated[remote];
    });
    return t;
  }, [translated]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(null);

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
        wrap: {
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: compact ? 12 : 14,
          marginBottom: 14,
          backgroundColor: colors.cardBackground || colors.surface || colors.background,
        },
        title: {
          fontSize: compact ? 14 : 15,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 10,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        },
        copy: { flex: 1 },
        label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
        hint: { fontSize: 12, lineHeight: 17, color: colors.textSecondary },
        saving: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
      }),
    [colors, compact],
  );

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!consent) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{TEXTS.TITLE}</Text>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.label}>{TEXTS.TYPING}</Text>
          <Text style={styles.hint}>{TEXTS.TYPING_HINT}</Text>
        </View>
        <Switch
          value={consent.typingTelemetry?.enabled === true}
          onValueChange={(enabled) => patchConsent({ typingTelemetry: { enabled } })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.label}>{TEXTS.HEALTH}</Text>
          <Text style={styles.hint}>{TEXTS.HEALTH_HINT}</Text>
        </View>
        <Switch
          value={consent.digitalHealth?.enabled === true}
          onValueChange={(enabled) =>
            patchConsent({
              digitalHealth: {
                enabled,
                steps: enabled,
                sleep: enabled,
                screenTime: enabled,
              },
            })
          }
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.label}>{TEXTS.WEEKLY}</Text>
          <Text style={styles.hint}>{TEXTS.WEEKLY_HINT}</Text>
        </View>
        <Switch
          value={consent.weeklyInsights?.enabled !== false}
          onValueChange={(enabled) => patchConsent({ weeklyInsights: { enabled } })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      {saving ? <Text style={styles.saving}>{TEXTS.SAVING}</Text> : null}
    </View>
  );
}
