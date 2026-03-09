/**
 * Tests unitarios para servicio de pagos
 * 
 * @author AntoApp Team
 */

// Mock api antes de importar
const mockApi = {
  get: jest.fn(),
  post: jest.fn()
};

jest.mock('../../config/api', () => {
  const mockApiObj = {
    get: jest.fn(),
    post: jest.fn()
  };
  return {
    __esModule: true,
    default: mockApiObj,
    api: mockApiObj,
    ENDPOINTS: {
      PAYMENT_PLANS: '/api/payments/plans',
      PAYMENT_CREATE_CHECKOUT: '/api/payments/create-checkout-session',
      PAYMENT_TRIAL_INFO: '/api/payments/trial-info',
      PAYMENT_SUBSCRIPTION_STATUS: '/api/payments/subscription-status',
      PAYMENT_VALIDATE_RECEIPT: '/api/payments/validate-receipt',
      PAYMENT_CANCEL_SUBSCRIPTION: '/api/payments/cancel-subscription',
      PAYMENT_UPDATE_METHOD: '/api/payments/update-payment-method',
      PAYMENT_TRANSACTIONS: '/api/payments/transactions',
      PAYMENT_TRANSACTIONS_STATS: '/api/payments/transactions/stats',
    }
  };
});

jest.mock('../storeKitService', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(),
    purchaseSubscription: jest.fn(),
    restorePurchases: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native con Linking (paymentService importa Linking desde 'react-native').
// Definir Linking dentro del factory para que exista cuando Jest aplica el mock.
jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: (d) => d?.android },
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

