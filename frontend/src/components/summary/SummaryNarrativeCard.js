import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SummaryNarrativeCard({ narrative, texts }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: 14,
          padding: 16,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.chromeCard ?? colors.cardBackground,
        },
        title: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 10,
        },
        line: {
          fontSize: 14,
          lineHeight: 21,
          color: colors.textSecondary,
          marginBottom: 8,
        },
        label: {
          color: colors.text,
          fontWeight: '600',
        },
        question: {
          marginTop: 4,
          fontSize: 14,
          lineHeight: 21,
          color: colors.primary,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  if (!narrative) return null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>{texts.NARRATIVE_TITLE}</Text>
      <Text style={styles.line}>
        <Text style={styles.label}>{texts.NARRATIVE_THEMES}: </Text>
        {narrative.themes}
      </Text>
      <Text style={styles.line}>
        <Text style={styles.label}>{texts.NARRATIVE_MICRO_WINS}: </Text>
        {narrative.microWins}
      </Text>
      {narrative.nextQuestion ? (
        <Text style={styles.question}>{narrative.nextQuestion}</Text>
      ) : null}
    </View>
  );
}
