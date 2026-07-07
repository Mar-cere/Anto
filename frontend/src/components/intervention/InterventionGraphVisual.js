/**
 * Grafo bipartito tema → intervención (#218) con nodos legibles y conexiones curvas.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText, TSpan } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import {
  buildInterventionGraphViewModel,
  localizeGraphModel,
  nodeParticipatesInGraphLink,
  normalizeStrokeWidth,
  pickPrimaryGraphLink,
  pickStrongestLinkForSourceNode,
  pickStrongestLinkForTargetNode,
} from '../../utils/interventionGraphLayout';

function bezierPath(x1, y1, x2, y2) {
  const bend = Math.max(28, Math.abs(x2 - x1) * 0.38);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}

function nodeIsSelected(node, selectedKey, links) {
  if (!selectedKey || !node?.id) return false;
  const link = links.find((l) => l.key === selectedKey);
  if (!link) return false;
  return nodeParticipatesInGraphLink(node.id, link);
}

function resolveLinkVisual(link, { selectedKey, primaryLinkKey }) {
  const isSelected = Boolean(selectedKey && link.key === selectedKey);
  const isPrimaryIdle = !selectedKey && primaryLinkKey && link.key === primaryLinkKey;

  if (isSelected) {
    return { opacity: 0.96, widthBoost: 1.2 };
  }
  if (isPrimaryIdle) {
    return { opacity: 0.9, widthBoost: 1.05 };
  }
  if (selectedKey) {
    return { opacity: 0.12, widthBoost: 0.85 };
  }
  return { opacity: 0.2, widthBoost: 0.9 };
}

function GraphNodePill({
  node,
  colors,
  resolvedScheme,
  selected,
  dimmed,
  variant,
  onPress,
}) {
  const isSource = variant === 'source';
  const dimFactor = dimmed ? 0.45 : 1;
  const fill =
    selected
      ? resolvedScheme === 'dark'
        ? 'rgba(59, 130, 246, 0.28)'
        : 'rgba(30, 131, 211, 0.18)'
      : isSource
        ? resolvedScheme === 'dark'
          ? `rgba(255,255,255,${0.08 * dimFactor})`
          : `rgba(255,255,255,${0.92 * dimFactor})`
        : resolvedScheme === 'dark'
          ? `rgba(59, 130, 246, ${0.12 * dimFactor})`
          : `rgba(30, 131, 211, ${0.08 * dimFactor})`;
  const stroke = selected ? colors.primary : colors.border ?? 'rgba(128,128,128,0.3)';
  const strokeWidth = selected ? 2 : 1;
  const textColor = dimmed ? colors.textSecondary : colors.text;
  const textX = node.x + 12;
  const lineStartY = node.y + 18;

  return (
    <>
      <Rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx={12}
        ry={12}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onPress={onPress}
      />
      <SvgText fill={textColor} fontSize={12} fontWeight="600" opacity={dimmed ? 0.72 : 1}>
        {(node.lines || [node.label]).map((line, index) => (
          <TSpan
            key={`${node.id}-${index}`}
            x={textX}
            y={lineStartY}
            dy={index === 0 ? 0 : 15}
          >
            {line}
          </TSpan>
        ))}
      </SvgText>
      <Circle
        cx={isSource ? node.x + node.width : node.x}
        cy={node.anchorY}
        r={selected ? 5 : 4}
        fill={selected ? colors.primary : colors.primary}
        fillOpacity={dimmed ? 0.35 : selected ? 1 : 0.75}
        stroke={colors.cardBackground ?? colors.background}
        strokeWidth={1.5}
        onPress={onPress}
      />
    </>
  );
}

export default function InterventionGraphVisual({
  edges,
  topicFreeEdges = [],
  conceptNodes = [],
  conceptEdges = [],
  language = 'es',
  width = 340,
  selectedKey = null,
  onSelectLink,
  accessibilityHidden = false,
  mapAccessibilityLabel = '',
  sourceColumnLabel = '',
  targetColumnLabel = '',
}) {
  const { colors, resolvedScheme } = useTheme();

  const model = useMemo(() => {
    const base = buildInterventionGraphViewModel(edges, topicFreeEdges, {
      canvasWidth: width,
      conceptNodes,
      conceptEdges,
      language,
    });
    if (base.mode === 'topicTag') {
      return localizeGraphModel(base, language);
    }
    return base;
  }, [edges, topicFreeEdges, conceptNodes, conceptEdges, language, width]);

  const sourceNodes = useMemo(() => {
    if (model.mode === 'concept') return model.conceptNodes || [];
    if (model.mode === 'topicFree') return model.topicFreeNodes || [];
    return model.topics || [];
  }, [model]);

  const primaryLink = useMemo(() => pickPrimaryGraphLink(model.links), [model.links]);
  const primaryLinkKey = primaryLink?.key ?? null;

  const emphasisLink = useMemo(() => {
    if (selectedKey) {
      return model.links.find((l) => l.key === selectedKey) || primaryLink;
    }
    return primaryLink;
  }, [model.links, primaryLink, primaryLinkKey, selectedKey]);

  const orderedLinks = useMemo(() => {
    const emphasisKey = selectedKey || primaryLinkKey;
    return [...model.links].sort((a, b) => {
      const aScore = a.key === emphasisKey ? 1 : 0;
      const bScore = b.key === emphasisKey ? 1 : 0;
      return aScore - bScore;
    });
  }, [model.links, primaryLinkKey, selectedKey]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: '100%',
          marginBottom: 12,
        },
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
          marginBottom: 8,
        },
        colLabel: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: colors.textSecondary,
          maxWidth: '46%',
        },
        colLabelRight: {
          textAlign: 'right',
        },
        panel: {
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border ?? 'rgba(128,128,128,0.25)',
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(255,255,255,0.03)'
              : 'rgba(248, 251, 255, 0.95)',
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: resolvedScheme === 'dark' ? 0.18 : 0.06,
          shadowRadius: 8,
          elevation: 2,
        },
      }),
    [colors, resolvedScheme],
  );

  if (accessibilityHidden || model.links.length === 0) {
    return null;
  }

  const edgeColor =
    resolvedScheme === 'dark' ? 'rgba(147, 197, 253, 0.5)' : 'rgba(30, 131, 211, 0.38)';
  const edgeHighlight = colors.primary;

  return (
    <View style={styles.wrap} accessibilityElementsHidden={accessibilityHidden}>
      <View style={styles.headerRow}>
        <Text style={styles.colLabel} numberOfLines={1}>
          {sourceColumnLabel}
        </Text>
        <Text style={[styles.colLabel, styles.colLabelRight]} numberOfLines={1}>
          {targetColumnLabel}
        </Text>
      </View>
      <View style={styles.panel}>
        <Svg
          width={model.width}
          height={model.height}
          accessibilityRole="image"
          accessibilityLabel={mapAccessibilityLabel || undefined}
        >
          {orderedLinks.map((link) => {
            const visual = resolveLinkVisual(link, { selectedKey, primaryLinkKey });
            const strokeW =
              normalizeStrokeWidth(link.weight, model.maxWeight, 1.4, 4.5) * visual.widthBoost;
            const isTopicFreeLink = link.linkKind === 'topicFree';
            const isConceptLink = link.linkKind === 'concept';
            const isEmphasis = link.key === (selectedKey || primaryLinkKey);
            return (
              <Path
                key={link.key}
                d={bezierPath(link.x1, link.y1, link.x2, link.y2)}
                stroke={isEmphasis ? edgeHighlight : edgeColor}
                strokeWidth={strokeW}
                strokeOpacity={visual.opacity}
                fill="none"
                strokeDasharray={isTopicFreeLink ? '5 4' : isConceptLink ? '3 3' : undefined}
                strokeLinecap="round"
                onPress={() => onSelectLink?.(link)}
              />
            );
          })}

          {sourceNodes.map((node) => {
            const participates = nodeParticipatesInGraphLink(node.id, emphasisLink);
            return (
              <GraphNodePill
                key={`s-${node.id}`}
                node={node}
                colors={colors}
                resolvedScheme={resolvedScheme}
                selected={nodeIsSelected(node, selectedKey, model.links)}
                dimmed={Boolean(emphasisLink) && !participates}
                variant="source"
                onPress={() => {
                  const best = pickStrongestLinkForSourceNode(model.links, node.id);
                  if (best) onSelectLink?.(best);
                }}
              />
            );
          })}

          {model.interventions.map((node) => {
            const participates = nodeParticipatesInGraphLink(node.id, emphasisLink);
            return (
              <GraphNodePill
                key={`t-${node.id}`}
                node={node}
                colors={colors}
                resolvedScheme={resolvedScheme}
                selected={nodeIsSelected(node, selectedKey, model.links)}
                dimmed={Boolean(emphasisLink) && !participates}
                variant="target"
                onPress={() => {
                  const best = pickStrongestLinkForTargetNode(model.links, node.id);
                  if (best) onSelectLink?.(best);
                }}
              />
            );
          })}
        </Svg>
      </View>
    </View>
  );
}
