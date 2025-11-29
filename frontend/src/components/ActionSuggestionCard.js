/**
 * Componente de Tarjeta de Sugerencia de Acción
 * Muestra sugerencias de acciones basadas en el análisis emocional
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../styles/globalStyles';

// Constantes de estilos
const CARD_PADDING = 12;
const CARD_BORDER_RADIUS = 12;
const CARD_MARGIN_BOTTOM = 8;
const ICON_SIZE = 20;
const ICON_MARGIN_RIGHT = 10;
const TITLE_FONT_SIZE = 14;
const TITLE_FONT_WEIGHT = '600';
const TITLE_MARGIN_BOTTOM = 4;

const ActionSuggestionCard = ({ suggestion, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(suggestion);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {suggestion.icon && (
          <Text style={styles.icon}>{suggestion.icon}</Text>
        )}
        <Text style={styles.label}>{suggestion.label}</Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={colors.accent} 
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: CARD_PADDING,
    borderRadius: CARD_BORDER_RADIUS,
    marginBottom: CARD_MARGIN_BOTTOM,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: ICON_SIZE,
    marginRight: ICON_MARGIN_RIGHT,
  },
  label: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: TITLE_FONT_WEIGHT,
    color: colors.text,
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default ActionSuggestionCard;

