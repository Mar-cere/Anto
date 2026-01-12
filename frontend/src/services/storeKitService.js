/**
 * Servicio de StoreKit (In-App Purchase)
 * 
 * Gestiona las compras in-app usando StoreKit de Apple
 * Solo funciona en iOS
 * 
 * @author AntoApp Team
 */

import { Platform } from 'react-native';

// Importar expo-in-app-purchases de forma condicional
let InAppPurchases = null;
let moduleChecked = false;

// Función helper para obtener el módulo de forma segura
function getInAppPurchasesModule() {
  // Si ya verificamos y no está disponible, retornar null
  if (moduleChecked && !InAppPurchases) {
    return null;
  }
  
  // Si ya está cargado, retornarlo
  if (InAppPurchases) {
    return InAppPurchases;
  }
  
  // Intentar cargar el módulo dinámicamente
  try {
    // Usar require.ensure o require con manejo de errores
    const module = require('expo-in-app-purchases');
    InAppPurchases = module;
    moduleChecked = true;
    return InAppPurchases;
  } catch (error) {
    // El módulo no está disponible (Expo Go o no compilado)
    // Esto es normal en desarrollo, no mostrar error
    moduleChecked = true;
    InAppPurchases = null;
    return null;
  }
}

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
    this.initializing = false; // Flag para evitar múltiples inicializaciones simultáneas
  }

  /**
   * Verificar si StoreKit está disponible (solo iOS y módulo nativo disponible)
   */
  isAvailable() {
    if (Platform.OS !== 'ios') {
      return false;
    }
    const module = getInAppPurchasesModule();
    return module !== null;
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

    // Si ya está inicializado, retornar éxito
    if (this.isInitialized) {
      return { success: true };
    }

    // Si ya se está inicializando, esperar a que termine
    if (this.initializing) {
      // Esperar hasta que termine la inicialización
      let attempts = 0;
      while (this.initializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (this.isInitialized) {
          return { success: true };
        }
      }
      // Si después de esperar aún no está inicializado, intentar de nuevo
      if (!this.isInitialized) {
        console.warn('[StoreKit] Timeout esperando inicialización, reintentando...');
      }
    }

    const module = getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible. Necesitas hacer prebuild o usar un build nativo.',
      };
    }

    // Marcar como inicializando
    this.initializing = true;

    try {
      // Conectar con App Store
      const connectResult = await module.connectAsync();
      
      // Validar que el resultado sea válido
      if (!connectResult) {
        this.initializing = false;
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
        };
      }
      
      const { connected } = connectResult;
      
      if (!connected) {
        this.initializing = false;
        return {
          success: false,
          error: 'No se pudo conectar con App Store',
        };
      }

      this.isInitialized = true;
      this.initializing = false;
      console.log('[StoreKit] Conexión inicializada correctamente');

      // Configurar listener para actualizaciones de compras (solo si no existe)
      if (!this.purchaseUpdateListener) {
        this.setupPurchaseListeners();
      }

      // Cargar productos disponibles
      await this.loadProducts();

      return { success: true };
    } catch (error) {
      this.initializing = false;
      console.error('[StoreKit] Error inicializando:', error);
      
      // Si el error es "Already connected", considerar como éxito
      if (error.message && error.message.includes('Already connected')) {
        console.log('[StoreKit] Ya estaba conectado, marcando como inicializado');
        this.isInitialized = true;
        if (!this.purchaseUpdateListener) {
          this.setupPurchaseListeners();
        }
        return { success: true };
      }
      
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
    const module = getInAppPurchasesModule();
    if (!module) {
      return;
    }
    // Listener para actualizaciones de compras
    this.purchaseUpdateListener = module.addPurchaseUpdateListener(
      async (update) => {
        console.log('[StoreKit] Actualización de compra:', update);
        
        // Validar que update exista y tenga las propiedades necesarias
        if (!update) {
          console.warn('[StoreKit] Actualización de compra sin datos');
          return;
        }
        
        if (update.responseCode === module.IAPResponseCode.OK && update.results && Array.isArray(update.results)) {
          for (const purchase of update.results) {
            if (!purchase) continue;
            
            if (purchase.acknowledged) {
              console.log('[StoreKit] Compra ya reconocida:', purchase.productId);
              continue;
            }

            // Procesar la compra
            if (purchase.purchaseState === module.PurchaseState.PURCHASED) {
              console.log('[StoreKit] Compra exitosa:', purchase.productId);
              // La validación se hace en el método de compra
            } else if (purchase.purchaseState === module.PurchaseState.RESTORED) {
              console.log('[StoreKit] Compra restaurada:', purchase.productId);
            }
          }
        } else {
          console.warn('[StoreKit] Actualización de compra con código de error:', update.responseCode);
        }
      }
    );
  }

  /**
   * Cargar productos disponibles desde App Store
   */
  async loadProducts() {
    if (!this.isInitialized && !this.initializing) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    } else if (this.initializing) {
      // Esperar a que termine la inicialización
      let attempts = 0;
      while (this.initializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (this.isInitialized) break;
      }
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'No se pudo inicializar StoreKit',
          products: [],
        };
      }
    }

    const module = getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible',
        products: [],
      };
    }

    try {
      const productIds = Object.values(PRODUCT_IDS);
      const productsResult = await module.getProductsAsync(productIds);
      
      if (!productsResult) {
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
          products: [],
        };
      }
      
      const { responseCode, results } = productsResult;
      
      if (responseCode === module.IAPResponseCode.OK) {
        // Validar que results sea un array
        const validResults = Array.isArray(results) ? results : [];
        this.products = validResults;
        console.log('[StoreKit] Productos cargados:', validResults.length);
        
        return {
          success: true,
          products: validResults.map(p => ({
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
    // Validar que products sea un array
    if (!Array.isArray(this.products)) {
      return [];
    }
    return this.products.map(p => {
      if (!p || !p.productId) return null;
      return {
        id: p.productId,
        plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: p.currency,
        priceValue: parseFloat(p.price),
      };
    }).filter(p => p !== null); // Filtrar productos inválidos
  }

  /**
   * Comprar suscripción
   * @param {string} plan - Plan a comprar ('weekly', 'monthly', etc.)
   * @param {Function} onValidateReceipt - Función para validar el recibo con el backend
   */
  async purchaseSubscription(plan, onValidateReceipt) {
    if (!this.isInitialized && !this.initializing) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    } else if (this.initializing) {
      // Esperar a que termine la inicialización
      let attempts = 0;
      while (this.initializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (this.isInitialized) break;
      }
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'No se pudo inicializar StoreKit. Por favor, intenta de nuevo.',
        };
      }
    }

    const productId = PRODUCT_IDS[plan];
    if (!productId) {
      return {
        success: false,
        error: `Plan no válido: ${plan}`,
      };
    }

    const module = getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible. Necesitas hacer prebuild o usar un build nativo.',
      };
    }

    try {
      console.log('[StoreKit] Iniciando compra:', productId);

      // Solicitar compra
      const purchaseResult = await module.purchaseItemAsync(productId);
      
      if (!purchaseResult) {
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
        };
      }
      
      const { responseCode, results } = purchaseResult;

      if (responseCode === module.IAPResponseCode.OK && results && results.length > 0) {
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
        await module.finishTransactionAsync(purchase);

        return {
          success: true,
          purchase,
          plan: PRODUCT_ID_TO_PLAN[productId] || plan,
        };
      } else if (responseCode === module.IAPResponseCode.USER_CANCELED) {
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
      
      // Manejar error "Already connected" específicamente
      if (error.message && error.message.includes('Already connected')) {
        console.log('[StoreKit] Ya estaba conectado, intentando comprar de nuevo...');
        // Marcar como inicializado y reintentar
        this.isInitialized = true;
        // Reintentar la compra una vez
        try {
          const retryResult = await module.purchaseItemAsync(productId);
          if (!retryResult) {
            throw new Error('No se recibió respuesta de App Store en reintento');
          }
          const { responseCode, results } = retryResult;
          if (responseCode === module.IAPResponseCode.OK && results && results.length > 0) {
            const purchase = results[0];
            if (onValidateReceipt) {
              const validationResult = await onValidateReceipt({
                transactionReceipt: purchase.transactionReceipt,
                productId: purchase.productId,
                transactionId: purchase.transactionId,
                originalTransactionIdentifierIOS: purchase.originalTransactionIdentifierIOS,
              });
              if (validationResult.success) {
                await module.finishTransactionAsync(purchase);
                return {
                  success: true,
                  purchase,
                  plan: PRODUCT_ID_TO_PLAN[productId] || plan,
                };
              }
            }
          }
        } catch (retryError) {
          console.error('[StoreKit] Error en reintento de compra:', retryError);
        }
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

    const module = getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible',
        purchases: [],
      };
    }

    try {
      console.log('[StoreKit] Restaurando compras...');
      
      const restoreResult = await module.restorePurchasesAsync();
      
      if (!restoreResult) {
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
          purchases: [],
        };
      }
      
      const { responseCode, results } = restoreResult;
      
      if (responseCode === module.IAPResponseCode.OK) {
        // Validar que results sea un array
        const validResults = Array.isArray(results) ? results : [];
        console.log('[StoreKit] Compras restauradas:', validResults.length);

        return {
          success: true,
          purchases: validResults.map(p => ({
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

    const module = getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible',
        subscriptions: [],
      };
    }

    try {
      const historyResult = await module.getPurchaseHistoryAsync();
      
      if (!historyResult) {
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
          subscriptions: [],
        };
      }
      
      const { responseCode, results } = historyResult;
      
      if (responseCode === module.IAPResponseCode.OK) {
        // Validar que results sea un array
        const validResults = Array.isArray(results) ? results : [];
        // Filtrar solo suscripciones activas
        const activeSubscriptions = validResults.filter(p => {
          if (!p || !p.productId) return false;
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
      const module = getInAppPurchasesModule();
      if (module) {
        try {
          await module.disconnectAsync();
          this.isInitialized = false;
          console.log('[StoreKit] Conexión cerrada');
        } catch (error) {
          console.error('[StoreKit] Error cerrando conexión:', error);
        }
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
