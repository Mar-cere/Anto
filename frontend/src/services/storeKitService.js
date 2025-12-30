/**
 * Servicio de StoreKit (In-App Purchase)
 * 
 * Gestiona las compras in-app usando StoreKit de Apple
 * Solo funciona en iOS
 * 
 * @author AntoApp Team
 */

import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';

// Product IDs - Estos deben coincidir con los configurados en App Store Connect
// Formato: com.anto.app.{plan}
const PRODUCT_IDS = {
  weekly: 'com.anto.app.weekly',
  monthly: 'com.anto.app.monthly',
  quarterly: 'com.anto.app.quarterly',
  semestral: 'com.anto.app.semestral',
  yearly: 'com.anto.app.yearly',
};

// Mapeo inverso: de productId a plan
const PRODUCT_ID_TO_PLAN = {
  'com.anto.app.weekly': 'weekly',
  'com.anto.app.monthly': 'monthly',
  'com.anto.app.quarterly': 'quarterly',
  'com.anto.app.semestral': 'semestral',
  'com.anto.app.yearly': 'yearly',
};

class StoreKitService {
  constructor() {
    this.isInitialized = false;
    this.products = [];
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
  }

  /**
   * Verificar si StoreKit está disponible (solo iOS)
   * Nota: StoreKit NO funciona en simuladores, solo en dispositivos reales
   * react-native-iap detectará esto y lanzará E_IAP_NOT_AVAILABLE
   */
  isAvailable() {
    return Platform.OS === 'ios';
  }

  /**
   * Inicializar conexión con App Store
   */
  async initialize() {
    if (!this.isAvailable()) {
      console.log('[StoreKit] No disponible en esta plataforma o simulador');
      return { 
        success: false, 
        error: 'StoreKit solo está disponible en dispositivos iOS reales. No funciona en simulador.' 
      };
    }

    if (this.isInitialized) {
      return { success: true };
    }

    try {
      // Inicializar conexión
      await RNIap.initConnection();
      this.isInitialized = true;
      console.log('[StoreKit] Conexión inicializada correctamente');

      // Configurar listeners para actualizaciones de compras
      this.setupPurchaseListeners();

      // Cargar productos disponibles
      await this.loadProducts();

      return { success: true };
    } catch (error) {
      // Manejar error específico de IAP no disponible
      if (error.code === 'E_IAP_NOT_AVAILABLE' || error.message?.includes('E_IAP_NOT_AVAILABLE')) {
        console.warn('[StoreKit] StoreKit no disponible (normal en simulador o si no está configurado)');
        return {
          success: false,
          error: 'StoreKit no está disponible. Esto es normal si estás en un simulador. StoreKit solo funciona en dispositivos iOS reales.',
          code: 'E_IAP_NOT_AVAILABLE',
          isSimulator: true // Indicar que probablemente es simulador
        };
      }
      
      console.error('[StoreKit] Error inicializando:', error);
      return {
        success: false,
        error: error.message || 'Error al inicializar StoreKit',
        code: error.code
      };
    }
  }

