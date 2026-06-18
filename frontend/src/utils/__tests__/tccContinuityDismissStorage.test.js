import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadDismissedContinuityIds,
  persistDismissedContinuityId,
} from '../tccContinuityDismissStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('tccContinuityDismissStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('loadDismissedContinuityIds devuelve vacío sin datos', async () => {
    expect(await loadDismissedContinuityIds()).toEqual([]);
  });

  it('persistDismissedContinuityId guarda ids únicos', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(['ba:s1']));
    await persistDismissedContinuityId('exposure:p1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'tcc_continuity_dismissed_v1',
      JSON.stringify(['exposure:p1', 'ba:s1']),
    );
  });
});
