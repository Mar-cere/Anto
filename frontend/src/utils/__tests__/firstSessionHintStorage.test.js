/**
 * Tests unitarios para utilidad de almacenamiento del hint de primera sesión
 *
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirstSessionHintDismissedKey,
  isFirstSessionHintDismissed,
  setFirstSessionHintDismissed,
} from '../firstSessionHintStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('firstSessionHintStorage', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('getFirstSessionHintDismissedKey', () => {
    it('debe incluir prefix y userId cuando se pasa', () => {
      const key = getFirstSessionHintDismissedKey('user-123');
      expect(key).toContain('firstSessionHintDismissed_');
      expect(key).toBe('firstSessionHintDismissed_user-123');
    });

    it('debe usar "anonymous" cuando userId es null', () => {
      const key = getFirstSessionHintDismissedKey(null);
      expect(key).toBe('firstSessionHintDismissed_anonymous');
    });

    it('debe usar "anonymous" cuando userId es undefined', () => {
      const key = getFirstSessionHintDismissedKey(undefined);
      expect(key).toBe('firstSessionHintDismissed_anonymous');
    });
  });

  describe('isFirstSessionHintDismissed', () => {
    it('debe retornar false cuando no hay valor guardado', async () => {
      const result = await isFirstSessionHintDismissed('user-1');
      expect(result).toBe(false);
    });

    it('debe retornar true cuando el valor guardado es "true"', async () => {
      await AsyncStorage.setItem('firstSessionHintDismissed_user-1', 'true');
      const result = await isFirstSessionHintDismissed('user-1');
      expect(result).toBe(true);
    });

    it('debe retornar false cuando el valor guardado no es "true"', async () => {
      await AsyncStorage.setItem('firstSessionHintDismissed_user-1', 'false');
      const result = await isFirstSessionHintDismissed('user-1');
      expect(result).toBe(false);
    });

    it('debe retornar false en caso de error de AsyncStorage', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage error'));
      const result = await isFirstSessionHintDismissed('user-1');
      expect(result).toBe(false);
    });
  });

  describe('setFirstSessionHintDismissed', () => {
    it('debe guardar "true" con la key correcta para el userId', async () => {
      await setFirstSessionHintDismissed('user-42');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('firstSessionHintDismissed_user-42', 'true');
    });

    it('no debe lanzar cuando AsyncStorage falla', async () => {
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage error'));
      await expect(setFirstSessionHintDismissed('user-1')).resolves.not.toThrow();
    });
  });
});
