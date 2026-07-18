import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ParticleBackground from '../../components/ParticleBackground';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { SPACING } from '../../constants/ui';
import { useSectionTranslations } from '../../hooks/useTranslations';
import {
  archiveExperientialPattern,
  fetchExperientialPatterns,
  fetchExperientialPatternsConsent,
  setExperientialPatternsConsent,
} from '../../services/experientialPatternsService';

export default function ExperientialPatternsScreen() {
  const translated = useSectionTranslations('EXPERIENTIAL_PATTERNS');
  const T = useMemo(
    () => ({
      SCREEN_TITLE: translated?.SCREEN_TITLE || 'Memoria del proceso',
      SCREEN_INTRO:
        translated?.SCREEN_INTRO ||
        'Observaciones que Anto puede retomar con suavidad. Tú decides qué se archiva.',
      CONSENT_TITLE: translated?.CONSENT_TITLE || 'Recordar patrones de mi proceso',
      CONSENT_SUBTITLE:
        translated?.CONSENT_SUBTITLE ||
        'Permite que Anto retome observaciones con tu permiso.',
      EMPTY_TITLE: translated?.EMPTY_TITLE || 'Aún no hay patrones guardados',
      EMPTY_MESSAGE:
        translated?.EMPTY_MESSAGE ||
        'Cuando converses sobre temas que se repiten, podrán aparecer aquí.',
      LOADING: translated?.LOADING || 'Cargando…',
      ERROR_LOADING: translated?.ERROR_LOADING || 'No se pudo cargar',
      RETRY: translated?.RETRY || 'Reintentar',
      ARCHIVE: translated?.ARCHIVE || 'Archivar',
      ARCHIVE_CONFIRM_TITLE: translated?.ARCHIVE_CONFIRM_TITLE || 'Archivar patrón',
      ARCHIVE_CONFIRM_MESSAGE:
        translated?.ARCHIVE_CONFIRM_MESSAGE || 'Anto dejará de retomar este recuerdo.',
      ARCHIVE_CANCEL: translated?.ARCHIVE_CANCEL || 'Cancelar',
      ARCHIVE_CONFIRM: translated?.ARCHIVE_CONFIRM || 'Archivar',
      TOAST_ARCHIVED: translated?.TOAST_ARCHIVED || 'Patrón archivado',
      TOAST_ERROR: translated?.TOAST_ERROR || 'No se pudo completar.',
      TOAST_CONSENT_UPDATED: translated?.TOAST_CONSENT_UPDATED || 'Preferencia actualizada',
      BACK_A11Y: translated?.BACK_A11Y || 'Volver',
    }),
    [translated],
  );

  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [patterns, setPatterns] = useState([]);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingConsent, setSavingConsent] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.chromeHeader,
        },
        headerButton: { width: 40, alignItems: 'center', justifyContent: 'center' },
        headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
        content: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: SPACING.md,
          paddingBottom: insets.bottom + 40,
        },
        intro: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 16 },
        consentCard: {
          backgroundColor: colors.chromeCard,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
          padding: 14,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        consentTextWrap: { flex: 1 },
        consentTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
        consentSubtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
        card: {
          backgroundColor: colors.chromeCard,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
          padding: 14,
          marginBottom: 10,
        },
        statement: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 10 },
        archiveBtn: {
          alignSelf: 'flex-start',
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: colors.surfaceMuted || colors.chromeCard,
          borderWidth: 1,
          borderColor: colors.border,
        },
        archiveBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        emptyTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 8,
          textAlign: 'center',
        },
        emptyMessage: {
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          textAlign: 'center',
        },
        retry: {
          marginTop: 16,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: colors.primary,
        },
        retryText: { color: colors.textOnPrimary, fontWeight: '600' },
      }),
    [colors, insets.bottom],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, list] = await Promise.all([
        fetchExperientialPatternsConsent(),
        fetchExperientialPatterns({ activeOnly: true, limit: 30 }),
      ]);
      setConsent(c?.enabled === true);
      setPatterns(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onToggleConsent = async (value) => {
    setSavingConsent(true);
    try {
      const next = await setExperientialPatternsConsent(value);
      setConsent(next?.enabled === true);
      showToast?.(T.TOAST_CONSENT_UPDATED);
      if (value) await load();
    } catch {
      showToast?.(T.TOAST_ERROR);
    } finally {
      setSavingConsent(false);
    }
  };

  const onArchive = (item) => {
    Alert.alert(T.ARCHIVE_CONFIRM_TITLE, T.ARCHIVE_CONFIRM_MESSAGE, [
      { text: T.ARCHIVE_CANCEL, style: 'cancel' },
      {
        text: T.ARCHIVE_CONFIRM,
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveExperientialPattern(item.id);
            setPatterns((prev) => prev.filter((p) => p.id !== item.id));
            showToast?.(T.TOAST_ARCHIVED);
          } catch {
            showToast?.(T.TOAST_ERROR);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ParticleBackground />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={T.BACK_A11Y}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{T.SCREEN_TITLE}</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{T.LOADING}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyMessage}>{T.ERROR_LOADING}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>{T.RETRY}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={patterns}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <Text style={styles.intro}>{T.SCREEN_INTRO}</Text>
              <View style={styles.consentCard}>
                <View style={styles.consentTextWrap}>
                  <Text style={styles.consentTitle}>{T.CONSENT_TITLE}</Text>
                  <Text style={styles.consentSubtitle}>{T.CONSENT_SUBTITLE}</Text>
                </View>
                <Switch
                  value={consent}
                  onValueChange={onToggleConsent}
                  disabled={savingConsent}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  accessibilityLabel={T.CONSENT_TITLE}
                />
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>{T.EMPTY_TITLE}</Text>
              <Text style={styles.emptyMessage}>{T.EMPTY_MESSAGE}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.statement}>{item.statement}</Text>
              <TouchableOpacity
                style={styles.archiveBtn}
                onPress={() => onArchive(item)}
                accessibilityRole="button"
                accessibilityLabel={T.ARCHIVE}
              >
                <Text style={styles.archiveBtnText}>{T.ARCHIVE}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
