import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SummaryExploreLinks({ sectionTitle, links }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: {
          marginTop: 4,
          marginBottom: 8,
        },
        title: {
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.6,
          color: colors.textMuted ?? colors.textSecondary,
          marginBottom: 8,
          paddingHorizontal: 4,
        },
        group: {
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.chromeCard ?? colors.cardBackground,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 14,
          gap: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        rowLast: {
          borderBottomWidth: 0,
        },
        copy: {
          flex: 1,
        },
        rowTitle: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 2,
        },
        rowHint: {
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.block}>
      {sectionTitle ? <Text style={styles.title}>{sectionTitle}</Text> : null}
      <View style={styles.group}>
        {links.map((link, index) => (
          <TouchableOpacity
            key={link.key}
            style={[styles.row, index === links.length - 1 && styles.rowLast]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              link.onPress();
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={link.title}
            accessibilityHint={link.hint}
          >
            <MaterialCommunityIcons name={link.icon} size={22} color={colors.primary} />
            <View style={styles.copy}>
              <Text style={styles.rowTitle}>{link.title}</Text>
              {link.hint ? <Text style={styles.rowHint}>{link.hint}</Text> : null}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
