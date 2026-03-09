/**
 * Tests unitarios para storeKitService
 * @author AntoApp Team
 */

const Platform = { OS: 'android' };
jest.mock('react-native', () => ({ Platform }));

// expo-in-app-purchases no está disponible en Jest (entorno Node)
jest.mock('expo-in-app-purchases', () => {
  throw new Error('expo-in-app-purchases not available');
}, { virtual: true });

// Cargar el servicio después de los mocks
let storeKitService;
beforeAll(() => {
  jest.isolateModules(() => {
    storeKitService = require('../storeKitService').default;
  });
});

describe('storeKitService', () => {
  describe('isAvailable', () => {
    it('debe retornar false cuando Platform.OS no es ios', () => {
      expect(Platform.OS).toBe('android');
      expect(storeKitService.isAvailable()).toBe(false);
    });

    it('debe retornar false en iOS cuando el módulo nativo no está disponible', () => {
      Platform.OS = 'ios';
      jest.isolateModules(() => {
        const service = require('../storeKitService').default;
        expect(service.isAvailable()).toBe(false);
      });
      Platform.OS = 'android';
    });
  });

  describe('getProductId', () => {
    it('debe devolver el product ID para cada plan', () => {
      expect(storeKitService.getProductId('monthly')).toBe('com.anto.app.monthly');
      expect(storeKitService.getProductId('quarterly')).toBe('com.anto.app.quarterly');
      expect(storeKitService.getProductId('semestral')).toBe('com.anto.app.semestral');
      expect(storeKitService.getProductId('yearly')).toBe('com.anto.app.yearly');
    });

    it('debe devolver undefined para plan no definido', () => {
      expect(storeKitService.getProductId('unknown')).toBeUndefined();
    });
  });

  describe('getPlanFromProductId', () => {
    it('debe devolver el plan para cada product ID', () => {
      expect(storeKitService.getPlanFromProductId('com.anto.app.monthly')).toBe('monthly');
      expect(storeKitService.getPlanFromProductId('com.anto.app.quarterly')).toBe('quarterly');
      expect(storeKitService.getPlanFromProductId('com.anto.app.semestral')).toBe('semestral');
      expect(storeKitService.getPlanFromProductId('com.anto.app.yearly')).toBe('yearly');
    });

    it('debe devolver undefined para product ID no mapeado', () => {
      expect(storeKitService.getPlanFromProductId('com.other.app.plan')).toBeUndefined();
    });
  });

  describe('getProducts', () => {
    it('debe devolver array vacío cuando no hay productos cargados', () => {
      expect(storeKitService.getProducts()).toEqual([]);
    });
  });
});
