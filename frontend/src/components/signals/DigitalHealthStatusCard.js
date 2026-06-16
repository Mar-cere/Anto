/**
 * Tarjeta compacta de estado de salud digital (#216).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import signalsService from '../../services/signalsService';
import { getDigitalHealthAvailability } from '../../services/digitalHealthBridge';

const COPY = {
  es: {
    title: 'Hábitos del dispositivo',
    connected: 'Conectado — usamos agregados de sueño, pasos y pantalla para patrones observacionales.',
    noData: 'Conectado — aún no hay datos suficientes en este periodo.',
    disconnected: 'Conecta salud digital para ver cómo tus hábitos se relacionan con tu proceso.',
    connect: 'Conectar salud digital',
    syncing: 'Sincronizando…',
    unavailable: 'Disponible en la app nativa (iOS/Android) con permisos del dispositivo.',
  },
  en: {
    title: 'Device habits',
    connected: 'Connected — we use aggregated sleep, steps and screen data for observational patterns.',
    noData: 'Connected — not enough data in this period yet.',
    disconnected: 'Connect digital health to see how your habits relate to your process.',
    connect: 'Connect digital health',
    syncing: 'Syncing…',
    unavailable: 'Available in the native app (iOS/Android) with device permissions.',
  },
};

export default function DigitalHealthStatusCard({
  compact = false,
  onConsentRequest,
  sourceSummary = null,
}) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const text = COPY[language === 'en' ? 'en' : 'es'];

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);
  const [consentEnabled, setConsentEnabled] = useState(false);

  const phenotypeDays = Number(sourceSummary?.phenotypeDaysWithData || 0);
  const hasRecentData = phenotypeDays >= 1;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [availability, consent] = await Promise.all([
        getDigitalHealthAvailability(),
        signalsService.getSignalConsent().catch(() => null),
      ]);
      setHealthAvailable(availability?.available === true);
      setConsentEnabled(consent?.digitalHealth?.enabled === true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleConnect = useCallback(async () => {
    if (typeof onConsentRequest === 'function') {
      onConsentRequest();
      return;
    }
    try {
      setSyncing(true);
      await signalsService.updateSignalConsent({
        digitalHealth: { enabled: true, steps: true, sleep: true, screenTime: true },
      });
      await signalsService.syncDigitalPhenotype().catch(() => {});
      await load();
    } finally {
      setSyncing(false);
    }
  }, [load, onConsentRequest]);

  const body = useMemo(() => {
    if (!healthAvailable) return text.unavailable;
    if (!consentEnabled) return text.disconnected;
    return hasRecentData ? text.connected : text.noData;
  }, [consentEnabled, hasRecentData, healthAvailable, text]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: compact ? 12 : 14,
          marginBottom: 14,
          backgroundColor: colors.cardBackground || colors.surface || colors.background,
        },
        row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
        title: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
        body: { fontSize: 12, lineHeight: 17, color: colors.textSecondary, flex: 1 },
        cta: {
          marginTop: 10,
          alignSelf: 'flex-start',
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor: colors.primary,
        },
        ctaText: { color: colors.onPrimary || '#fff', fontSize: 13, fontWeight: '600' },
        loading: { paddingVertical: 8, alignItems: 'center' },
      }),
    [colors, compact],
  );

  if (loading) {
    return (
      <View style={styles.wrap}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      </View>
    );
  }

  const showCta = healthAvailable && !consentEnabled;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.row}>
        <MaterialCommunityIcons
          name={consentEnabled ? 'heart-pulse' : 'heart-outline'}
          size={22}
          color={colors.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{text.title}</Text>
          <Text style={styles.body}>{syncing ? text.syncing : body}</Text>
          {showCta ? (
            <TouchableOpacity
              style={styles.cta}
              onPress={handleConnect}
              disabled={syncing}
              accessibilityRole="button"
              accessibilityLabel={text.connect}
            >
              <Text style={styles.ctaText}>{text.connect}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
