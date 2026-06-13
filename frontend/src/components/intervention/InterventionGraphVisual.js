/**
 * Grafo bipartito tema → intervención (#218).
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import {
  buildInterventionGraphViewModel,
  localizeGraphModel,
  normalizeStrokeWidth,
} from '../../utils/interventionGraphLayout';

export default function InterventionGraphVisual({
  edges,
  topicFreeEdges = [],
  language = 'es',
  width = 340,
  selectedKey = null,
  onSelectLink,
  accessibilityHidden = false,
  mapAccessibilityLabel = '',
}) {
  const { colors, resolvedScheme } = useTheme();

  const model = useMemo(() => {
    const base = buildInterventionGraphViewModel(edges, topicFreeEdges, { canvasWidth: width });
    if (base.mode === 'topicTag') {
      return localizeGraphModel(base, language);
    }
    return base;
  }, [edges, topicFreeEdges, language, width]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: '100%',
          alignItems: 'center',
          marginBottom: 12,
        },
        panel: {
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border ?? 'rgba(128,128,128,0.25)',
          backgroundColor: colors.cardBackground ?? colors.card,
          overflow: 'hidden',
        },
      }),
    [colors],
  );

  if (accessibilityHidden || model.links.length === 0) {
    return null;
  }

  const edgeColor =
    resolvedScheme === 'dark' ? 'rgba(147, 197, 253, 0.55)' : 'rgba(30, 131, 211, 0.45)';
  const edgeHighlight = colors.primary;
  const nodeFill = colors.accentLineSoft ?? 'rgba(30, 131, 211, 0.15)';
  const nodeStroke = colors.primary;

  return (
    <View style={styles.wrap} accessibilityElementsHidden={accessibilityHidden}>
      <View style={styles.panel}>
        <Svg
          width={model.width}
          height={model.height}
          accessibilityRole="image"
          accessibilityLabel={mapAccessibilityLabel || undefined}
        >
          {model.links.map((link) => {
            const isSelected = selectedKey === link.key;
            const strokeW = normalizeStrokeWidth(link.weight, model.maxWeight);
            const isTopicFreeLink = link.linkKind === 'topicFree';
            return (
              <Line
                key={link.key}
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke={isSelected ? edgeHighlight : edgeColor}
                strokeWidth={isSelected ? strokeW + 1 : strokeW}
                strokeOpacity={isSelected ? 0.95 : isTopicFreeLink ? 0.85 : 0.7}
                strokeDasharray={isTopicFreeLink ? '4 3' : undefined}
                onPress={() => onSelectLink?.(link)}
              />
            );
          })}
          {model.topics.map((node) => (
            <React.Fragment key={`t-${node.id}`}>
              <Circle
                cx={node.x}
                cy={node.y}
                r={7}
                fill={nodeFill}
                stroke={nodeStroke}
                strokeWidth={1.5}
              />
              <SvgText
                x={node.x - 12}
                y={node.y + 4}
                fontSize={11}
                fontWeight="600"
                fill={colors.text}
                textAnchor="end"
              >
                {node.label}
              </SvgText>
            </React.Fragment>
          ))}
          {(model.topicFreeNodes || []).map((node) => (
            <React.Fragment key={`tf-${node.id}`}>
              <Circle
                cx={node.x}
                cy={node.y}
                r={6}
                fill={nodeFill}
                stroke={nodeStroke}
                strokeWidth={1.5}
              />
              <SvgText
                x={node.x}
                y={node.y - 10}
                fontSize={10}
                fontWeight="500"
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {node.label}
              </SvgText>
            </React.Fragment>
          ))}
          {model.interventions.map((node) => (
            <React.Fragment key={`i-${node.id}`}>
              <Circle
                cx={node.x}
                cy={node.y}
                r={6}
                fill={nodeFill}
                stroke={nodeStroke}
                strokeWidth={1.5}
              />
              <SvgText
                x={node.x + 12}
                y={node.y + 4}
                fontSize={11}
                fontWeight="600"
                fill={colors.text}
                textAnchor="start"
              >
                {node.label}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>
    </View>
  );
}
