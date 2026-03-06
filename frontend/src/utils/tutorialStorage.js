/**
 * Utilidad de almacenamiento para el estado del tutorial de onboarding.
 * Usado por OnboardingTutorial; permite testear la lógica sin cargar el componente.
 *
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TUTORIAL_COMPLETED: 'tutorialCompleted',
  getTutorialKey: (userId) => `tutorialCompleted_${userId}`,
};

export const getTutorialStorageKey = (userId = null) =>
  userId ? STORAGE_KEYS.getTutorialKey(userId) : STORAGE_KEYS.TUTORIAL_COMPLETED;

export const isTutorialCompleted = async (userId = null) => {
  try {
    const key = getTutorialStorageKey(userId);
    const completed = await AsyncStorage.getItem(key);
    return completed === 'true';
  } catch (error) {
    console.error('Error verificando estado del tutorial:', error);
    return false;
  }
};

export const resetTutorial = async (userId = null) => {
  try {
    const key = getTutorialStorageKey(userId);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error reseteando tutorial:', error);
  }
};
