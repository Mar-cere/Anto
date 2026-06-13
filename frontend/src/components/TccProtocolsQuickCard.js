/**
 * Accesos directos a protocolos TCC desde el dashboard (BA, ABC, exposición).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { getFocusTheme } from '../styles/focusCardTheme';
import { SPACING } from '../constants/ui';

const DEFAULT_TEXTS = {
  TITLE: 'Herramientas de seguimiento',
  HINT: 'Protocolos guiados para practicar entre conversaciones con Anto.',
  BA: 'Activación conductual',
  BA_HINT: 'Plan semanal y registro de ánimo',
  ABC: 'Autorregistro ABC',
  ABC_HINT: 'Situación → pensamiento → consecuencia',
  EXPOSURE: 'Exposición gradual',
  EXPOSURE_HINT: 'Jerarquía de pasos',
  ALL: 'Ver todas las técnicas',
};

const TOOL_ITEMS = [
  { key: 'ba', screen: 'BehavioralActivation', icon: 'walk', labelKey: 'BA', hintKey: 'BA_HINT' },
  { key: 'abc', screen: 'AbcRecord', icon: 'clipboard-text-outline', labelKey: 'ABC', hintKey: 'ABC_HINT' },
  {
    key: 'exposure',
    screen: 'ExposureHierarchy',
    icon: 'stairs',
    labelKey: 'EXPOSURE',
    hintKey: 'EXPOSURE_HINT',
  },
];

export default function TccProtocolsQuickCard({ accessibilityLabel }) {
  const navigation = useNavigation();
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('DASH');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.TCC_TOOLS_TITLE || DEFAULT_TEXTS.TITLE,
      HINT: translated?.TCC_TOOLS_HINT || DEFAULT_TEXTS.HINT,
      BA: translated?.TCC_TOOLS_BA || DEFAULT_TEXTS.BA,
      BA_HINT: translated?.TCC_TOOLS_BA_HINT || DEFAULT_TEXTS.BA_HINT,
      ABC: translated?.TCC_TOOLS_ABC || DEFAULT_TEXTS.ABC,
      ABC_HINT: translated?.TCC_TOOLS_ABC_HINT || DEFAULT_TEXTS.ABC_HINT,
      EXPOSURE: translated?.TCC_TOOLS_EXPOSURE || DEFAULT_TEXTS.EXPOSURE,
      EXPOSURE_HINT: translated?.TCC_TOOLS_EXPOSURE_HINT || DEFAULT_TEXTS.EXPOSURE_HINT,
      ALL: translated?.TCC_TOOLS_ALL || DEFAULT_TEXTS.ALL,
    }),
    [translated],
  );

  const focus = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...focus.FOCUS_PANEL,
          marginBottom: 16,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 6,
        },
        title: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
          flex: 1,
        },
        hint: {
          fontSize: 13,
          color: focus.FOCUS_META,
          lineHeight: 19,
          marginBottom: 12,
        },
        toolRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 11,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: focus.FOCUS_BORDER_SUBTLE,
        },
        toolIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glassFill,
        },
        toolBody: { flex: 1 },
        toolTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
        toolHint: { fontSize: 12, color: focus.FOCUS_META, marginTop: 2 },
        allLink: {
          marginTop: 4,
          paddingVertical: 10,
          alignItems: 'center',
        },
        allLinkText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.primary,
        },
      }),
    [colors, focus],
  );

  const openScreen = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate(screen);
  };

  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={accessibilityLabel}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="heart-pulse" size={22} color={colors.primary} />
        <Text style={styles.title}>{TEXTS.TITLE}</Text>
      </View>
      <Text style={styles.hint}>{TEXTS.HINT}</Text>
      {TOOL_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.toolRow}
          onPress={() => openScreen(item.screen)}
          accessibilityRole="button"
          accessibilityLabel={TEXTS[item.labelKey]}
        >
          <View style={styles.toolIcon}>
            <MaterialCommunityIcons name={item.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.toolBody}>
            <Text style={styles.toolTitle}>{TEXTS[item.labelKey]}</Text>
            <Text style={styles.toolHint}>{TEXTS[item.hintKey]}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.allLink}
        onPress={() => openScreen('TherapeuticTechniques')}
        accessibilityRole="button"
      >
        <Text style={styles.allLinkText}>{TEXTS.ALL}</Text>
      </TouchableOpacity>
    </View>
  );
}
