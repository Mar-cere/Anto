/**
 * Card de Diario de Gratitud
 *
 * Muestra un card para acceder rápidamente al Diario de Gratitud
 * desde el dashboard.
 *
 * @author AntoApp Team
 */

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { commonStyles, cardColors, CardHeader } from './common/CardStyles';
import {
  FOCUS_INNER_ROW,
  FOCUS_ICON_WRAP,
  FOCUS_CHEVRON_MUTED,
  FOCUS_META,
} from '../styles/focusCardTheme';

const JournalCard = () => {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    <Animated.View style={[commonStyles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
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
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="book-heart" size={20} color={cardColors.primary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.rowTitle}>Escribe sobre lo que agradeces</Text>
            <Text style={styles.rowMeta}>Practica la gratitud y mejora tu bienestar emocional</Text>
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
  },
  iconWrap: {
    ...FOCUS_ICON_WRAP,
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
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
