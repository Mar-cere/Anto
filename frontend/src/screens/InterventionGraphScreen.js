/**
 * Panel interno mínimo: grafo tema–intervención (#127) del usuario.
 */
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import chatService from '../services/chatService';

function pct(n) {
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

const InterventionGraphScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [edges, setEdges] = useState([]);
  const [windowDays, setWindowDays] = useState(14);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: SPACING.SCREEN_EDGE_INSET, paddingBottom: 48 },
        meta: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
        row: {
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
          backgroundColor: colors.cardBackground || colors.surface || colors.background,
        },
        rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
        rowSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
        error: { color: colors.error, fontSize: 14, marginBottom: 12 },
        retry: {
          alignSelf: 'flex-start',
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 8,
          backgroundColor: colors.primary,
        },
        retryText: { color: colors.white, fontWeight: '600' },
        center: { paddingVertical: 40, alignItems: 'center' },
      }),
    [colors],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await chatService.getInterventionGraph({ days: 14, limit: 60 });
      const data = res?.data ?? res;
      setWindowDays(data?.windowDays ?? 14);
      setEdges(Array.isArray(data?.edges) ? data.edges : []);
    } catch (e) {
      setError('No se pudo cargar el grafo de intervenciones.');
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header
        title="Grafo intervenciones"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        <Text style={styles.meta}>
          Ventana: últimos {windowDays} días · métricas por sesión lógica (shown/click/done)
        </Text>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={load}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </>
        ) : null}
        {loading && edges.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        {!loading && !error && edges.length === 0 ? (
          <Text style={styles.meta}>Sin datos aún. Usa sugerencias del chat y completa técnicas.</Text>
        ) : null}
        {edges.map((edge) => {
          const key = `${edge.topicTag}:${edge.interventionId}`;
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.rowTitle}>
                {edge.topicTag} → {edge.interventionId}
              </Text>
              <Text style={styles.rowSub}>
                shown {edge.shown ?? 0} · click {edge.clicked ?? 0} · dismiss {edge.dismissed ?? 0} · done{' '}
                {edge.completed ?? 0}
              </Text>
              <Text style={styles.rowSub}>
                CTR {pct(edge.ctr)} · completación {pct(edge.completionRate)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InterventionGraphScreen;
