/**
 * Card de Diario de Gratitud
 *
 * Muestra un card para acceder rápidamente al Diario de Gratitud
 * desde el dashboard.
 *
 * @author AntoApp Team
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCardStylesDynamic, CardHeader } from './common/CardStyles';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { getFocusTheme } from '../styles/focusCardTheme';
import {
  getGratitudeEntryPreviewLine,
  sanitizeGratitudeEntriesFromStorage,
} from '../utils/gratitudeJournalEntry';

const GRATITUDE_ENTRIES_KEY = 'gratitudeJournalEntries';
const DEFAULT_TEXTS = {
  CARD_TITLE: 'Diario de Gratitud',
  OPEN_A11Y: 'Abrir diario de gratitud',
  LAST_PREFIX: 'Última',
  TODAY: 'Hoy',
  LAST_ENTRY: 'Última entrada',
  EMPTY_TITLE: 'Escribe sobre lo que agradeces',
  EMPTY_BODY: 'Practica la gratitud y mejora tu bienestar emocional',
};

const JournalCard = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const { language } = useLanguage();
  const T = useMemo(
    () => ({
      OPEN_A11Y:
        translated?.JOURNAL_CARD_OPEN_A11Y || DEFAULT_TEXTS.OPEN_A11Y,
      CARD_TITLE: translated?.JOURNAL_CARD_TITLE || DEFAULT_TEXTS.CARD_TITLE,
      LAST_PREFIX: translated?.JOURNAL_CARD_LAST_PREFIX || DEFAULT_TEXTS.LAST_PREFIX,
      TODAY: translated?.JOURNAL_CARD_TODAY || DEFAULT_TEXTS.TODAY,
      LAST_ENTRY: translated?.JOURNAL_CARD_LAST_ENTRY || DEFAULT_TEXTS.LAST_ENTRY,
      EMPTY_TITLE:
        translated?.JOURNAL_CARD_EMPTY_TITLE || DEFAULT_TEXTS.EMPTY_TITLE,
      EMPTY_BODY:
        translated?.JOURNAL_CARD_EMPTY_BODY ||
        DEFAULT_TEXTS.EMPTY_BODY,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const { commonStyles } = useCardStylesDynamic();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          ...t.FOCUS_INNER_ROW,
          marginBottom: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        textBlock: {
          flex: 1,
          minWidth: 0,
          marginRight: 8,
        },
        metaTopRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        metaChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        metaChipText: {
          color: t.FOCUS_KICKER_COLOR,
          fontSize: 12,
          fontWeight: '600',
          lineHeight: 16,
          textAlign: 'center',
          includeFontPadding: false,
        },
        countText: {
          color: t.FOCUS_META,
          fontSize: 12,
          fontWeight: '700',
        },
        rowTitle: {
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 20,
          color: colors.text,
        },
        rowMeta: {
          marginTop: 4,
          fontSize: 13,
          lineHeight: 18,
          color: t.FOCUS_META,
          fontWeight: '400',
        },
      }),
    [colors, t],
  );
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;
  const [entriesCount, setEntriesCount] = useState(0);
  const [lastEntryText, setLastEntryText] = useState('');
  const [lastEntryDate, setLastEntryDate] = useState(null);

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [entryAnim]);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(GRATITUDE_ENTRIES_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return;
        const sanitized = sanitizeGratitudeEntriesFromStorage(parsed);
        setEntriesCount(sanitized.length);
        const latest = sanitized[0];
        if (latest) setLastEntryText(getGratitudeEntryPreviewLine(latest, 140));
        if (latest?.date) setLastEntryDate(latest.date);
      } catch (_e) {
        // si falla, el card funciona igual en modo estático
      }
    };
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation]);

  const lastDateLabel = useMemo(() => {
    if (!lastEntryDate) return null;
    try {
      const locale = language === 'en' ? 'en-US' : 'es-ES';
      return new Date(lastEntryDate).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return null;
    }
  }, [lastEntryDate, language]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('GratitudeJournal');
  };

  const handleViewAll = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('GratitudeJournal');
  };

  return (
    <Animated.View
      style={[
        commonStyles.cardContainer,
        {
          transform: [
            { scale: scaleAnim },
            {
              translateY: entryAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
          opacity: entryAnim,
        },
      ]}
    >
      <CardHeader icon="book-heart" title={T.CARD_TITLE} onViewAll={handleViewAll} />
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={T.OPEN_A11Y}
      >
        <View style={styles.row}>
          <View style={styles.textBlock}>
            <View style={styles.metaTopRow}>
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="calendar" size={12} color={t.FOCUS_KICKER_COLOR} />
                <Text style={styles.metaChipText}>
                  {lastDateLabel ? `${T.LAST_PREFIX}: ${lastDateLabel}` : T.TODAY}
                </Text>
              </View>
              <Text style={styles.countText}>{entriesCount ? `${entriesCount}` : ''}</Text>
            </View>
            <Text style={styles.rowTitle}>
              {lastEntryText ? T.LAST_ENTRY : T.EMPTY_TITLE}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={2}>
              {lastEntryText
                ? lastEntryText
                : T.EMPTY_BODY}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={t.FOCUS_CHEVRON_MUTED} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default JournalCard;
