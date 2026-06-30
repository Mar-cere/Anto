/**
 * Grafo tema–intervención (#127 / visual #218).
 */
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import InterventionGraphStatePanel from '../components/intervention/InterventionGraphStatePanel';
import InterventionGraphVisual from '../components/intervention/InterventionGraphVisual';
import DashboardBrandBackdrop from '../components/dashboard/DashboardBrandBackdrop';
import { SPACING } from '../constants/ui';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import chatService from '../services/chatService';
import {
  buildInterventionGraphViewModel,
  pickPrimaryGraphLink,
} from '../utils/interventionGraphLayout';
import {
  filterPublicGraphCorrelations,
  filterPublicGraphInterventionEdges,
} from '../utils/graphInterventionLabel';
import { resolveInterventionScreen } from '../utils/interventionCatalogResolve';
import { recordInterventionClicked } from '../utils/recordInterventionCompleted';
import {
  formatGraphMeta,
  formatGraphHumanStatus,
  formatGraphRowContext,
  formatCorrelationInsight,
  formatGraphListInterventionTitle,
  resolveGraphEdgeTopicLabel,
  useInterventionGraphTexts,
} from './interventionGraphTexts';

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
  const [windowDays, setWindowDays] = useState(30);
  const [viewMode, setViewMode] = useState('graph');
  const [selectedKey, setSelectedKey] = useState(null);
  const didAutoSelectPrimaryRef = useRef(false);
  const { width: windowWidth } = useWindowDimensions();

  const graphWidth = useMemo(
    () => Math.max(windowWidth - SPACING.SCREEN_EDGE_INSET * 2, 280),
    [windowWidth],
  );

  const hasListData = useMemo(
    () => edges.length > 0 || topicFreeEdges.length > 0 || conceptEdges.length > 0,
    [edges.length, topicFreeEdges.length, conceptEdges.length],
  );

  const hasVisualGraph = useMemo(() => {
    return buildInterventionGraphViewModel(edges, topicFreeEdges, {
      canvasWidth: graphWidth,
      conceptNodes,
      conceptEdges,
    }).links.length > 0;
  }, [edges, topicFreeEdges, conceptNodes, conceptEdges, graphWidth]);

  const showStatePanel =
    loading && !hasListData
      ? 'loading'
      : error && !hasListData
        ? 'error'
        : !loading && !hasListData
          ? 'empty'
          : null;

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
        rowStatus: {
          fontSize: 13,
          color: colors.primary,
          lineHeight: 18,
          marginTop: 6,
          fontWeight: '500',
        },
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
        detailCta: {
          marginTop: 12,
          alignSelf: 'flex-start',
          paddingVertical: 9,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: colors.primary,
        },
        detailCtaText: { color: colors.textOnPrimary || colors.white, fontWeight: '700', fontSize: 13 },
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
      didAutoSelectPrimaryRef.current = false;
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

  useEffect(() => {
    if (
      didAutoSelectPrimaryRef.current ||
      loading ||
      viewMode !== 'graph' ||
      !hasVisualGraph
    ) {
      return;
    }
    const model = buildInterventionGraphViewModel(edges, topicFreeEdges, {
      canvasWidth: graphWidth,
      conceptNodes,
      conceptEdges,
      language,
    });
    const primary = pickPrimaryGraphLink(model.links);
    if (primary?.key) {
      setSelectedKey(primary.key);
      didAutoSelectPrimaryRef.current = true;
    }
  }, [
    loading,
    viewMode,
    hasVisualGraph,
    edges,
    topicFreeEdges,
    conceptNodes,
    conceptEdges,
    graphWidth,
    language,
  ]);

  const openIntervention = useCallback(
    (edge) => {
      if (!edge) return;
      const target = resolveInterventionScreen(edge.interventionId);
      if (!target) return;
      recordInterventionClicked(edge.interventionId, {
        ...(edge.topicTag ? { topicTag: edge.topicTag } : {}),
        ...(edge.topicFree ? { topicFree: edge.topicFree } : {}),
      });
      navigation.navigate(target.screen, target.params);
    },
    [navigation],
  );

  const renderEdgeRow = (edge, { topicFree = false } = {}) => {
    const interventionTitle = formatGraphListInterventionTitle(
      edge.interventionLabel,
      edge.interventionId,
    );
    if (!interventionTitle) return null;
    const key = topicFree
      ? `tf:${edge.topicFree}:${edge.interventionId}`
      : `${edge.topicTag}:${edge.interventionId}`;
    const topicLabel = resolveGraphEdgeTopicLabel(edge, language);
    const isSelected = selectedKey === key;
    const status = formatGraphHumanStatus(TEXTS, edge);
    return (
      <TouchableOpacity
        key={key}
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => setSelectedKey((prev) => (prev === key ? null : key))}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <Text style={styles.rowTitle}>{interventionTitle}</Text>
        {topicLabel ? (
          <Text style={styles.rowSub}>{formatGraphRowContext(TEXTS, topicLabel)}</Text>
        ) : null}
        {status ? <Text style={styles.rowStatus}>{status}</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} testID="intervention-graph-screen">
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <DashboardBrandBackdrop />
      <Header title={TEXTS.TITLE} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
      >
        <Text style={styles.meta}>{formatGraphMeta(TEXTS, windowDays)}</Text>

        {correlations.length > 0 && showStatePanel !== 'error' ? (
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

        {showStatePanel ? (
          <InterventionGraphStatePanel
            variant={showStatePanel}
            title={
              showStatePanel === 'loading'
                ? TEXTS.LOADING
                : showStatePanel === 'error'
                  ? TEXTS.ERROR_TITLE
                  : TEXTS.EMPTY_TITLE
            }
            body={
              showStatePanel === 'loading'
                ? null
                : showStatePanel === 'error'
                  ? TEXTS.ERROR_HINT || TEXTS.ERROR
                  : TEXTS.EMPTY_HINT || TEXTS.EMPTY
            }
            primaryLabel={
              showStatePanel === 'error'
                ? TEXTS.RETRY
                : showStatePanel === 'empty'
                  ? TEXTS.CTA_CHAT
                  : null
            }
            onPrimary={
              showStatePanel === 'error'
                ? load
                : showStatePanel === 'empty'
                  ? () => navigation.navigate('MainTabs', { screen: 'Chat' })
                  : null
            }
            secondaryLabel={showStatePanel === 'empty' ? TEXTS.CTA_TECHNIQUES : null}
            onSecondary={
              showStatePanel === 'empty'
                ? () => navigation.navigate('TherapeuticTechniques')
                : null
            }
          />
        ) : (
          <>
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
                  const interventionTitle = formatGraphListInterventionTitle(
                    selectedEdge.interventionLabel,
                    selectedEdge.interventionId,
                  );
                  const topicLabel = resolveGraphEdgeTopicLabel(selectedEdge, language);
                  const status = formatGraphHumanStatus(TEXTS, selectedEdge);
                  const rawSnippet = String(
                    selectedEdge.conceptLabel || selectedEdge.topicFree || '',
                  ).trim();
                  const displaySnippet = String(
                    selectedEdge.displayLabel ||
                      topicFreeEdges.find((e) => e.topicFree === rawSnippet)?.displayLabel ||
                      rawSnippet,
                  ).trim();
                  return (
                    <>
                      <Text style={styles.detailTitle}>{interventionTitle}</Text>
                      {topicLabel ? (
                        <Text style={styles.rowSub}>
                          {formatGraphRowContext(TEXTS, topicLabel)}
                        </Text>
                      ) : (
                        <Text style={styles.rowSub}>{TEXTS.CONNECTION_HELP}</Text>
                      )}
                      {status ? <Text style={styles.rowStatus}>{status}</Text> : null}
                      {rawSnippet && displaySnippet && rawSnippet !== displaySnippet ? (
                        <Text style={[styles.rowSub, { marginTop: 8 }]}>
                          {TEXTS.ORIGINAL_SNIPPET}: «{rawSnippet}»
                        </Text>
                      ) : null}
                    </>
                  );
                })()}
                {resolveInterventionScreen(selectedEdge.interventionId) ? (
                  <TouchableOpacity
                    style={styles.detailCta}
                    onPress={() => openIntervention(selectedEdge)}
                    accessibilityRole="button"
                    accessibilityLabel={TEXTS.OPEN_TECHNIQUE}
                  >
                    <Text style={styles.detailCtaText}>{TEXTS.OPEN_TECHNIQUE}</Text>
                  </TouchableOpacity>
                ) : null}
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InterventionGraphScreen;
