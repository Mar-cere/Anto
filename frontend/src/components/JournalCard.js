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
import { commonStyles, cardColors, CardHeader } from './common/CardStyles';
import {
  FOCUS_INNER_ROW,
  FOCUS_CHEVRON_MUTED,
  FOCUS_KICKER_COLOR,
  FOCUS_META,
  FOCUS_BORDER_SUBTLE,
} from '../styles/focusCardTheme';

const GRATITUDE_ENTRIES_KEY = 'gratitudeJournalEntries';

const JournalCard = () => {
  const navigation = useNavigation();
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
        setEntriesCount(parsed.length);
        const latest = parsed[0];
        if (latest?.text) setLastEntryText(String(latest.text));
        if (latest?.date) setLastEntryDate(latest.date);
      } catch (e) {
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
      return new Date(lastEntryDate).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return null;
    }
  }, [lastEntryDate]);

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
      <CardHeader icon="book-heart" title="Diario de Gratitud" onViewAll={handleViewAll} />
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Abrir diario de gratitud"
      >
        <View style={styles.row}>
          <View style={styles.textBlock}>
            <View style={styles.metaTopRow}>
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="calendar" size={12} color={FOCUS_KICKER_COLOR} />
                <Text style={styles.metaChipText}>
                  {lastDateLabel ? `Última: ${lastDateLabel}` : 'Hoy'}
                </Text>
              </View>
              <Text style={styles.countText}>{entriesCount ? `${entriesCount}` : ''}</Text>
            </View>
            <Text style={styles.rowTitle}>
              {lastEntryText ? 'Última entrada' : 'Escribe sobre lo que agradeces'}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={2}>
              {lastEntryText
                ? lastEntryText
                : 'Practica la gratitud y mejora tu bienestar emocional'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={FOCUS_CHEVRON_MUTED} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    ...FOCUS_INNER_ROW,
    marginBottom: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  metaChipText: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
    includeFontPadding: false,
  },
  countText: {
    color: FOCUS_META,
    fontSize: 12,
    fontWeight: '700',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    color: '#FFFFFF',
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: FOCUS_META,
    fontWeight: '400',
  },
});

export default JournalCard;
