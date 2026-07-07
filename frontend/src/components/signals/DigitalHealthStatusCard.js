/**
 * Tarjeta compacta de estado de salud digital (#216).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { getDigitalHealthAvailability } from '../../services/digitalHealthBridge';
import { SYNC_REASON, syncDigitalHealthWithNative } from '../../services/digitalHealthSync';
import signalsService from '../../services/signalsService';

const COPY = {
  es: {
    title: 'Hábitos del dispositivo',
    connected: 'Conectado — usamos agregados de sueño, pasos y actividad para patrones observacionales.',
    noData: 'Permisos concedidos — aún no hay datos suficientes en este periodo.',
    disconnected: 'Conecta salud digital para ver cómo tus hábitos se relacionan con tu proceso.',
    permissionDenied: 'Permisos de salud no concedidos. Actívalos en Ajustes del dispositivo.',
    unavailable: 'Disponible en la app nativa (iOS/Android con build EAS), no en Expo Go.',
    connect: 'Conectar salud digital',
    syncing: 'Sincronizando…',
  },
  en: {
    title: 'Device habits',
    connected: 'Connected — we use aggregated sleep, steps and activity for observational patterns.',
    noData: 'Permissions granted — not enough data in this period yet.',
    disconnected: 'Connect digital health to see how your habits relate to your process.',
    permissionDenied: 'Health permissions were not granted. Enable them in device Settings.',
    unavailable: 'Available in the native app (iOS/Android EAS build), not in Expo Go.',
    connect: 'Connect digital health',
    syncing: 'Syncing…',
  },
};

export default function DigitalHealthStatusCard({
  compact = false,
  onConsentRequest,
  sourceSummary = null,
}) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const text = COPY[language === 'en' ? 'en' : 'es'];

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);
  const [consentEnabled, setConsentEnabled] = useState(false);
  const [lastSyncReason, setLastSyncReason] = useState(null);

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

  const runConnectFlow = useCallback(async () => {
    if (typeof onConsentRequest === 'function') {
      onConsentRequest();
      return;
    }
    try {
      setSyncing(true);
      const { requestNativeHealthPermissions } = await import(
        '../../services/digitalHealthBridge'
      );
      const granted = await requestNativeHealthPermissions();
      if (!granted) {
        setLastSyncReason(SYNC_REASON.PERMISSIONS_DENIED);
        showToast({ message: text.permissionDenied, type: 'warning' });
        return;
      }
      await signalsService.updateSignalConsent({
        digitalHealth: { enabled: true, steps: true, sleep: true, screenTime: false },
      });
      const sync = await syncDigitalHealthWithNative({ days: 14 });
      setLastSyncReason(sync.reason);
      if (sync.reason === SYNC_REASON.NO_DATA) {
        showToast({ message: text.noData, type: 'info' });
      }
      await load();
    } finally {
      setSyncing(false);
    }
  }, [load, onConsentRequest, showToast, text]);

  const body = useMemo(() => {
    if (!healthAvailable) return text.unavailable;
    if (!consentEnabled) return text.disconnected;
    if (lastSyncReason === SYNC_REASON.PERMISSIONS_DENIED) return text.permissionDenied;
    return hasRecentData ? text.connected : text.noData;
  }, [consentEnabled, hasRecentData, healthAvailable, lastSyncReason, text]);

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
              onPress={runConnectFlow}
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
