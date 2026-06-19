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
  buildInterventionGraphViewModel,
  formatTopicTagLabel,
} from '../utils/interventionGraphLayout';
import {
  filterPublicGraphCorrelations,
  filterPublicGraphInterventionEdges,
  resolveGraphInterventionLabel,
} from '../utils/graphInterventionLabel';
import {
  formatGraphMeta,
  formatGraphMetrics,
  formatGraphRates,
  formatCorrelationInsight,
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
  const [topicFreeEdges, setTopicFreeEdges] = useState([]);
  const [conceptNodes, setConceptNodes] = useState([]);
  const [conceptEdges, setConceptEdges] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [vectorSearchMode, setVectorSearchMode] = useState('off');
  const [embeddingsEnabled, setEmbeddingsEnabled] = useState(false);
  const [windowDays, setWindowDays] = useState(30);
  const [viewMode, setViewMode] = useState('graph');
  const [selectedKey, setSelectedKey] = useState(null);
  const { width: windowWidth } = useWindowDimensions();

  const graphWidth = useMemo(
    () => Math.max(windowWidth - SPACING.SCREEN_EDGE_INSET * 2, 280),
    [windowWidth],
  );

  const hasVisualGraph = useMemo(() => {
    if (!edges.length && !topicFreeEdges.length && !conceptEdges.length) return false;
    return buildInterventionGraphViewModel(edges, topicFreeEdges, {
      canvasWidth: graphWidth,
      conceptNodes,
      conceptEdges,
    }).links.length > 0;
  }, [edges, topicFreeEdges, conceptNodes, conceptEdges, graphWidth]);

  const selectedEdge = useMemo(() => {
    if (!selectedKey) return null;
    const fromConcept = conceptEdges.find(
      (e) => `c:${e.conceptId}:${e.interventionId}` === selectedKey,
    );
    if (fromConcept) {
      const concept = conceptNodes.find((n) => n.id === fromConcept.conceptId);
      return {
        ...fromConcept,
        topicFree: concept?.label,
        conceptLabel: concept?.label,
      };
    }
    const fromTopicFree = topicFreeEdges.find(
      (e) => `tf:${e.topicFree}:${e.interventionId}` === selectedKey,
    );
    if (fromTopicFree) return fromTopicFree;
    return edges.find((e) => `${e.topicTag}:${e.interventionId}` === selectedKey) || null;
  }, [edges, topicFreeEdges, conceptEdges, conceptNodes, selectedKey]);

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
        insight: {
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          backgroundColor: colors.cardBackground || colors.surface || colors.background,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        insightTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
        insightRow: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
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
      setEdges(filterPublicGraphInterventionEdges(Array.isArray(data?.edges) ? data.edges : []));
      setTopicFreeEdges(
        filterPublicGraphInterventionEdges(Array.isArray(data?.topicFreeEdges) ? data.topicFreeEdges : []),
      );
      setConceptNodes(Array.isArray(data?.conceptNodes) ? data.conceptNodes : []);
      setConceptEdges(
        filterPublicGraphInterventionEdges(Array.isArray(data?.conceptEdges) ? data.conceptEdges : []),
      );
      setCorrelations(
        filterPublicGraphCorrelations(Array.isArray(data?.correlations) ? data.correlations : []),
      );
      setVectorSearchMode(String(data?.vectorSearchMode || data?.features?.vectorSearch?.mode || 'off'));
      setEmbeddingsEnabled(data?.embeddingsEnabled === true);
      setSelectedKey(null);
    } catch {
      setError(TEXTS.ERROR);
      setEdges([]);
      setTopicFreeEdges([]);
      setConceptNodes([]);
      setConceptEdges([]);
      setCorrelations([]);
    } finally {
      setLoading(false);
    }
  }, [TEXTS.ERROR]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderEdgeRow = (edge, { topicFree = false } = {}) => {
    const label = resolveGraphInterventionLabel(edge.interventionLabel, edge.interventionId);
    if (!label) return null;
    const key = topicFree
      ? `tf:${edge.topicFree}:${edge.interventionId}`
      : `${edge.topicTag}:${edge.interventionId}`;
    const rawTopic = String(edge.topicFree || '').trim();
    const displayTopic = String(edge.displayLabel || rawTopic).trim();
    const topicLabel = topicFree
      ? `"${displayTopic.length > 56 ? `${displayTopic.slice(0, 55)}…` : displayTopic}"`
      : formatTopicTagLabel(edge.topicTag, language);
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
        {embeddingsEnabled ? (
          <Text style={[styles.legend, { marginTop: -8 }]}>
            {vectorSearchMode === 'atlas'
              ? TEXTS.VECTOR_ATLAS_ON
              : vectorSearchMode === 'scan'
                ? TEXTS.VECTOR_SCAN_ON
                : TEXTS.EMBEDDINGS_ON}
          </Text>
        ) : null}

        {correlations.length > 0 ? (
          <View style={styles.insight}>
            <Text style={styles.insightTitle}>{TEXTS.INSIGHTS_TITLE}</Text>
            {correlations.slice(0, 4).map((row, index) => {
              const insight = formatCorrelationInsight(TEXTS, row, language);
              if (!insight) return null;
              return (
                <Text
                  key={`${row.type}-${row.sourceId}-${row.targetId}-${index}`}
                  style={styles.insightRow}
                >
                  {insight}
                </Text>
              );
            })}
            <Text style={[styles.legend, { marginBottom: 0, marginTop: 6 }]}>{TEXTS.INSIGHTS_DISCLAIMER}</Text>
          </View>
        ) : null}

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

        {!loading && !error && edges.length === 0 && topicFreeEdges.length === 0 ? (
          <Text style={styles.meta}>{TEXTS.EMPTY}</Text>
        ) : null}

        {!error && (edges.length > 0 || topicFreeEdges.length > 0) && viewMode === 'graph' && hasVisualGraph ? (
          <>
            <Text style={styles.legend}>
              {conceptEdges.length > 0
                ? TEXTS.LEGEND_CONCEPT
                : topicFreeEdges.length > 0
                  ? TEXTS.LEGEND_TOPIC_FREE
                  : TEXTS.LEGEND}
            </Text>
            <InterventionGraphVisual
              edges={edges}
              topicFreeEdges={topicFreeEdges}
              conceptNodes={conceptNodes}
              conceptEdges={conceptEdges}
              language={language}
              width={graphWidth}
              selectedKey={selectedKey}
              mapAccessibilityLabel={TEXTS.MAP_A11Y}
              sourceColumnLabel={TEXTS.MAP_SOURCE_COL}
              targetColumnLabel={TEXTS.MAP_TARGET_COL}
              onSelectLink={(link) =>
                setSelectedKey((prev) => (prev === link.key ? null : link.key))
              }
            />
            <Text style={[styles.legend, { marginTop: -4, marginBottom: 12 }]}>
              {TEXTS.MAP_TAP_HINT}
            </Text>
            {selectedEdge ? (
              <View style={styles.detail}>
                {(() => {
                  const rawSnippet = String(
                    selectedEdge.conceptLabel || selectedEdge.topicFree || '',
                  ).trim();
                  const displaySnippet = String(
                    selectedEdge.displayLabel ||
                      topicFreeEdges.find((e) => e.topicFree === rawSnippet)?.displayLabel ||
                      rawSnippet,
                  ).trim();
                  const titleLeft = rawSnippet
                    ? `"${displaySnippet}"`
                    : formatTopicTagLabel(selectedEdge.topicTag, language);
                  return (
                    <>
                      <Text style={styles.detailTitle}>
                        {titleLeft} →{' '}
                        {resolveGraphInterventionLabel(
                          selectedEdge.interventionLabel,
                          selectedEdge.interventionId,
                        ) || selectedEdge.interventionLabel || selectedEdge.interventionId}
                      </Text>
                      {rawSnippet && displaySnippet && rawSnippet !== displaySnippet ? (
                        <Text style={styles.rowSub}>
                          {TEXTS.ORIGINAL_SNIPPET}: «{rawSnippet}»
                        </Text>
                      ) : null}
                    </>
                  );
                })()}
                <Text style={styles.rowSub}>{formatGraphMetrics(TEXTS, selectedEdge)}</Text>
                <Text style={styles.rowSub}>{formatGraphRates(TEXTS, selectedEdge, pct)}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {!error && (edges.length > 0 || topicFreeEdges.length > 0) && viewMode === 'list' ? (
          <>
            {topicFreeEdges.length > 0 ? (
              <>
                <Text style={styles.legend}>{TEXTS.TOPIC_FREE_SECTION}</Text>
                {topicFreeEdges.map((edge) => renderEdgeRow(edge, { topicFree: true }))}
              </>
            ) : null}
            {edges.length > 0 ? edges.map((edge) => renderEdgeRow(edge)) : null}
            {conceptEdges.length > 0 && topicFreeEdges.length === 0 && edges.length === 0
              ? conceptEdges.map((edge) => {
                  const concept = conceptNodes.find((n) => n.id === edge.conceptId);
                  return renderEdgeRow(
                    { ...edge, topicFree: concept?.label || edge.conceptId },
                    { topicFree: true },
                  );
                })
              : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InterventionGraphScreen;
