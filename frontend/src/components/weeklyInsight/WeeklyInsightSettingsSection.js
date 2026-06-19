import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import DigitalHealthStatusCard from '../signals/DigitalHealthStatusCard';
import SignalConsentPanel from '../signals/SignalConsentPanel';

export default function WeeklyInsightSettingsSection({
  title,
  hint,
  sourceSummary,
  defaultExpanded = false,
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: {
          marginTop: 8,
        },
        toggle: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.chromeCard ?? colors.cardBackground,
        },
        toggleCopy: {
          flex: 1,
          paddingRight: 12,
        },
        toggleTitle: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
        },
        toggleHint: {
          marginTop: 3,
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSecondary,
        },
        panel: {
          marginTop: 10,
          gap: 10,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.block}>
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setExpanded((v) => !v);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
      >
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>{title}</Text>
          {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {expanded ? (
        <View style={styles.panel}>
          <DigitalHealthStatusCard compact sourceSummary={sourceSummary} />
          <SignalConsentPanel compact />
        </View>
      ) : null}
    </View>
  );
}
