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
  normalizeStrokeWidth,
} from '../../utils/interventionGraphLayout';

function bezierPath(x1, y1, x2, y2) {
  const bend = Math.max(28, Math.abs(x2 - x1) * 0.38);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}

function nodeIsSelected(node, selectedKey, links) {
  if (!selectedKey || !node?.id) return false;
  const link = links.find((l) => l.key === selectedKey);
  if (!link) return false;
  return link.sourceId === node.id || link.targetId === node.id;
}

function GraphNodePill({
  node,
  colors,
  resolvedScheme,
  selected,
  variant,
  onPress,
}) {
  const isSource = variant === 'source';
  const fill =
    selected
      ? resolvedScheme === 'dark'
        ? 'rgba(59, 130, 246, 0.28)'
        : 'rgba(30, 131, 211, 0.18)'
      : isSource
        ? resolvedScheme === 'dark'
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.92)'
        : resolvedScheme === 'dark'
          ? 'rgba(59, 130, 246, 0.12)'
          : 'rgba(30, 131, 211, 0.08)';
  const stroke = selected ? colors.primary : colors.border ?? 'rgba(128,128,128,0.3)';
  const strokeWidth = selected ? 2 : 1;
  const textColor = colors.text;
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
      <SvgText fill={textColor} fontSize={12} fontWeight="600">
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
        r={4}
        fill={colors.primary}
        stroke={colors.cardBackground ?? colors.background}
        strokeWidth={1.5}
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
          {model.links.map((link) => {
            const isSelected = selectedKey === link.key;
            const strokeW = normalizeStrokeWidth(link.weight, model.maxWeight, 1.4, 4.5);
            const isTopicFreeLink = link.linkKind === 'topicFree';
            const isConceptLink = link.linkKind === 'concept';
            return (
              <Path
                key={link.key}
                d={bezierPath(link.x1, link.y1, link.x2, link.y2)}
                stroke={isSelected ? edgeHighlight : edgeColor}
                strokeWidth={isSelected ? strokeW + 0.8 : strokeW}
                strokeOpacity={isSelected ? 0.95 : isTopicFreeLink ? 0.82 : isConceptLink ? 0.88 : 0.72}
                fill="none"
                strokeDasharray={isTopicFreeLink ? '5 4' : isConceptLink ? '3 3' : undefined}
                strokeLinecap="round"
                onPress={() => onSelectLink?.(link)}
              />
            );
          })}

          {sourceNodes.map((node) => (
            <GraphNodePill
              key={`s-${node.id}`}
              node={node}
              colors={colors}
              resolvedScheme={resolvedScheme}
              selected={nodeIsSelected(node, selectedKey, model.links)}
              variant="source"
              onPress={() => {
                const first = model.links.find(
                  (l) =>
                    l.sourceId === node.id ||
                    l.topicFree === node.id ||
                    l.conceptId === node.id ||
                    l.topicTag === node.id,
                );
                if (first) onSelectLink?.(first);
              }}
            />
          ))}

          {model.interventions.map((node) => (
            <GraphNodePill
              key={`t-${node.id}`}
              node={node}
              colors={colors}
              resolvedScheme={resolvedScheme}
              selected={nodeIsSelected(node, selectedKey, model.links)}
              variant="target"
              onPress={() => {
                const first = model.links.find((l) => l.targetId === node.id);
                if (first) onSelectLink?.(first);
              }}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}
