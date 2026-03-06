/**
 * Utilidad de almacenamiento para el hint de primera sesión.
 * Usado por FirstSessionHint; permite testear la lógica sin cargar el componente.
 *
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = 'firstSessionHintDismissed_';

export const getFirstSessionHintDismissedKey = (userId) =>
  `${STORAGE_KEY_PREFIX}${userId || 'anonymous'}`;

export const isFirstSessionHintDismissed = async (userId) => {
  try {
    const key = getFirstSessionHintDismissedKey(userId);
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (e) {
    return false;
  }
};

export const setFirstSessionHintDismissed = async (userId) => {
  try {
    const key = getFirstSessionHintDismissedKey(userId);
    await AsyncStorage.setItem(key, 'true');
  } catch (e) {
    console.warn('FirstSessionHint: error persistiendo estado', e);
  }
};