  /**
   * Configurar listeners para compras
   */
  setupPurchaseListeners() {
    // Listener para actualizaciones de compras
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase) => {
        console.log('[StoreKit] Compra actualizada:', purchase);
        // La validación se hace en el método de compra
      }
    );

    // Listener para errores de compra
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
      console.error('[StoreKit] Error en compra:', error);
    });
  }

  /**
   * Cargar productos disponibles desde App Store
   */
  async loadProducts() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const productIds = Object.values(PRODUCT_IDS);
      const products = await RNIap.getProducts({ skus: productIds });
      
      this.products = products;
      console.log('[StoreKit] Productos cargados:', products.length);
      
      return {
        success: true,
        products: products.map(p => ({
          id: p.productId,
          plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
          title: p.title,
          description: p.description,
          price: p.localizedPrice,
          currency: p.currency,
          priceValue: p.price,
        })),
      };
    } catch (error) {
      console.error('[StoreKit] Error cargando productos:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar productos',
        products: [],
      };
    }
  }

  /**
   * Obtener productos disponibles
   */
  getProducts() {
    return this.products.map(p => ({
      id: p.productId,
      plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
      title: p.title,
      description: p.description,
      price: p.localizedPrice,
      currency: p.currency,
      priceValue: p.price,
    }));
  }

  /**
   * Comprar suscripción
   * @param {string} plan - Plan a comprar ('weekly', 'monthly', etc.)
   * @param {Function} onValidateReceipt - Función para validar el recibo con el backend
   */
  async purchaseSubscription(plan, onValidateReceipt) {
    if (!this.isInitialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    const productId = PRODUCT_IDS[plan];
    if (!productId) {
      return {
        success: false,
        error: `Plan no válido: ${plan}`,
      };
    }

    try {
      console.log('[StoreKit] Iniciando compra:', productId);

      // Solicitar compra
      const purchase = await RNIap.requestSubscription(productId);

      console.log('[StoreKit] Compra realizada:', purchase);

      // Validar recibo con el backend
      if (onValidateReceipt) {
        const validationResult = await onValidateReceipt({
          transactionReceipt: purchase.transactionReceipt,
          productId: purchase.productId,
          transactionId: purchase.transactionId,
          originalTransactionIdentifierIOS: purchase.originalTransactionIdentifierIOS,
        });

        if (!validationResult.success) {
          // Si la validación falla, no finalizar la compra
          // El usuario puede restaurar compras más tarde
          return {
            success: false,
            error: validationResult.error || 'Error al validar la compra',
            purchase,
          };
        }
      }

      // Finalizar la transacción
      await RNIap.finishTransaction(purchase);

      return {
        success: true,
        purchase,
        plan: PRODUCT_ID_TO_PLAN[productId] || plan,
      };
    } catch (error) {
      console.error('[StoreKit] Error en compra:', error);

      // Manejar errores específicos
      if (error.code === 'E_USER_CANCELLED') {
        return {
          success: false,
          error: 'Compra cancelada por el usuario',
          cancelled: true,
        };
      }

      return {
        success: false,
        error: error.message || 'Error al procesar la compra',
      };
    }
  }

  /**
   * Restaurar compras anteriores
   */
  async restorePurchases() {
    if (!this.isInitialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    try {
      console.log('[StoreKit] Restaurando compras...');
      
      const purchases = await RNIap.getAvailablePurchases();
      
      console.log('[StoreKit] Compras disponibles:', purchases.length);

      return {
        success: true,
        purchases: purchases.map(p => ({
          productId: p.productId,
          plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
          transactionId: p.transactionId,
          transactionReceipt: p.transactionReceipt,
          originalTransactionIdentifierIOS: p.originalTransactionIdentifierIOS,
        })),
      };
    } catch (error) {
      console.error('[StoreKit] Error restaurando compras:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar compras',
        purchases: [],
      };
    }
  }

  /**
   * Obtener suscripciones activas
   */
  async getActiveSubscriptions() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const purchases = await RNIap.getAvailablePurchases();
      
      // Filtrar solo suscripciones activas
      const activeSubscriptions = purchases.filter(p => {
        const plan = PRODUCT_ID_TO_PLAN[p.productId];
        return plan !== undefined;
      });

      return {
        success: true,
        subscriptions: activeSubscriptions.map(p => ({
          productId: p.productId,
          plan: PRODUCT_ID_TO_PLAN[p.productId],
          transactionId: p.transactionId,
        })),
      };
    } catch (error) {
      console.error('[StoreKit] Error obteniendo suscripciones activas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener suscripciones activas',
        subscriptions: [],
      };
    }
  }

  /**
   * Limpiar recursos y cerrar conexión
   */
  async cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }

    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }

    if (this.isInitialized) {
      try {
        await RNIap.endConnection();
        this.isInitialized = false;
        console.log('[StoreKit] Conexión cerrada');
      } catch (error) {
        console.error('[StoreKit] Error cerrando conexión:', error);
      }
    }
  }

  /**
   * Obtener el Product ID para un plan
   */
  getProductId(plan) {
    return PRODUCT_IDS[plan];
  }

  /**
   * Obtener el plan desde un Product ID
   */
  getPlanFromProductId(productId) {
    return PRODUCT_ID_TO_PLAN[productId];
  }
}

export default new StoreKitService();

