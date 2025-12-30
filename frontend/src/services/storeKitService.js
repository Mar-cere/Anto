/**
 * Servicio de StoreKit (In-App Purchase)
 * 
 * Gestiona las compras in-app usando StoreKit de Apple
 * Solo funciona en iOS
 * 
 * @author AntoApp Team
 */

import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';

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
    this.purchaseUpdateListener = null;
  }

  /**
   * Verificar si StoreKit está disponible (solo iOS)
   */
  isAvailable() {
    return Platform.OS === 'ios';
  }

  /**
   * Inicializar conexión con App Store
   */
  async initialize() {
    if (!this.isAvailable()) {
      console.log('[StoreKit] No disponible en esta plataforma');
      return { 
        success: false, 
        error: 'StoreKit solo está disponible en iOS' 
      };
    }

    if (this.isInitialized) {
      return { success: true };
    }

    try {
      // Conectar con App Store
      const { connected } = await InAppPurchases.connectAsync();
      
      if (!connected) {
        return {
          success: false,
          error: 'No se pudo conectar con App Store',
        };
      }

      this.isInitialized = true;
      console.log('[StoreKit] Conexión inicializada correctamente');

      // Configurar listener para actualizaciones de compras
      this.setupPurchaseListeners();

      // Cargar productos disponibles
      await this.loadProducts();

      return { success: true };
    } catch (error) {
      console.error('[StoreKit] Error inicializando:', error);
      return {
        success: false,
        error: error.message || 'Error al inicializar StoreKit',
      };
    }
  }

  /**
   * Configurar listeners para compras
   */
  setupPurchaseListeners() {
    // Listener para actualizaciones de compras
    this.purchaseUpdateListener = InAppPurchases.addPurchaseUpdateListener(
      async (update) => {
        console.log('[StoreKit] Actualización de compra:', update);
        
        if (update.responseCode === InAppPurchases.IAPResponseCode.OK) {
          for (const purchase of update.results) {
            if (purchase.acknowledged) {
              console.log('[StoreKit] Compra ya reconocida:', purchase.productId);
              continue;
            }

            // Procesar la compra
            if (purchase.purchaseState === InAppPurchases.PurchaseState.PURCHASED) {
              console.log('[StoreKit] Compra exitosa:', purchase.productId);
              // La validación se hace en el método de compra
            } else if (purchase.purchaseState === InAppPurchases.PurchaseState.RESTORED) {
              console.log('[StoreKit] Compra restaurada:', purchase.productId);
            }
          }
        }
      }
    );
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
      const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.products = results;
        console.log('[StoreKit] Productos cargados:', results.length);
        
        return {
          success: true,
          products: results.map(p => ({
            id: p.productId,
            plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
            title: p.title,
            description: p.description,
            price: p.price,
            currency: p.currency,
            priceValue: parseFloat(p.price),
          })),
        };
      } else {
        console.warn('[StoreKit] Error obteniendo productos:', responseCode);
        return {
          success: false,
          error: `Error al obtener productos: ${responseCode}`,
          products: [],
        };
      }
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
      price: p.price,
      currency: p.currency,
      priceValue: parseFloat(p.price),
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
      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(productId);

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
        const purchase = results[0];
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
            return {
              success: false,
              error: validationResult.error || 'Error al validar la compra',
              purchase,
            };
          }
        }

        // Finalizar la transacción
        await InAppPurchases.finishTransactionAsync(purchase);

        return {
          success: true,
          purchase,
          plan: PRODUCT_ID_TO_PLAN[productId] || plan,
        };
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        return {
          success: false,
          error: 'Compra cancelada por el usuario',
          cancelled: true,
        };
      } else {
        return {
          success: false,
          error: `Error en la compra: ${responseCode}`,
        };
      }
    } catch (error) {
      console.error('[StoreKit] Error en compra:', error);
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
      
      const { responseCode, results } = await InAppPurchases.restorePurchasesAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        console.log('[StoreKit] Compras restauradas:', results.length);

        return {
          success: true,
          purchases: results.map(p => ({
            productId: p.productId,
            plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
            transactionId: p.transactionId,
            transactionReceipt: p.transactionReceipt,
            originalTransactionIdentifierIOS: p.originalTransactionIdentifierIOS,
          })),
        };
      } else {
        return {
          success: false,
          error: `Error restaurando compras: ${responseCode}`,
          purchases: [],
        };
      }
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
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        // Filtrar solo suscripciones activas
        const activeSubscriptions = results.filter(p => {
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
      } else {
        return {
          success: false,
          error: `Error obteniendo historial: ${responseCode}`,
          subscriptions: [],
        };
      }
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
    if (this.purchaseUpdateListener) {
      this.purchaseUpdateListener.remove();
      this.purchaseUpdateListener = null;
    }

    if (this.isInitialized) {
      try {
        await InAppPurchases.disconnectAsync();
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
