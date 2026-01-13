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
      PAYMENT_SUBSCRIPTION_STATUS: '/api/payments/subscription-status'
    }
  };
});

// Mock Linking antes de importar
const mockLinking = {
  canOpenURL: jest.fn(),
  openURL: jest.fn()
};

jest.mock('react-native/Libraries/Linking/Linking', () => mockLinking);

// Importar después de mocks
import paymentService from '../paymentService';

// Obtener el mock de api después de importar
const apiModule = require('../../config/api');
const apiMock = apiModule.default || apiModule.api;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
