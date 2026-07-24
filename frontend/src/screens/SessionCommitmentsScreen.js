/**
 * Mis compromisos (#234 / v1.1): lista completa activos, cerrados, omitidos y archivados.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ParticleBackground from '../components/ParticleBackground';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { SPACING } from '../constants/ui';
import { useSectionTranslations } from '../hooks/useTranslations';
import {
  fetchSessionCommitments,
  renegotiateSessionCommitment,
  updateSessionCommitment,
} from '../services/sessionCommitmentsService';
import { buildCommitmentDisplayTitle } from '../utils/commitmentDisplayCopy';
import {
  dispatchResetToMainTabsWithChat,
} from '../navigation/navigationHelpers';

const FILTERS = [
  { key: 'active', statuses: ['active'] },
  { key: 'done', statuses: ['completed', 'skipped', 'archived'] },
  { key: 'all', statuses: null },
];

function statusLabel(status, T) {
  if (status === 'active') return T.STATUS_ACTIVE;
  if (status === 'completed') return T.STATUS_COMPLETED;
  if (status === 'skipped') return T.STATUS_SKIPPED;
  if (status === 'archived') return T.STATUS_ARCHIVED;
  return status;
}

export default function SessionCommitmentsScreen() {
  const translated = useSectionTranslations('SESSION_COMMITMENTS');
  const DASH = useSectionTranslations('DASH');
  const T = useMemo(
    () => ({
      SCREEN_TITLE: translated?.SCREEN_TITLE || 'Mis compromisos',
      SCREEN_INTRO:
        translated?.SCREEN_INTRO ||
        'Lo que quedó para retomar. Puedes cerrar, ajustar u omitir sin culpa.',
      FILTER_ACTIVE: translated?.FILTER_ACTIVE || 'Activos',
      FILTER_DONE: translated?.FILTER_DONE || 'Cerrados',
      FILTER_ALL: translated?.FILTER_ALL || 'Todos',
      SEARCH_PLACEHOLDER: translated?.SEARCH_PLACEHOLDER || 'Buscar…',
      EMPTY_TITLE: translated?.EMPTY_TITLE || 'Aún no hay compromisos',
      EMPTY_MESSAGE:
        translated?.EMPTY_MESSAGE ||
        'Cuando guardes un acuerdo al cerrar una charla, aparecerá aquí.',
      LOADING: translated?.LOADING || 'Cargando…',
      ERROR_LOADING: translated?.ERROR_LOADING || 'No se pudieron cargar',
      RETRY: translated?.RETRY || 'Reintentar',
      MARK_DONE: translated?.MARK_DONE || 'Marcar hecho',
      OMIT: translated?.OMIT || DASH?.FOCUS_COMMITMENT_OMIT || 'Omitir por ahora',
      ADJUST: translated?.ADJUST || DASH?.FOCUS_COMMITMENT_RENEGOTIATE || 'Ajustar',
      OPEN_CHAT: translated?.OPEN_CHAT || 'Abrir chat',
      STATUS_ACTIVE: translated?.STATUS_ACTIVE || 'Activo',
      STATUS_COMPLETED: translated?.STATUS_COMPLETED || 'Hecho',
      STATUS_SKIPPED: translated?.STATUS_SKIPPED || 'Omitido',
      STATUS_ARCHIVED: translated?.STATUS_ARCHIVED || 'Archivado',
      PARTIAL_BADGE: translated?.PARTIAL_BADGE || 'En parte',
      TOAST_ERROR: translated?.TOAST_ERROR || DASH?.FOCUS_COMMITMENT_ACTION_ERROR,
      BACK_A11Y: translated?.BACK_A11Y || 'Volver',
      SAVE_ADJUST: translated?.SAVE_ADJUST || DASH?.FOCUS_COMMITMENT_RENEGOTIATE_SAVE || 'Guardar',
    }),
    [translated, DASH],
  );

  const { colors, statusBarStyle } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterKey, setFilterKey] = useState('active');
  const [query, setQuery] = useState('');
  const [renegotiateId, setRenegotiateId] = useState(null);
  const [renegotiateLabel, setRenegotiateLabel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSessionCommitments({ status: 'all', limit: 20 });
      setItems(Array.isArray(list) ? list : []);
    } catch (_) {
      setError(T.ERROR_LOADING);
    } finally {
      setLoading(false);
    }
  }, [T.ERROR_LOADING]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          backgroundColor: colors.chromeHeader,
        },
        headerButton: { width: 40, alignItems: 'center', justifyContent: 'center' },
        headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
        content: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: SPACING.HERO_INSET,
          paddingBottom: insets.bottom + SPACING.xxl,
        },
        intro: {
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 21,
          marginBottom: 14,
        },
        search: {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeCardBorder || colors.border,
          backgroundColor: colors.chromeCard,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.text,
          fontSize: 15,
          marginBottom: 12,
        },
        filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
        filterChip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.chromeCard,
        },
        filterChipActive: {
          borderColor: colors.primary,
          backgroundColor: colors.accentLineSoft,
        },
        filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
        filterTextActive: { color: colors.primary },
        card: {
          backgroundColor: colors.chromeCard,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeCardBorder || colors.border,
          padding: SPACING.CARD_INNER_INSET,
          marginBottom: 10,
        },
        label: { fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 21 },
        meta: { marginTop: 6, fontSize: 12, color: colors.textSecondary },
        note: { marginTop: 6, fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
        actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: colors.accentLineSoft,
        },
        chipText: { fontSize: 13, fontWeight: '700', color: colors.primary },
        emptyTitle: {
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 8,
          textAlign: 'center',
        },
        emptyMessage: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        center: { paddingTop: 48, alignItems: 'center' },
        input: {
          marginTop: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
          color: colors.text,
          fontSize: 14,
        },
      }),
    [colors, insets.bottom],
  );

  const filtered = useMemo(() => {
    const filter = FILTERS.find((f) => f.key === filterKey) || FILTERS[0];
    const q = String(query || '').trim().toLowerCase();
    return items.filter((item) => {
      if (filter.statuses && !filter.statuses.includes(item.status)) return false;
      if (!q) return true;
      const hay = `${item.label || ''} ${item.partialNote || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filterKey, query]);

  const runAction = useCallback(
    async (fn) => {
      try {
        await fn();
        await load();
      } catch (_) {
        showToast({ message: T.TOAST_ERROR, type: 'error' });
      }
    },
    [load, showToast, T.TOAST_ERROR],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const title = buildCommitmentDisplayTitle(item, DASH);
      const isActive = item.status === 'active';
      return (
        <View style={styles.card}>
          <Text style={styles.label}>{title}</Text>
          <Text style={styles.meta}>
            {statusLabel(item.status, T)}
            {item.followUpAnswer === 'partial' ? ` · ${T.PARTIAL_BADGE}` : ''}
          </Text>
          {item.partialNote ? <Text style={styles.note}>{item.partialNote}</Text> : null}
          {renegotiateId === item.id ? (
            <>
              <TextInput
                style={styles.input}
                value={renegotiateLabel}
                onChangeText={setRenegotiateLabel}
                accessibilityLabel={T.ADJUST}
              />
              <View style={styles.actions}>
                <Pressable
                  style={styles.chip}
                  onPress={() =>
                    runAction(async () => {
                      await renegotiateSessionCommitment(item.id, {
                        label: renegotiateLabel,
                      });
                      setRenegotiateId(null);
                      setRenegotiateLabel('');
                    })
                  }
                >
                  <Text style={styles.chipText}>{T.SAVE_ADJUST}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.actions}>
              {isActive ? (
                <>
                  <Pressable
                    style={styles.chip}
                    onPress={() =>
                      runAction(() =>
                        updateSessionCommitment(item.id, { followUpAnswer: 'yes' }),
                      )
                    }
                  >
                    <Text style={styles.chipText}>{T.MARK_DONE}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.chip}
                    onPress={() => {
                      setRenegotiateId(item.id);
                      setRenegotiateLabel(String(item.label || ''));
                    }}
                  >
                    <Text style={styles.chipText}>{T.ADJUST}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.chip}
                    onPress={() =>
                      runAction(() => updateSessionCommitment(item.id, { status: 'skipped' }))
                    }
                  >
                    <Text style={styles.chipText}>{T.OMIT}</Text>
                  </Pressable>
                </>
              ) : null}
              {item.conversationId ? (
                <Pressable
                  style={styles.chip}
                  onPress={() =>
                    dispatchResetToMainTabsWithChat(navigation, {
                      conversationId: String(item.conversationId),
                    })
                  }
                >
                  <Text style={styles.chipText}>{T.OPEN_CHAT}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      );
    },
    [DASH, T, styles, renegotiateId, renegotiateLabel, runAction, navigation],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBarStyle} />
      <ParticleBackground />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={T.BACK_A11Y}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{T.SCREEN_TITLE}</Text>
        <View style={styles.headerButton} />
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.emptyMessage, { marginTop: 12 }]}>{T.LOADING}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{error}</Text>
          <Pressable style={styles.chip} onPress={load}>
            <Text style={styles.chipText}>{T.RETRY}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <Text style={styles.intro}>{T.SCREEN_INTRO}</Text>
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder={T.SEARCH_PLACEHOLDER}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={T.SEARCH_PLACEHOLDER}
              />
              <View style={styles.filters}>
                {[
                  { key: 'active', label: T.FILTER_ACTIVE },
                  { key: 'done', label: T.FILTER_DONE },
                  { key: 'all', label: T.FILTER_ALL },
                ].map((f) => (
                  <Pressable
                    key={f.key}
                    style={[styles.filterChip, filterKey === f.key && styles.filterChipActive]}
                    onPress={() => setFilterKey(f.key)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filterKey === f.key && styles.filterTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>{T.EMPTY_TITLE}</Text>
              <Text style={styles.emptyMessage}>{T.EMPTY_MESSAGE}</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
