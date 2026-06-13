/**
 * Grafo tema–intervención (#127 / visual #218).
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
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import InterventionGraphVisual from '../components/intervention/InterventionGraphVisual';
import ParticleBackground from '../components/ParticleBackground';
import { SPACING } from '../constants/ui';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import chatService from '../services/chatService';
import {
  buildInterventionGraphModel,
  formatTopicTagLabel,
} from '../utils/interventionGraphLayout';
import {
  formatGraphMeta,
  formatGraphMetrics,
  formatGraphRates,
  useInterventionGraphTexts,
} from './interventionGraphTexts';

function pct(n) {
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

const InterventionGraphScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const { language } = useLanguage();
  const TEXTS = useInterventionGraphTexts();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [edges, setEdges] = useState([]);
  const [windowDays, setWindowDays] = useState(30);
  const [viewMode, setViewMode] = useState('graph');
  const [selectedKey, setSelectedKey] = useState(null);
  const { width: windowWidth } = useWindowDimensions();

  const graphWidth = useMemo(
    () => Math.min(windowWidth - SPACING.SCREEN_EDGE_INSET * 2, 400),
    [windowWidth],
  );

  const hasVisualGraph = useMemo(() => {
    if (!edges.length) return false;
    return buildInterventionGraphModel(edges, { canvasWidth: graphWidth }).links.length > 0;
  }, [edges, graphWidth]);

  const selectedEdge = useMemo(
    () => edges.find((e) => `${e.topicTag}:${e.interventionId}` === selectedKey) || null,
    [edges, selectedKey],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: SPACING.SCREEN_EDGE_INSET, paddingBottom: 48 },
        meta: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 18 },
        toggleRow: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 16,
        },
        toggleBtn: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          alignItems: 'center',
        },
        toggleBtnActive: {
          backgroundColor: colors.accentLineSoft,
          borderColor: colors.primary,
        },
        toggleText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
        toggleTextActive: { color: colors.primary },
        legend: {
          fontSize: 12,
          color: colors.textSecondary,
          marginBottom: 12,
          lineHeight: 17,
        },
        row: {
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
          backgroundColor: colors.cardBackground || colors.surface || colors.background,
        },
        rowSelected: {
          borderColor: colors.primary,
          borderWidth: 1.5,
        },
        rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
        rowSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
        detail: {
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.primary,
        },
        detailTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 },
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
      const res = await chatService.getInterventionGraph({ days: 30, limit: 60 });
      const data = res?.data ?? res;
      setWindowDays(data?.windowDays ?? 30);
      setEdges(Array.isArray(data?.edges) ? data.edges : []);
      setSelectedKey(null);
    } catch {
      setError(TEXTS.ERROR);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [TEXTS.ERROR]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderEdgeRow = (edge) => {
    const key = `${edge.topicTag}:${edge.interventionId}`;
    const label = edge.interventionLabel || edge.interventionId;
    const topicLabel = formatTopicTagLabel(edge.topicTag, language);
    const isSelected = selectedKey === key;
    return (
      <TouchableOpacity
        key={key}
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => setSelectedKey((prev) => (prev === key ? null : key))}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <Text style={styles.rowTitle}>
          {topicLabel} → {label}
        </Text>
        <Text style={styles.rowSub}>{formatGraphMetrics(TEXTS, edge)}</Text>
        <Text style={styles.rowSub}>{formatGraphRates(TEXTS, edge, pct)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} testID="intervention-graph-screen">
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
      >
        <Text style={styles.meta}>{formatGraphMeta(TEXTS, windowDays)}</Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'graph' && styles.toggleBtnActive]}
            onPress={() => setViewMode('graph')}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'graph' }}
          >
            <Text style={[styles.toggleText, viewMode === 'graph' && styles.toggleTextActive]}>
              {TEXTS.VIEW_GRAPH}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'list' }}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              {TEXTS.VIEW_LIST}
            </Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={load}>
              <Text style={styles.retryText}>{TEXTS.RETRY}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {loading && edges.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {!loading && !error && edges.length === 0 ? (
          <Text style={styles.meta}>{TEXTS.EMPTY}</Text>
        ) : null}

        {!error && edges.length > 0 && viewMode === 'graph' && hasVisualGraph ? (
          <>
            <Text style={styles.legend}>{TEXTS.LEGEND}</Text>
            <InterventionGraphVisual
              edges={edges}
              language={language}
              width={graphWidth}
              selectedKey={selectedKey}
              mapAccessibilityLabel={TEXTS.MAP_A11Y}
              onSelectLink={(link) =>
                setSelectedKey((prev) => (prev === link.key ? null : link.key))
              }
            />
            {selectedEdge ? (
              <View style={styles.detail}>
                <Text style={styles.detailTitle}>
                  {formatTopicTagLabel(selectedEdge.topicTag, language)} →{' '}
                  {selectedEdge.interventionLabel || selectedEdge.interventionId}
                </Text>
                <Text style={styles.rowSub}>{formatGraphMetrics(TEXTS, selectedEdge)}</Text>
                <Text style={styles.rowSub}>{formatGraphRates(TEXTS, selectedEdge, pct)}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {!error && edges.length > 0 && viewMode === 'list' ? edges.map(renderEdgeRow) : null}

        {!error && edges.length > 0 && viewMode === 'graph' ? (
          <View accessibilityRole="list" accessibilityLabel={TEXTS.LIST_A11Y}>
            {(hasVisualGraph ? edges.slice(0, 8) : edges).map(renderEdgeRow)}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InterventionGraphScreen;
