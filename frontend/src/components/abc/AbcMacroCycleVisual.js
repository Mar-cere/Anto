/**
 * Lienzo interactivo de ciclo A→B→C para patrones macro (#212).
 */
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ABC_MACRO_CYCLE_COPY,
  getAbcMacroCycleInterventionHint,
  getAbcMacroCycleLegSamples,
  normalizeAbcMacroCycleLanguage,
} from './abcMacroCycleCopy';

function LegNode({
  legKey,
  label,
  samples,
  letter,
  colors,
  styles,
  interactive,
  expanded,
  onToggle,
  language,
}) {
  const text = samples.filter(Boolean).join(' · ');
  const hint = expanded ? getAbcMacroCycleInterventionHint(legKey, language) : '';
  const copy = ABC_MACRO_CYCLE_COPY[language];
  const a11yLabel = copy.a11yLeg(letter, label, expanded);

  const body = (
    <>
      <View
        style={[
          styles.legBadge,
          { borderColor: colors.primary },
          expanded && styles.legBadgeExpanded,
        ]}
      >
        <Text style={[styles.legLetter, { color: colors.primary }]}>{letter}</Text>
      </View>
      <Text style={styles.legLabel}>{label}</Text>
      {text ? (
        <Text style={styles.legSample} numberOfLines={expanded ? undefined : 3}>
          {text}
        </Text>
      ) : null}
      {expanded && hint ? <Text style={styles.interventionHint}>{hint}</Text> : null}
    </>
  );

  if (!interactive) {
    return (
      <View style={styles.leg} accessibilityRole="text">
        {body}
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.leg, expanded && styles.legExpanded]}
      onPress={() => onToggle(legKey)}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ expanded }}
    >
      {body}
    </Pressable>
  );
}

export default function AbcMacroCycleVisual({
  cycle,
  avgEmotionIntensity = null,
  compact = false,
  interactive: interactiveProp,
}) {
  const { colors } = useTheme();
  const { language: appLanguage } = useLanguage();
  const language = normalizeAbcMacroCycleLanguage(appLanguage);
  const text = ABC_MACRO_CYCLE_COPY[language];
  const interactive = interactiveProp ?? !compact;
  const [expandedLeg, setExpandedLeg] = useState(null);

  const onToggle = useCallback((legKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpandedLeg((prev) => (prev === legKey ? null : legKey));
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: compact ? 6 : 10,
          paddingTop: compact ? 8 : 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        exploreHint: {
          fontSize: 11,
          lineHeight: 16,
          color: colors.textSecondary,
          marginBottom: 8,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 4,
        },
        leg: {
          flex: 1,
          minWidth: 0,
          borderRadius: 10,
          padding: interactive ? 4 : 0,
        },
        legExpanded: {
          backgroundColor: colors.glassFill ?? colors.surface ?? 'rgba(127,127,127,0.08)',
        },
        legBadge: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        },
        legBadgeExpanded: {
          backgroundColor: colors.primarySoft ?? 'rgba(127,127,127,0.12)',
        },
        legLetter: {
          fontSize: 11,
          fontWeight: '700',
        },
        legLabel: {
          fontSize: 10,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: 2,
        },
        legSample: {
          fontSize: 12,
          lineHeight: 17,
          color: colors.text,
        },
        interventionHint: {
          marginTop: 6,
          fontSize: 11,
          lineHeight: 16,
          color: colors.textSecondary,
          fontStyle: 'italic',
        },
        arrow: {
          paddingTop: 2,
          opacity: 0.7,
        },
        intensity: {
          marginTop: 8,
          fontSize: 11,
          color: colors.textSecondary,
        },
      }),
    [colors, compact, interactive],
  );

  if (!cycle || typeof cycle !== 'object') return null;

  const legs = [
    { key: 'A', letter: 'A', label: text.legA },
    { key: 'B', letter: 'B', label: text.legB },
    { key: 'C', letter: 'C', label: text.legC },
  ];

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {interactive ? <Text style={styles.exploreHint}>{text.exploreHint}</Text> : null}
      <View style={styles.row}>
        {legs.map((leg, index) => (
          <React.Fragment key={leg.key}>
            {index > 0 ? (
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color={colors.textSecondary}
                style={styles.arrow}
              />
            ) : null}
            <LegNode
              legKey={leg.key}
              letter={leg.letter}
              label={leg.label}
              samples={getAbcMacroCycleLegSamples(cycle, leg.key)}
              colors={colors}
              styles={styles}
              interactive={interactive}
              expanded={expandedLeg === leg.key}
              onToggle={onToggle}
              language={language}
            />
          </React.Fragment>
        ))}
      </View>
      {avgEmotionIntensity != null ? (
        <Text style={styles.intensity}>{text.avgIntensity(avgEmotionIntensity)}</Text>
      ) : null}
    </View>
  );
}
