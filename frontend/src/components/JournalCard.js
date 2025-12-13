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

  return (
    <Animated.View style={[commonStyles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <CardHeader 
        icon="book-heart"
        title="Diario de Gratitud"
      />
      <TouchableOpacity
        style={styles.journalButton}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <View style={styles.journalContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name="book-heart" 
              size={32} 
              color={cardColors.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Escribe sobre lo que agradeces</Text>
            <Text style={styles.description}>
              Practica la gratitud y mejora tu bienestar emocional
            </Text>
          </View>
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color={cardColors.secondary} 
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  journalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  journalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(26, 221, 219, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.1)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(26, 221, 219, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: cardColors.secondary,
    lineHeight: 20,
  },
});

export default JournalCard;

