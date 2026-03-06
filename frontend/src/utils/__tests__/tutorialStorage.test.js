/**
 * Tests unitarios para utilidad de almacenamiento del tutorial
 *
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTutorialStorageKey,
  isTutorialCompleted,
  resetTutorial,
} from '../tutorialStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('tutorialStorage', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('getTutorialStorageKey', () => {
    it('debe retornar clave global cuando userId es null', () => {
      expect(getTutorialStorageKey(null)).toBe('tutorialCompleted');
    });

    it('debe retornar clave por usuario cuando se pasa userId', () => {
      expect(getTutorialStorageKey('user-123')).toBe('tutorialCompleted_user-123');
    });

    it('debe retornar clave global cuando userId es undefined', () => {
      expect(getTutorialStorageKey(undefined)).toBe('tutorialCompleted');
    });
  });

  describe('isTutorialCompleted', () => {
    it('debe retornar false cuando no hay valor guardado', async () => {
      const result = await isTutorialCompleted('user-1');
      expect(result).toBe(false);
    });

    it('debe retornar true cuando el valor guardado es "true"', async () => {
      await AsyncStorage.setItem('tutorialCompleted_user-1', 'true');
      const result = await isTutorialCompleted('user-1');
      expect(result).toBe(true);
    });

    it('debe retornar false cuando el valor guardado no es "true"', async () => {
      await AsyncStorage.setItem('tutorialCompleted_user-1', 'false');
      const result = await isTutorialCompleted('user-1');
      expect(result).toBe(false);
    });

    it('debe usar clave global cuando userId es null', async () => {
      await AsyncStorage.setItem('tutorialCompleted', 'true');
      const result = await isTutorialCompleted(null);
      expect(result).toBe(true);
    });

    it('debe retornar false en caso de error de AsyncStorage', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage error'));
      const result = await isTutorialCompleted('user-1');
      expect(result).toBe(false);
    });
  });

  describe('resetTutorial', () => {
    it('debe borrar la key correcta para el userId', async () => {
      await AsyncStorage.setItem('tutorialCompleted_user-42', 'true');
      await resetTutorial('user-42');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('tutorialCompleted_user-42');
    });

    it('debe borrar la key global cuando userId es null', async () => {
      await resetTutorial(null);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('tutorialCompleted');
    });

    it('no debe lanzar cuando AsyncStorage falla', async () => {
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('storage error'));
      await expect(resetTutorial('user-1')).resolves.not.toThrow();
    });
  });
});
