import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';

const DEFAULT_TEXTS = {
  TITLE: 'Diario de Gratitud',
  SUBTITLE: 'Escribe sobre lo que agradeces hoy',
  OPEN_A11Y: 'Abrir diario de gratitud',
};

export default function GratitudeJournalPromoCard() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const T = useSectionTranslations('TASKS_AND_HABITS');
  const texts = { ...DEFAULT_TEXTS, ...T };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          borderRadius: 20,
          padding: 1.5,
          marginBottom: 14,
          backgroundColor: 'rgba(236, 72, 153, 0.45)',
          shadowColor: colors.accentLine,
          shadowOpacity: 0.22,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        },
        innerGlow: {
          borderRadius: 18.5,
          padding: 1,
          backgroundColor: 'rgba(99, 102, 241, 0.35)',
        },
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.CHIP_INSET,
          paddingVertical: SPACING.CARD_INNER_INSET,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
          borderRadius: 17,
          backgroundColor: colors.chromeCard,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(236, 72, 153, 0.16)',
        },
        copy: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        subtitle: {
          marginTop: 3,
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 18,
        },
        chevron: {
          color: colors.textMuted,
        },
      }),
    [colors],
  );

  const openJournal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('GratitudeJournal');
  };

  return (
    <Pressable
      onPress={openJournal}
      accessibilityRole="button"
      accessibilityLabel={texts.OPEN_GRATITUDE_A11Y || texts.OPEN_A11Y}
      style={({ pressed }) => [pressed && { opacity: 0.94 }]}
    >
      <View style={styles.outer}>
        <View style={styles.innerGlow}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="book-heart-outline" size={24} color="#EC4899" />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{texts.GRATITUDE_TITLE || texts.TITLE}</Text>
              <Text style={styles.subtitle}>
                {texts.GRATITUDE_SUBTITLE || texts.SUBTITLE}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              style={styles.chevron}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
