/**
 * Acceso rápido al Diario de Gratitud desde el dashboard.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardStyles } from '../styles/dashboardTheme';
import {
  getGratitudeEntryPreviewLine,
  sanitizeGratitudeEntriesFromStorage,
} from '../utils/gratitudeJournalEntry';
import DashboardGroupedRow from './dashboard/DashboardGroupedRow';
import DashboardSection from './dashboard/DashboardSection';

const GRATITUDE_ENTRIES_KEY = 'gratitudeJournalEntries';

const DEFAULT_TEXTS_ES = {
  CARD_TITLE: 'Diario de Gratitud',
  OPEN_A11Y: 'Abrir diario de gratitud',
  LAST_PREFIX: 'Última',
  TODAY: 'Hoy',
  LAST_ENTRY: 'Última entrada',
  EMPTY_TITLE: 'Escribe sobre lo que agradeces',
  EMPTY_BODY: 'Practica la gratitud y mejora tu bienestar emocional',
};

const DEFAULT_TEXTS_EN = {
  CARD_TITLE: 'Gratitude Journal',
  OPEN_A11Y: 'Open gratitude journal',
  LAST_PREFIX: 'Last',
  TODAY: 'Today',
  LAST_ENTRY: 'Last entry',
  EMPTY_TITLE: 'Write about what you are grateful for',
  EMPTY_BODY: 'Practice gratitude and improve your emotional well-being',
};

const JournalCard = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const dashTexts = useSectionTranslations('DASH');
  const { language } = useLanguage();
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const defaults = language === 'en' ? DEFAULT_TEXTS_EN : DEFAULT_TEXTS_ES;
  const T = useMemo(
    () => ({
      OPEN_A11Y: translated?.JOURNAL_CARD_OPEN_A11Y || defaults.OPEN_A11Y,
      CARD_TITLE: translated?.JOURNAL_CARD_TITLE || defaults.CARD_TITLE,
      LAST_PREFIX: translated?.JOURNAL_CARD_LAST_PREFIX || defaults.LAST_PREFIX,
      TODAY: translated?.JOURNAL_CARD_TODAY || defaults.TODAY,
      LAST_ENTRY: translated?.JOURNAL_CARD_LAST_ENTRY || defaults.LAST_ENTRY,
      EMPTY_TITLE: translated?.JOURNAL_CARD_EMPTY_TITLE || defaults.EMPTY_TITLE,
      EMPTY_BODY: translated?.JOURNAL_CARD_EMPTY_BODY || defaults.EMPTY_BODY,
    }),
    [translated, defaults],
  );
  const navigation = useNavigation();
  const [entriesCount, setEntriesCount] = useState(0);
  const [lastEntryText, setLastEntryText] = useState('');
  const [lastEntryDate, setLastEntryDate] = useState(null);

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
        // El card funciona igual en modo estático si falla la carga.
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

  const openJournal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('GratitudeJournal');
  };

  const rowTitle = lastEntryText ? T.LAST_ENTRY : T.EMPTY_TITLE;
  const rowBody = lastEntryText || T.EMPTY_BODY;
  const dateLabel = lastDateLabel ? `${T.LAST_PREFIX}: ${lastDateLabel}` : T.TODAY;
  const subtitleParts = [dateLabel];
  if (entriesCount > 0) {
    subtitleParts.push(`${entriesCount}`);
  }
  subtitleParts.push(rowBody);

  return (
    <DashboardSection
      title={T.CARD_TITLE}
      viewAllLabel={dashTexts.VIEW_ALL || (language === 'en' ? 'View all' : 'Ver todos')}
      onViewAll={openJournal}
      accessibilityLabel={T.OPEN_A11Y}
    >
      <View style={styles.groupedList}>
        <DashboardGroupedRow
          iconNode={(
            <MaterialCommunityIcons name="book-heart-outline" size={22} color={colors.primary} />
          )}
          title={rowTitle}
          subtitle={subtitleParts.join(' · ')}
          onPress={openJournal}
          isLast
          accessibilityLabel={T.OPEN_A11Y}
        />
      </View>
    </DashboardSection>
  );
};

export default JournalCard;