// Importar después de mocks
import paymentService from '../paymentService';
import { Linking, Platform } from 'react-native';
import storeKitService from '../storeKitService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Obtener el mock de api después de importar
const apiModule = require('../../config/api');
const apiMock = apiModule.default || apiModule.api;
const mockLinking = Linking;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLinking.canOpenURL.mockResolvedValue(true);
    mockLinking.openURL.mockResolvedValue(undefined);
  });

  describe('getPlans', () => {
    it('debe obtener planes exitosamente', async () => {
      const mockPlans = {
        plans: [{ id: 'monthly', name: 'Mensual' }],
        provider: 'mercadopago'
      };
      if (apiMock) {
        apiMock.get.mockResolvedValue(mockPlans);
      }

      const result = await paymentService.getPlans();

      expect(result.success).toBe(true);
      expect(result.plans).toEqual(mockPlans.plans);
      if (apiMock) {
        expect(apiMock.get).toHaveBeenCalledWith('/api/payments/plans');
      }
    });

    it('debe manejar errores al obtener planes', async () => {
      if (apiMock) {
        apiMock.get.mockRejectedValue(new Error('Network error'));
      }

      const result = await paymentService.getPlans();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('createCheckoutSession', () => {
    it('debe crear sesión de checkout exitosamente', async () => {
      const mockResponse = {
        sessionId: 'session-123',
        url: 'https://mercadopago.com/checkout',
        preferenceId: 'pref-123'
      };
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }

      const result = await paymentService.createCheckoutSession('monthly');

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('session-123');
      expect(result.url).toBe('https://mercadopago.com/checkout');
      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
          '/api/payments/create-checkout-session',
          { plan: 'monthly' }
        );
      }
    });

    it('debe incluir URLs opcionales en el payload', async () => {
      const mockResponse = { sessionId: 'session-123' };
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }

      await paymentService.createCheckoutSession('monthly', 'https://success.com', 'https://cancel.com');

      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
          '/api/payments/create-checkout-session',
          {
            plan: 'monthly',
            successUrl: 'https://success.com',
            cancelUrl: 'https://cancel.com'
          }
        );
      }
    });

    it('debe manejar errores al crear sesión', async () => {
      if (apiMock) {
        apiMock.post.mockRejectedValue(new Error('Payment error'));
      }

      const result = await paymentService.createCheckoutSession('monthly');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('en iOS con StoreKit disponible debe retornar useStoreKit sin llamar al backend', async () => {
      Platform.OS = 'ios';
      storeKitService.isAvailable.mockReturnValue(true);

      const result = await paymentService.createCheckoutSession('monthly');

      expect(result.success).toBe(true);
      expect(result.useStoreKit).toBe(true);
      expect(result.plan).toBe('monthly');
      if (apiMock) {
        expect(apiMock.post).not.toHaveBeenCalled();
      }
      Platform.OS = 'android';
      storeKitService.isAvailable.mockReturnValue(false);
    });
  });

  describe('openPaymentUrl', () => {
    it('debe abrir URL de pago exitosamente', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue();

      const result = await paymentService.openPaymentUrl('https://mercadopago.com/checkout');

      expect(result).toBe(true);
      expect(mockLinking.openURL).toHaveBeenCalledWith('https://mercadopago.com/checkout');
    });

    it('debe retornar false si no se puede abrir la URL', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false);

      const result = await paymentService.openPaymentUrl('invalid-url');

      expect(result).toBe(false);
      expect(mockLinking.openURL).not.toHaveBeenCalled();
    });

    it('debe manejar errores al abrir URL', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockRejectedValue(new Error('Cannot open URL'));

      const result = await paymentService.openPaymentUrl('https://mercadopago.com/checkout');

      expect(result).toBe(false);
    });
  });

  describe('getTrialInfo', () => {
    it('debe obtener información del trial', async () => {
      const mockResponse = {
        hasTrial: true,
        trialDaysRemaining: 5
      };
      if (apiMock) {
        apiMock.get.mockResolvedValue(mockResponse);
      }

      const result = await paymentService.getTrialInfo();

      expect(result.success).toBe(true);
      expect(result.hasTrial).toBe(true);
      if (apiMock) {
        expect(apiMock.get).toHaveBeenCalledWith('/api/payments/trial-info');
      }
    });

    it('debe manejar errores al obtener trial info', async () => {
      if (apiMock) {
        apiMock.get.mockRejectedValue(new Error('Network error'));
      }

      const result = await paymentService.getTrialInfo();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('purchaseWithStoreKit', () => {
    const mockReceiptData = {
      transactionReceipt: 'base64-receipt-data',
      productId: 'com.anto.app.monthly',
      transactionId: 'tx-123',
      originalTransactionIdentifierIOS: 'orig-456',
    };

    beforeEach(() => {
      Platform.OS = 'ios';
      storeKitService.isAvailable.mockReturnValue(true);
      storeKitService.purchaseSubscription.mockImplementation(async (plan, onValidateReceipt) => {
        return await onValidateReceipt(mockReceiptData);
      });
    });

    afterEach(() => {
      Platform.OS = 'android';
    });

    it('retorna error cuando StoreKit no está disponible', async () => {
      storeKitService.isAvailable.mockReturnValue(false);

      const result = await paymentService.purchaseWithStoreKit('monthly');

      expect(result.success).toBe(false);
      expect(result.error).toContain('no está disponible');
      expect(storeKitService.purchaseSubscription).not.toHaveBeenCalled();
    });

    it('valida el recibo con el backend y retorna éxito cuando la respuesta es success: true', async () => {
      const mockSubscription = { plan: 'monthly', status: 'active' };
      if (apiMock) {
        apiMock.post.mockResolvedValue({ success: true, subscription: mockSubscription });
      }

      const result = await paymentService.purchaseWithStoreKit('monthly');

      expect(storeKitService.purchaseSubscription).toHaveBeenCalledWith('monthly', expect.any(Function));
      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
          '/api/payments/validate-receipt',
          expect.objectContaining({
            receipt: mockReceiptData.transactionReceipt,
            productId: mockReceiptData.productId,
          })
        );
      }
      expect(result.success).toBe(true);
      expect(result.subscription).toEqual(mockSubscription);
    });

    it('incluye appleStatus en la respuesta cuando el backend rechaza el recibo', async () => {
      if (apiMock) {
        apiMock.post.mockResolvedValue({
          success: false,
          error: 'Recibo rechazado por Apple',
          appleStatus: 21002,
        });
      }

      const result = await paymentService.purchaseWithStoreKit('monthly');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.appleStatus).toBe(21002);
    });

    it('incluye appleStatus cuando la validación lanza (respuesta de error del servidor)', async () => {
      if (apiMock) {
        apiMock.post.mockRejectedValue({
          response: { status: 400, data: { error: 'Invalid receipt', appleStatus: 21003 } },
          message: 'Request failed',
        });
      }

      const result = await paymentService.purchaseWithStoreKit('monthly');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.appleStatus).toBe(21003);
    });

    it('retorna error cuando validateReceipt recibe datos incompletos (sin transactionReceipt)', async () => {
      storeKitService.purchaseSubscription.mockImplementation(async (plan, onValidateReceipt) => {
        return await onValidateReceipt({ productId: 'com.anto.app.monthly' });
      });

      const result = await paymentService.purchaseWithStoreKit('monthly');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/incompletos|transactionReceipt/i);
      if (apiMock) {
        expect(apiMock.post).not.toHaveBeenCalled();
      }
    });

    it('retorna error cuando validateReceipt recibe datos incompletos (sin productId)', async () => {
      storeKitService.purchaseSubscription.mockImplementation(async (plan, onValidateReceipt) => {
        return await onValidateReceipt({ transactionReceipt: 'base64-data' });
      });

      const result = await paymentService.purchaseWithStoreKit('monthly');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/incompletos|productId/i);
      if (apiMock) {
        expect(apiMock.post).not.toHaveBeenCalled();
      }
    });

    it('retorna error cuando receiptData es null', async () => {
      storeKitService.purchaseSubscription.mockImplementation(async (plan, onValidateReceipt) => {
        return await onValidateReceipt(null);
      });

      const result = await paymentService.purchaseWithStoreKit('monthly');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getSubscriptionStatus', () => {
    it('debe retornar éxito con datos cuando el backend responde correctamente', async () => {
      const mockStatus = { subscription: { plan: 'monthly', status: 'active' } };
      if (apiMock) {
        apiMock.get.mockResolvedValue(mockStatus);
      }

      const result = await paymentService.getSubscriptionStatus();

      expect(result.success).toBe(true);
      expect(result.subscription).toEqual(mockStatus.subscription);
      if (apiMock) {
        expect(apiMock.get).toHaveBeenCalledWith('/api/payments/subscription-status');
      }
    });

    it('cuando response.notModified y no hay caché retorna notModified', async () => {
      await AsyncStorage.clear();
      if (apiMock) {
        apiMock.get.mockResolvedValue({ notModified: true });
      }

      const result = await paymentService.getSubscriptionStatus();

      expect(result.success).toBe(true);
      expect(result.notModified).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('debe manejar errores al obtener estado de suscripción', async () => {
      if (apiMock) {
        apiMock.get.mockRejectedValue(new Error('Network error'));
      }

      const result = await paymentService.getSubscriptionStatus();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('restorePurchases', () => {
    it('retorna error cuando StoreKit no está disponible', async () => {
      Platform.OS = 'android';
      storeKitService.isAvailable.mockReturnValue(false);

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(false);
      expect(result.error).toContain('no está disponible');
      expect(result.purchases).toEqual([]);
      expect(storeKitService.restorePurchases).not.toHaveBeenCalled();
    });

    it('retorna el resultado de storeKit cuando success y purchases vacío', async () => {
      Platform.OS = 'ios';
      storeKitService.isAvailable.mockReturnValue(true);
      storeKitService.restorePurchases.mockResolvedValue({ success: true, purchases: [] });

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(true);
      expect(result.purchases).toEqual([]);
      if (apiMock) {
        expect(apiMock.post).not.toHaveBeenCalled();
      }
    });

    it('valida cada compra restaurada con el backend y retorna éxito si al menos una valida', async () => {
      Platform.OS = 'ios';
      storeKitService.isAvailable.mockReturnValue(true);
      const purchase = {
        transactionReceipt: 'receipt-1',
        productId: 'com.anto.app.monthly',
        transactionId: 'tx-1',
        originalTransactionIdentifierIOS: 'orig-1',
      };
      storeKitService.restorePurchases.mockResolvedValue({ success: true, purchases: [purchase] });
      if (apiMock) {
        apiMock.post.mockResolvedValue({ success: true, subscription: { plan: 'monthly' } });
      }

      const result = await paymentService.restorePurchases();

      expect(storeKitService.restorePurchases).toHaveBeenCalled();
      expect(apiMock.post).toHaveBeenCalledWith(
        '/api/payments/validate-receipt',
        expect.objectContaining({
          receipt: 'receipt-1',
          productId: 'com.anto.app.monthly',
          restore: true,
        })
      );
      expect(result.success).toBe(true);
      expect(result.purchases).toEqual([purchase]);
    });

    it('retorna error cuando todas las validaciones de compras restauradas fallan', async () => {
      Platform.OS = 'ios';
      storeKitService.isAvailable.mockReturnValue(true);
      const purchase = {
        transactionReceipt: 'receipt-1',
        productId: 'com.anto.app.monthly',
      };
      storeKitService.restorePurchases.mockResolvedValue({ success: true, purchases: [purchase] });
      if (apiMock) {
        apiMock.post.mockRejectedValue(new Error('Invalid receipt'));
      }

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/validar las compras restauradas|No se pudieron validar/i);
      expect(result.purchases).toEqual([purchase]);
    });
  });

  describe('cancelSubscription', () => {
    it('debe cancelar suscripción exitosamente', async () => {
      const mockResponse = { message: 'Suscripción cancelada' };
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }

      const result = await paymentService.cancelSubscription();

      expect(result.success).toBe(true);
      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
          '/api/payments/cancel-subscription',
          { cancelImmediately: false }
        );
      }
    });

    it('debe enviar cancelImmediately true cuando se indica', async () => {
      if (apiMock) {
        apiMock.post.mockResolvedValue({});
      }

      await paymentService.cancelSubscription(true);

      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
          '/api/payments/cancel-subscription',
          { cancelImmediately: true }
        );
      }
    });

    it('debe manejar errores al cancelar', async () => {
      if (apiMock) {
        apiMock.post.mockRejectedValue(new Error('Cannot cancel'));
      }

      const result = await paymentService.cancelSubscription();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updatePaymentMethod', () => {
    it('debe actualizar método de pago exitosamente', async () => {
      const mockResponse = { message: 'Método actualizado' };
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }

      const result = await paymentService.updatePaymentMethod('pm_123');

      expect(result.success).toBe(true);
      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith('/api/payments/update-payment-method', {
          paymentMethodId: 'pm_123',
        });
      }
    });

    it('debe manejar errores al actualizar método', async () => {
      if (apiMock) {
        apiMock.post.mockRejectedValue(new Error('Invalid method'));
      }

      const result = await paymentService.updatePaymentMethod('pm_123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getTransactions', () => {
    it('debe retornar transacciones exitosamente', async () => {
      const mockResponse = {
        transactions: [{ _id: '1', amount: 9990, status: 'completed' }],
        count: 1,
        total: 1,
      };
      if (apiMock) {
        apiMock.get.mockResolvedValue(mockResponse);
      }

      const result = await paymentService.getTransactions();

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].amount).toBe(9990);
      expect(result.count).toBe(1);
      expect(result.total).toBe(1);
      if (apiMock) {
        expect(apiMock.get).toHaveBeenCalledWith(
          '/api/payments/transactions',
          expect.objectContaining({ limit: 50, skip: 0 })
        );
      }
    });

    it('debe pasar opciones limit, skip, status, type al backend', async () => {
      if (apiMock) {
        apiMock.get.mockResolvedValue({ transactions: [], count: 0, total: 0 });
      }

      await paymentService.getTransactions({
        limit: 10,
        skip: 20,
        status: 'completed',
        type: 'subscription',
      });

      if (apiMock) {
        expect(apiMock.get).toHaveBeenCalledWith('/api/payments/transactions', {
          limit: 10,
          skip: 20,
          status: 'completed',
          type: 'subscription',
        });
      }
    });

    it('debe retornar array vacío y error en caso de fallo', async () => {
      if (apiMock) {
        apiMock.get.mockRejectedValue(new Error('Network error'));
      }

      const result = await paymentService.getTransactions();

      expect(result.success).toBe(false);
      expect(result.transactions).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe('getTransactionStats', () => {
    it('debe retornar estadísticas exitosamente', async () => {
      const mockStats = { totalRevenue: 50000, transactionCount: 10 };
      if (apiMock) {
        apiMock.get.mockResolvedValue({ stats: mockStats });
      }

      const result = await paymentService.getTransactionStats();

      expect(result.success).toBe(true);
      expect(result.stats).toEqual(mockStats);
      if (apiMock) {
        expect(apiMock.get).toHaveBeenCalledWith(
          '/api/payments/transactions/stats',
          expect.any(Object)
        );
      }
    });

    it('debe pasar startDate y endDate cuando se proporcionan', async () => {
      if (apiMock) {
        apiMock.get.mockResolvedValue({ stats: {} });
      }

      await paymentService.getTransactionStats({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      if (apiMock) {
        expect(apiMock.get).toHaveBeenCalledWith('/api/payments/transactions/stats', {
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        });
      }
    });

    it('debe manejar errores y retornar stats vacío', async () => {
      if (apiMock) {
        apiMock.get.mockRejectedValue(new Error('Server error'));
      }

      const result = await paymentService.getTransactionStats();

      expect(result.success).toBe(false);
      expect(result.stats).toEqual({});
      expect(result.error).toBeDefined();
    });
  });
});
