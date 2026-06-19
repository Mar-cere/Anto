import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { buildPaywallMemoryCopy } from '../../utils/paywallMemoryCopy';

function PaywallMemoryCard({ stats, loading, texts }) {
  const { colors, resolvedScheme } = useTheme();
  const copy = useMemo(() => buildPaywallMemoryCopy(stats, texts), [stats, texts]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(255,255,255,0.04)'
              : colors.settingsSectionSurface,
          padding: 16,
          marginBottom: 24,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        },
        iconWrap: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentLineSoft,
        },
        body: { flex: 1 },
        lead: {
          color: colors.text,
          fontSize: 15,
          lineHeight: 22,
          fontWeight: '500',
        },
        highlight: {
          color: colors.primaryBright || colors.primary,
          fontWeight: '700',
        },
        outro: {
          marginTop: 10,
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
        },
        loadingRow: {
          minHeight: 56,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, resolvedScheme],
  );

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  const leadParts = copy.lead.split(/(\*\*[^*]+\*\*)/g);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="star-four-points" size={16} color={colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.lead}>
            {leadParts.map((part, index) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={`hl-${index}`} style={styles.highlight}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              if (!part) return null;
              return <Text key={`t-${index}`}>{part.replace(/\*\*/g, '')}</Text>;
            })}
          </Text>
          <Text style={styles.outro}>{copy.outro}</Text>
        </View>
      </View>
    </View>
  );
}

export default memo(PaywallMemoryCard);
