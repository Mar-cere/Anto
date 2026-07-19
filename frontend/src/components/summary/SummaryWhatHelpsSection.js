/**
 * Conexiones tema → técnica (top N), embebido en Tu resumen.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import chatService from '../../services/chatService';
import {
  formatGraphHumanStatus,
  formatGraphRowContext,
} from '../../screens/interventionGraphTexts';
import {
  filterPublicGraphInterventionEdges,
  resolveGraphInterventionLabel,
} from '../../utils/graphInterventionLabel';
import { resolveInterventionScreen } from '../../utils/interventionCatalogResolve';
import { recordInterventionClicked } from '../../utils/recordInterventionCompleted';

const MAX_ITEMS = 2;

function isActionableEdge(edge) {
  const completed = Number(edge?.completed) || 0;
  const dismissed = Number(edge?.dismissed) || 0;
  const clicked = Number(edge?.clicked) || 0;
  if (completed > 0) return false;
  if (dismissed > 0 && clicked === 0) return false;
  return true;
}

function actionabilityScore(edge) {
  if (Number(edge?.clicked) > 0) return 2;
  if (Number(edge?.shown) > 0) return 3;
  return 1;
}

function normalizeInterventionLabel(label, id) {
  return resolveGraphInterventionLabel(label, id);
}

export default function SummaryWhatHelpsSection() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const TEXTS = useSectionTranslations('TECHNIQUES');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: { marginTop: 20 },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: colors.primary,
          marginBottom: 8,
        },
        hint: {
          fontSize: 13,
          lineHeight: 19,
          color: colors.textSecondary,
          marginBottom: 10,
        },
        card: {
          borderRadius: 14,
          padding: SPACING.CARD_INNER_INSET,
          marginBottom: 8,
          backgroundColor: colors.glassFill || colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        cardRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        cardBody: {
          flex: 1,
        },
        title: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
        },
        context: {
          fontSize: 14,
          lineHeight: 20,
          color: colors.textSecondary,
        },
        status: {
          fontSize: 13,
          color: colors.primary,
          marginTop: 6,
          fontWeight: '500',
        },
        loading: { paddingVertical: SPACING.CHIP_INSET, alignItems: 'center' },
      }),
    [colors],
  );

  const sectionTitle =
    language === 'en' ? 'Worth revisiting' : 'Por si te sirve ahora';
  const sectionHint = null;

  const graphTexts = useMemo(
    () => ({
      ROW_CONTEXT: TEXTS.INTERVENTION_GRAPH_ROW_CONTEXT || 'Cuando hablas de {topic}',
      STATUS_COMPLETED: TEXTS.INTERVENTION_GRAPH_STATUS_COMPLETED,
      STATUS_COMPLETED_REPEAT: TEXTS.INTERVENTION_GRAPH_STATUS_COMPLETED_REPEAT,
      STATUS_EXPLORED: TEXTS.INTERVENTION_GRAPH_STATUS_EXPLORED,
      STATUS_DISMISSED: TEXTS.INTERVENTION_GRAPH_STATUS_DISMISSED,
      STATUS_SUGGESTED: TEXTS.INTERVENTION_GRAPH_STATUS_SUGGESTED,
    }),
    [TEXTS],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await chatService.getInterventionGraph({ days: 30, limit: 20 });
      const data = res?.data ?? res;
      const topicFreeEdges = filterPublicGraphInterventionEdges(
        Array.isArray(data?.topicFreeEdges) ? data.topicFreeEdges : [],
      );
      const edges = filterPublicGraphInterventionEdges(
        Array.isArray(data?.edges) ? data.edges : [],
      );
      const pool = topicFreeEdges.length > 0 ? topicFreeEdges : edges;
      const seenInterventions = new Set();
      const ranked = [...pool]
        .filter(isActionableEdge)
        .sort((a, b) => actionabilityScore(b) - actionabilityScore(a))
        .reduce((acc, edge) => {
          const interventionId = String(edge.interventionId || '').trim();
          if (interventionId && seenInterventions.has(interventionId)) return acc;
          if (interventionId) seenInterventions.add(interventionId);
          acc.push(edge);
          return acc;
        }, [])
        .slice(0, MAX_ITEMS)
        .map((edge) => {
          const intervention = normalizeInterventionLabel(
            edge.interventionLabel,
            edge.interventionId,
          );
          if (!intervention) return null;
          const topic = String(edge.displayLabel || edge.topicFree || edge.topicTag || '').trim();
          if (!topic) return null;
          return {
            key: `${topic}:${edge.interventionId}`,
            interventionId: String(edge.interventionId || '').trim(),
            topicTag: edge.topicTag || null,
            topicFree: edge.topicFree || null,
            intervention,
            topic: topic.length > 56 ? `${topic.slice(0, 55)}…` : topic,
            status: formatGraphHumanStatus(graphTexts, edge),
          };
        })
        .filter(Boolean);
      setItems(ranked);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [graphTexts]);

  useEffect(() => {
    load();
  }, [load]);

  const openIntervention = useCallback(
    (item) => {
      const target = resolveInterventionScreen(item?.interventionId);
      if (!target) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      recordInterventionClicked(item.interventionId, {
        ...(item.topicTag ? { topicTag: item.topicTag } : {}),
        ...(item.topicFree ? { topicFree: item.topicFree } : {}),
      });
      navigation.navigate(target.screen, target.params);
    },
    [navigation],
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!items.length) return null;

  return (
    <View style={styles.block} accessibilityRole="summary">
      <Text style={styles.kicker}>{sectionTitle}</Text>
      {sectionHint ? <Text style={styles.hint}>{sectionHint}</Text> : null}
      {items.map((item) => {
        const canOpen = Boolean(resolveInterventionScreen(item.interventionId));
        const body = (
          <View style={styles.cardBody}>
            <Text style={styles.title}>{item.intervention}</Text>
            <Text style={styles.context}>{formatGraphRowContext(graphTexts, item.topic)}</Text>
            {item.status ? <Text style={styles.status}>{item.status}</Text> : null}
          </View>
        );
        if (!canOpen) {
          return (
            <View key={item.key} style={styles.card}>
              {body}
            </View>
          );
        }
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.card, styles.cardRow]}
            onPress={() => openIntervention(item)}
            accessibilityRole="button"
            accessibilityLabel={item.intervention}
            activeOpacity={0.85}
          >
            {body}
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
