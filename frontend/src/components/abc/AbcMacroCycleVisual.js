/**
 * Visual de ciclo A→B→C para patrones macro (#212).
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const COPY = {
  es: {
    legA: 'Situación',
    legB: 'Pensamiento',
    legC: 'Consecuencia',
    avgIntensity: (n) => `Intensidad media ${n}/10`,
  },
  en: {
    legA: 'Situation',
    legB: 'Thought',
    legC: 'Consequence',
    avgIntensity: (n) => `Average intensity ${n}/10`,
  },
};

function LegNode({ label, samples, letter, colors, styles }) {
  const text = Array.isArray(samples) ? samples.filter(Boolean).join(' · ') : '';
  return (
    <View style={styles.leg} accessibilityRole="text">
      <View style={[styles.legBadge, { borderColor: colors.primary }]}>
        <Text style={[styles.legLetter, { color: colors.primary }]}>{letter}</Text>
      </View>
      <Text style={styles.legLabel}>{label}</Text>
      {text ? (
        <Text style={styles.legSample} numberOfLines={3}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

export default function AbcMacroCycleVisual({ cycle, avgEmotionIntensity = null, compact = false }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const text = COPY[language === 'en' ? 'en' : 'es'];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: compact ? 6 : 10,
          paddingTop: compact ? 8 : 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 4,
        },
        leg: {
          flex: 1,
          minWidth: 0,
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
    [colors, compact],
  );

  if (!cycle || typeof cycle !== 'object') return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <LegNode
          letter="A"
          label={text.legA}
          samples={[cycle.trigger]}
          colors={colors}
          styles={styles}
        />
        <MaterialCommunityIcons
          name="arrow-right"
          size={16}
          color={colors.textSecondary}
          style={styles.arrow}
        />
        <LegNode
          letter="B"
          label={text.legB}
          samples={cycle.thoughts}
          colors={colors}
          styles={styles}
        />
        <MaterialCommunityIcons
          name="arrow-right"
          size={16}
          color={colors.textSecondary}
          style={styles.arrow}
        />
        <LegNode
          letter="C"
          label={text.legC}
          samples={[...(cycle.emotions || []), ...(cycle.consequences || [])]}
          colors={colors}
          styles={styles}
        />
      </View>
      {avgEmotionIntensity != null ? (
        <Text style={styles.intensity}>{text.avgIntensity(avgEmotionIntensity)}</Text>
      ) : null}
    </View>
  );
}
