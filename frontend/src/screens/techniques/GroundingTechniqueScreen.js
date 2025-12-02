/**
 * Pantalla de Técnica de Grounding
 * Ejercicio interactivo guiado de grounding 5-4-3-2-1
 */

import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GroundingExercise from '../../components/therapeutic/GroundingExercise';
import Header from '../../components/Header';
import { colors } from '../../styles/globalStyles';

const GroundingTechniqueScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleComplete = (data) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Opcional: navegar de vuelta o mostrar mensaje de éxito
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Técnica de Grounding"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <GroundingExercise onComplete={handleComplete} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});

export default GroundingTechniqueScreen;

