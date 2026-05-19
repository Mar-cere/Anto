import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ICON_SIZE, useSettingsTexts } from '../../screens/settings/settingsScreenConstants';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

export default function SettingsHeader({ onBack }) {
  const TEXTS = useSettingsTexts();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 12,
        },
        headerButton: {
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 20,
          backgroundColor: colors.chromeIconButton,
        },
        headerSpacer: {
          width: 40,
          height: 40,
        },
        headerTitle: {
          color: colors.text,
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          flex: 1,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onBack}
        activeOpacity={0.76}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole='button'
        accessibilityLabel={TEXTS.BACK}
      >
        <MaterialCommunityIcons name="arrow-left" size={ICON_SIZE} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}
