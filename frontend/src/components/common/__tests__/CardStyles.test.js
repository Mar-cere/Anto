/**
 * Tests unitarios para cardColors y estructura de commonStyles (CardStyles)
 *
 * @author AntoApp Team
 */

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: function MockIcon() { return null; },
}));
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: { create: (s) => s },
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  Alert: {},
  Platform: { OS: 'ios', select: (d) => d?.ios },
}));

import { cardColors, commonStyles } from '../CardStyles';

describe('CardStyles', () => {
  describe('cardColors', () => {
    it('debe tener las claves esperadas', () => {
      expect(cardColors).toHaveProperty('primary');
      expect(cardColors).toHaveProperty('secondary');
      expect(cardColors).toHaveProperty('background');
      expect(cardColors).toHaveProperty('cardBg');
      expect(cardColors).toHaveProperty('success');
      expect(cardColors).toHaveProperty('warning');
      expect(cardColors).toHaveProperty('error');
      expect(cardColors).toHaveProperty('border');
    });

    it('todos los valores deben ser strings', () => {
      Object.values(cardColors).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('primary debe ser un color hex o rgba', () => {
      expect(cardColors.primary).toMatch(/^#([0-9A-Fa-f]{3}){1,2}$|^rgba?\(/);
    });

    it('error y success deben ser colores válidos', () => {
      expect(cardColors.error).toMatch(/^#|^rgba?\(/);
      expect(cardColors.success).toMatch(/^#|^rgba?\(/);
    });
  });

  describe('commonStyles', () => {
    it('debe tener las claves de estilo esperadas', () => {
      expect(commonStyles).toHaveProperty('cardContainer');
      expect(commonStyles).toHaveProperty('cardHeader');
      expect(commonStyles).toHaveProperty('titleContainer');
      expect(commonStyles).toHaveProperty('title');
      expect(commonStyles).toHaveProperty('viewAllButton');
      expect(commonStyles).toHaveProperty('emptyContainer');
      expect(commonStyles).toHaveProperty('loader');
    });

    it('cardContainer debe tener backgroundColor y borderRadius', () => {
      expect(commonStyles.cardContainer).toHaveProperty('backgroundColor');
      expect(commonStyles.cardContainer).toHaveProperty('borderRadius');
    });

    it('cardHeader debe tener flexDirection row', () => {
      expect(commonStyles.cardHeader.flexDirection).toBe('row');
    });
  });
});
