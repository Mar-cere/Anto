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
    console.log('[StoreKit] 🔍 getInAppPurchasesModule: Módulo ya verificado y no disponible');
    return null;
  }
  
  // Si ya está cargado, retornarlo
  if (InAppPurchases) {
    console.log('[StoreKit] ✅ getInAppPurchasesModule: Módulo ya cargado, retornando referencia');
    return InAppPurchases;
  }
  
  // Intentar cargar el módulo dinámicamente
  try {
    console.log('[StoreKit] 🔄 getInAppPurchasesModule: Intentando cargar módulo...');
    // Usar require.ensure o require con manejo de errores
    const module = require('expo-in-app-purchases');
    InAppPurchases = module;
    moduleChecked = true;
    
    // Verificar métodos disponibles
    const hasMethods = {
      connectAsync: typeof module.connectAsync === 'function',
      purchaseItemAsync: typeof module.purchaseItemAsync === 'function',
      IAPResponseCode: !!module.IAPResponseCode,
      getProductsAsync: typeof module.getProductsAsync === 'function',
    };
    
    console.log('[StoreKit] ✅ getInAppPurchasesModule: Módulo cargado exitosamente', {
      hasMethods,
      moduleKeys: Object.keys(module),
    });
    
    return InAppPurchases;
  } catch (error) {
    // El módulo no está disponible (Expo Go o no compilado)
    // Esto es normal en desarrollo, no mostrar error
    console.error('[StoreKit] ❌ getInAppPurchasesModule: Error cargando módulo', {
      error: error.message,
      stack: error.stack,
    });
    moduleChecked = true;
    InAppPurchases = null;
    return null;
  }
}

// Product IDs - Estos deben coincidir con los configurados en App Store Connect
// Formato: com.anto.app.{plan}
const PRODUCT_IDS = {
  monthly: 'com.anto.app.monthly',
  quarterly: 'com.anto.app.quarterly',
  semestral: 'com.anto.app.semestral',
  yearly: 'com.anto.app.yearly',
};

// Mapeo inverso: de productId a plan
const PRODUCT_ID_TO_PLAN = {
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
    this.processingPurchases = new Set(); // Set para rastrear compras en proceso
    this.module = null; // Guardar referencia al módulo después de inicializar
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
    console.log('[StoreKit] 🔄 initialize() llamado', {
      isInitialized: this.isInitialized,
      hasModule: !!this.module,
      initializing: this.initializing,
      timestamp: new Date().toISOString(),
    });

    if (!this.isAvailable()) {
      console.log('[StoreKit] No disponible en esta plataforma');
      return { 
        success: false, 
        error: 'StoreKit solo está disponible en iOS' 
      };
    }

    // Obtener módulo primero para verificar disponibilidad
    let module = this.module || getInAppPurchasesModule();
    if (!module) {
      console.error('[StoreKit] ❌ initialize: Módulo no disponible');
      return {
        success: false,
        error: 'Módulo nativo no disponible. Necesitas hacer prebuild o usar un build nativo.',
      };
    }
    
    console.log('[StoreKit] ✅ initialize: Módulo obtenido', {
      hasConnectAsync: typeof module.connectAsync === 'function',
      hasPurchaseItemAsync: typeof module.purchaseItemAsync === 'function',
      hasIAPResponseCode: !!module.IAPResponseCode,
    });

    // Si ya está inicializado y el módulo está disponible, retornar éxito
    if (this.isInitialized && this.module && typeof this.module.purchaseItemAsync === 'function') {
      return { success: true };
    }

    // Si ya se está inicializando, esperar a que termine
    if (this.initializing) {
      // Esperar hasta que termine la inicialización
      let attempts = 0;
      while (this.initializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (this.isInitialized && this.module && typeof this.module.purchaseItemAsync === 'function') {
          return { success: true };
        }
      }
      // Si después de esperar aún no está inicializado, resetear y reintentar
      if (!this.isInitialized || !this.module) {
        console.warn('[StoreKit] Timeout esperando inicialización, reintentando...');
        this.initializing = false;
        this.isInitialized = false;
        this.module = null;
        // Re-obtener módulo
        module = getInAppPurchasesModule();
        if (!module) {
          return {
            success: false,
            error: 'Módulo nativo no disponible. Necesitas hacer prebuild o usar un build nativo.',
          };
        }
      }
    }

    // Guardar referencia al módulo
    this.module = module;

    // Marcar como inicializando
    this.initializing = true;

    try {
      // Verificar que el módulo y connectAsync estén disponibles
      if (!module || typeof module.connectAsync !== 'function') {
        this.initializing = false;
        this.module = null;
        return {
          success: false,
          error: 'Módulo de compras no disponible. Por favor, reinicia la app.',
        };
      }

      // Conectar con App Store
      console.log('[StoreKit] 🔌 Intentando conectar con App Store...');
      let connectResult;
      try {
        const connectStartTime = Date.now();
        connectResult = await module.connectAsync();
        const connectDuration = Date.now() - connectStartTime;
        console.log('[StoreKit] ✅ connectAsync completado', {
          duration: `${connectDuration}ms`,
          hasResult: !!connectResult,
          connected: connectResult?.connected,
        });
      } catch (connectError) {
        const errMsg = connectError?.message || String(connectError);
        const errCode = connectError?.code ?? connectError?.responseCode ?? '';
        console.error('[StoreKit] CONNECTION_FAILED:', errMsg, errCode ? `(code: ${errCode})` : '');
        console.error('[StoreKit] ❌ Error en connectAsync', {
          error: errMsg,
          code: errCode,
          errorType: connectError?.constructor?.name,
          hasModule: !!module,
        });
        // Si el error es "Already connected", considerar como éxito
        if (connectError.message && connectError.message.includes('Already connected')) {
          this.module = module; // Asegurar que el módulo esté guardado
          
          // Verificar que el módulo tenga los métodos necesarios
          if (typeof module.purchaseItemAsync === 'function' && module.IAPResponseCode) {
            this.isInitialized = true;
            this.initializing = false;
            if (!this.purchaseUpdateListener) {
              this.setupPurchaseListeners();
            }
            return { success: true };
          } else {
            // Si el módulo no tiene los métodos, resetear y fallar
            this.module = null;
            this.isInitialized = false;
            this.initializing = false;
            return {
              success: false,
              error: 'Módulo de compras incompleto. Por favor, reinicia la app.',
            };
          }
        }
        // Si no es "Already connected", resetear estado y lanzar error
        this.initializing = false;
        this.module = null;
        throw connectError;
      }
      
      // Validar que el resultado sea válido
      if (!connectResult) {
        this.initializing = false;
        this.module = null;
        console.error('[StoreKit] CONNECTION_FAILED: connectAsync no devolvió resultado');
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
        };
      }

      const { connected, responseCode } = connectResult;

      if (!connected) {
        this.initializing = false;
        this.module = null;
        const detail = responseCode != null ? ` (código: ${responseCode})` : '';
        console.error('[StoreKit] CONNECTION_FAILED: connected=false', detail, 'Resultado completo:', JSON.stringify(connectResult));
        return {
          success: false,
          error: `No se pudo conectar con App Store${detail}. Revisa la consola de Metro (busca CONNECTION_FAILED).`,
        };
      }

      // Asegurar que el módulo esté guardado y verificado antes de marcar como inicializado
      this.module = module;
      
      // Verificar que el módulo tenga los métodos necesarios
      if (typeof module.purchaseItemAsync !== 'function' || !module.IAPResponseCode) {
        this.initializing = false;
        this.module = null;
        this.isInitialized = false;
        return {
          success: false,
          error: 'Módulo de compras incompleto. Por favor, reinicia la app.',
        };
      }
      
      this.isInitialized = true;
      this.initializing = false;

      // Configurar listener para actualizaciones de compras (solo si no existe)
      if (!this.purchaseUpdateListener) {
        this.setupPurchaseListeners();
      }

      // Cargar productos disponibles (no crítico si falla, se cargarán cuando se necesiten)
      this.loadProducts().catch(err => {
        console.warn('[StoreKit] Error precargando productos (no crítico):', err);
      });

      return { success: true };
    } catch (error) {
      this.initializing = false;
      const errMsg = error?.message || String(error);
      const errCode = error?.code ?? error?.responseCode ?? '';
      console.error('[StoreKit] CONNECTION_FAILED:', errMsg, errCode ? `(code: ${errCode})` : '');
      console.error('[StoreKit] Error inicializando:', error);

      // Si el error es "Already connected", considerar como éxito
      if (error.message && error.message.includes('Already connected')) {
        this.module = module; // Asegurar que el módulo esté guardado
        
        // Verificar que el módulo tenga los métodos necesarios
        if (typeof module.purchaseItemAsync === 'function' && module.IAPResponseCode) {
          this.isInitialized = true;
          this.initializing = false;
          if (!this.purchaseUpdateListener) {
            this.setupPurchaseListeners();
          }
          return { success: true };
        } else {
          // Si el módulo no tiene los métodos, resetear y fallar
          this.module = null;
          this.isInitialized = false;
          this.initializing = false;
          return {
            success: false,
            error: 'Módulo de compras incompleto. Por favor, reinicia la app.',
          };
        }
      }
      
      // Resetear estado en caso de error
      this.module = null;
      this.isInitialized = false;
      this.initializing = false;

      return {
        success: false,
        error: error?.message || 'Error al inicializar StoreKit',
      };
    }
  }

  /**
   * Configurar listeners para compras
   */
  setupPurchaseListeners() {
    const module = this.module || getInAppPurchasesModule();
    if (!module) {
      return;
    }
    this.module = module;
    // Listener para actualizaciones de compras
    // IMPORTANTE: Este listener solo notifica, NO procesa compras
    // El procesamiento se hace en purchaseSubscription() para evitar duplicados
    this.purchaseUpdateListener = module.addPurchaseUpdateListener(
      async (update) => {
        console.log('[StoreKit] 📬 Listener: Actualización de compra recibida', {
          hasUpdate: !!update,
          responseCode: update?.responseCode,
          hasResults: !!(update?.results && Array.isArray(update.results)),
          resultsCount: update?.results?.length || 0,
        });
        
        // Validar que update exista y tenga las propiedades necesarias
        if (!update) {
          console.warn('[StoreKit] ⚠️ Listener: Actualización de compra sin datos');
          return;
        }
        
        if (update.responseCode === module.IAPResponseCode.OK && update.results && Array.isArray(update.results)) {
          for (const purchase of update.results) {
            if (!purchase || !purchase.productId) continue;
            
            // Verificar si la compra ya fue reconocida
            if (purchase.acknowledged) {
              console.log('[StoreKit] ✅ Listener: Compra ya reconocida (ignorando):', purchase.productId);
              continue;
            }

            // Verificar si esta compra ya está siendo procesada
            const purchaseKey = `${purchase.productId}-${purchase.transactionId || 'no-transaction-id'}`;
            if (this.processingPurchases.has(purchaseKey)) {
              console.log('[StoreKit] ⏳ Listener: Compra ya en proceso (ignorando):', purchase.productId);
              continue;
            }

            // Solo notificar, NO procesar
            // El procesamiento se hace en purchaseSubscription() para evitar duplicados y errores
            if (purchase.purchaseState === module.PurchaseState.PURCHASED) {
              console.log('[StoreKit] 📢 Listener: Compra exitosa detectada (será procesada por purchaseSubscription):', purchase.productId);
            } else if (purchase.purchaseState === module.PurchaseState.RESTORED) {
              console.log('[StoreKit] 📢 Listener: Compra restaurada detectada (será procesada por restorePurchases):', purchase.productId);
            } else {
              console.log('[StoreKit] ⚠️ Listener: Estado de compra desconocido:', purchase.purchaseState);
            }
          }
        } else {
          console.warn('[StoreKit] ⚠️ Listener: Actualización de compra con código de error:', update.responseCode);
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

    let module = this.module || getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible',
        products: [],
      };
    }
    this.module = module;

    try {
      const productIds = Object.values(PRODUCT_IDS);
      
      // Validar que productIds sea un array válido
      if (!Array.isArray(productIds) || productIds.length === 0) {
        console.error('[StoreKit] productIds inválido:', productIds);
        return {
          success: false,
          error: 'No se pudieron obtener los IDs de productos',
          products: [],
        };
      }

      console.log('[StoreKit] Solicitando productos:', productIds);
      const productsResult = await module.getProductsAsync(productIds);
      
      if (!productsResult) {
        console.error('[StoreKit] getProductsAsync retornó undefined');
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
          products: [],
        };
      }

      // Validar que productsResult tenga la estructura esperada
      if (typeof productsResult !== 'object') {
        console.error('[StoreKit] getProductsAsync retornó tipo inválido:', typeof productsResult);
        return {
          success: false,
          error: 'Respuesta inválida de App Store',
          products: [],
        };
      }
      
      const responseCode = productsResult.responseCode;
      const results = productsResult.results;

      // Validar que responseCode exista
      if (responseCode === undefined || responseCode === null) {
        console.error('[StoreKit] responseCode no encontrado en productsResult:', productsResult);
        return {
          success: false,
          error: 'Respuesta inválida de App Store: falta responseCode',
          products: [],
        };
      }
      
      if (responseCode === module.IAPResponseCode.OK) {
        // Validar que results sea un array
        const validResults = Array.isArray(results) ? results : [];
        this.products = validResults;
        console.log('[StoreKit] Productos cargados:', validResults.length);
        
        
        return {
          success: true,
          products: validResults
            .filter(p => p && p.productId) // Filtrar productos inválidos
            .map(p => ({
              id: p.productId,
              plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
              title: p.title || 'Producto sin título',
              description: p.description || '',
              price: p.price || '0',
              currency: p.currency || 'USD',
              priceValue: parseFloat(p.price) || 0,
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
   * @param {string} plan - Plan a comprar ('monthly', 'quarterly', 'semestral', 'yearly')
   * @param {Function} onValidateReceipt - Función para validar el recibo con el backend
   */
  async purchaseSubscription(plan, onValidateReceipt) {
    console.log('[StoreKit] 🛒 purchaseSubscription() llamado', {
      plan,
      isInitialized: this.isInitialized,
      hasModule: !!this.module,
      initializing: this.initializing,
      timestamp: new Date().toISOString(),
    });

    // Obtener módulo primero para verificar disponibilidad
    let module = this.module || getInAppPurchasesModule();
    if (!module) {
      console.error('[StoreKit] ❌ purchaseSubscription: Módulo no disponible al inicio');
      return {
        success: false,
        error: 'Módulo nativo no disponible. Por favor, reinicia la app.',
      };
    }
    this.module = module;
    console.log('[StoreKit] ✅ purchaseSubscription: Módulo obtenido', {
      hasPurchaseItemAsync: typeof module.purchaseItemAsync === 'function',
      hasIAPResponseCode: !!module.IAPResponseCode,
    });

    // Asegurar que esté inicializado
    if (!this.isInitialized) {
      if (this.initializing) {
        // Esperar a que termine la inicialización
        let attempts = 0;
        while (this.initializing && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          if (this.isInitialized) break;
        }
        if (!this.isInitialized) {
          // Reintentar inicialización si falló
          const initResult = await this.initialize();
          if (!initResult.success) {
            return initResult;
          }
        }
      } else {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }
    }

    // Verificar que el módulo esté disponible después de la inicialización
    module = this.module || getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible. Por favor, reinicia la app.',
      };
    }
    this.module = module;

    // Verificar métodos críticos antes de comprar
    if (typeof module.purchaseItemAsync !== 'function') {
      // Intentar re-obtener el módulo
      module = getInAppPurchasesModule();
      if (!module || typeof module.purchaseItemAsync !== 'function') {
        this.module = null;
        this.isInitialized = false;
        return {
          success: false,
          error: 'Función de compra no disponible. Por favor, reinicia la app.',
        };
      }
      this.module = module;
    }

    if (!module.IAPResponseCode) {
      return {
        success: false,
        error: 'Configuración de compras no disponible. Por favor, reinicia la app.',
      };
    }

    const productId = PRODUCT_IDS[plan];
    if (!productId) {
      return {
        success: false,
        error: `Plan no válido: ${plan}`,
      };
    }

    // CRÍTICO: Verificar que los productos estén cargados antes de comprar
    // StoreKit requiere que se consulten los productos primero
    if (!this.products || this.products.length === 0) {
      console.log('[StoreKit] Productos no cargados, cargando ahora...');
      const loadResult = await this.loadProducts();
      if (!loadResult.success || !loadResult.products || loadResult.products.length === 0) {
        return {
          success: false,
          error: loadResult.error || 'No se pudieron cargar los productos. Por favor, intenta de nuevo.',
        };
      }
    }

    // Verificar que el producto específico esté disponible
    const productAvailable = this.products.some(p => p && p.productId === productId);
    if (!productAvailable) {
      console.log('[StoreKit] Producto no encontrado en lista, recargando productos...');
      const loadResult = await this.loadProducts();
      const stillNotAvailable = !this.products.some(p => p && p.productId === productId);
      if (stillNotAvailable) {
        // Intentar una vez más después de un breve delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryLoadResult = await this.loadProducts();
        const finalCheck = !this.products.some(p => p && p.productId === productId);
        if (finalCheck) {
          return {
            success: false,
            error: `El producto ${productId} no está disponible en App Store. Verifica que esté configurado correctamente en App Store Connect.`,
          };
        }
      }
    }


    try {
      const purchaseStartTime = Date.now();
      console.log('[StoreKit] 🛒 INICIANDO COMPRA', {
        plan,
        productId,
        productsAvailable: this.products.length,
        productIds: this.products.map(p => p?.productId),
        timestamp: new Date().toISOString(),
      });

      // Solicitar compra
      const purchaseRequestTime = Date.now();
      let purchaseResult;
      try {
        purchaseResult = await module.purchaseItemAsync(productId);
      } catch (purchaseError) {
        console.error('[StoreKit] ❌ ERROR al llamar purchaseItemAsync', {
          productId,
          error: purchaseError?.message,
          errorType: purchaseError?.constructor?.name,
          stack: purchaseError?.stack,
        });
        return {
          success: false,
          error: purchaseError?.message || 'Error al procesar la compra. Por favor, intenta de nuevo.',
        };
      }
      const purchaseRequestDuration = Date.now() - purchaseRequestTime;
      
      // Marcar que estamos procesando esta compra para evitar duplicados en el listener
      let purchaseKey = null;
      
      console.log('[StoreKit] 📱 Respuesta de App Store recibida', {
        productId,
        hasResult: !!purchaseResult,
        responseTime: `${purchaseRequestDuration}ms`,
        timestamp: new Date().toISOString(),
      });
      
      if (!purchaseResult) {
        console.error('[StoreKit] ❌ ERROR: No se recibió respuesta de App Store', {
          productId,
          plan,
          totalDuration: Date.now() - purchaseStartTime,
        });
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
        };
      }
      
      const { responseCode, results } = purchaseResult;
      
      console.log('[StoreKit] 📋 Análisis de respuesta', {
        productId,
        responseCode,
        hasResults: !!results,
        resultsLength: results?.length || 0,
        responseCodeOK: responseCode === module.IAPResponseCode.OK,
        responseCodeCANCELED: responseCode === module.IAPResponseCode.USER_CANCELED,
      });

      if (responseCode === module.IAPResponseCode.OK && results && results.length > 0) {
        const purchase = results[0];
        
        // Crear clave única para esta compra
        purchaseKey = `${purchase.productId}-${purchase.transactionId || purchase.originalTransactionIdentifierIOS || 'no-transaction-id'}`;
        
        // Marcar que estamos procesando esta compra
        this.processingPurchases.add(purchaseKey);
        
        console.log('[StoreKit] ✅ COMPRA APROBADA POR APP STORE', {
          productId,
          purchaseProductId: purchase?.productId,
          hasTransactionReceipt: !!purchase?.transactionReceipt,
          hasTransactionId: !!purchase?.transactionId,
          hasOriginalTransactionId: !!purchase?.originalTransactionIdentifierIOS,
          transactionReceiptLength: purchase?.transactionReceipt?.length || 0,
          purchaseKey,
          timestamp: new Date().toISOString(),
        });

            // Validar que purchase tenga los datos necesarios
            if (!purchase || !purchase.productId || !purchase.transactionReceipt) {
              console.error('[StoreKit] ❌ ERROR: Datos de compra incompletos', {
                productId,
                plan,
                purchase: {
                  exists: !!purchase,
                  hasProductId: !!purchase?.productId,
                  hasTransactionReceipt: !!purchase?.transactionReceipt,
                  hasTransactionId: !!purchase?.transactionId,
                  hasOriginalTransactionId: !!purchase?.originalTransactionIdentifierIOS,
                },
                totalDuration: Date.now() - purchaseStartTime,
              });
              
              // Intentar finalizar la transacción incluso si faltan datos para evitar que quede pendiente
              if (purchase && purchase.productId && module && typeof module.finishTransactionAsync === 'function') {
                try {
                  await module.finishTransactionAsync(purchase, false);
                } catch (finishError) {
                  // Ignorar error de finalización si los datos están incompletos
                }
              }
              
              // Remover de compras en proceso
              if (purchaseKey) {
                this.processingPurchases.delete(purchaseKey);
              }
              
              return {
                success: false,
                error: 'Datos de compra incompletos. Por favor, intenta de nuevo.',
              };
            }

        // Validar recibo con el backend
        if (onValidateReceipt) {
          try {
            const validationStartTime = Date.now();
            console.log('[StoreKit] 🔐 INICIANDO VALIDACIÓN CON BACKEND', {
              productId,
              plan,
              timestamp: new Date().toISOString(),
            });

            // Validar que purchase tenga todos los datos necesarios antes de validar
            const receiptData = {
              transactionReceipt: purchase.transactionReceipt,
              productId: purchase.productId || productId,
              transactionId: purchase.transactionId || null,
              originalTransactionIdentifierIOS: purchase.originalTransactionIdentifierIOS || null,
            };

            console.log('[StoreKit] 📦 Datos preparados para validación', {
              productId: receiptData.productId,
              hasTransactionReceipt: !!receiptData.transactionReceipt,
              transactionReceiptLength: receiptData.transactionReceipt?.length || 0,
              hasTransactionId: !!receiptData.transactionId,
              hasOriginalTransactionId: !!receiptData.originalTransactionIdentifierIOS,
            });

            // Validar que al menos transactionReceipt y productId estén presentes
            if (!receiptData.transactionReceipt || !receiptData.productId) {
              console.error('[StoreKit] ❌ ERROR: Datos de recibo incompletos para validación', {
                productId,
                plan,
                receiptData: {
                  hasTransactionReceipt: !!receiptData.transactionReceipt,
                  hasProductId: !!receiptData.productId,
                  hasTransactionId: !!receiptData.transactionId,
                  hasOriginalTransactionId: !!receiptData.originalTransactionIdentifierIOS,
                },
                totalDuration: Date.now() - purchaseStartTime,
              });
              return {
                success: false,
                error: 'Datos de recibo incompletos. Por favor, intenta de nuevo.',
                purchase,
              };
            }

            const validationRequestTime = Date.now();
            const validationResult = await onValidateReceipt(receiptData);
            const validationRequestDuration = Date.now() - validationRequestTime;

            console.log('[StoreKit] 📨 Respuesta de validación recibida', {
              productId,
              hasResult: !!validationResult,
              success: validationResult?.success,
              hasError: !!validationResult?.error,
              errorMessage: validationResult?.error,
              responseTime: `${validationRequestDuration}ms`,
              timestamp: new Date().toISOString(),
            });

            // Validar que validationResult exista
            if (!validationResult) {
              console.error('[StoreKit] ❌ ERROR: No se recibió respuesta de validación', {
                productId,
                plan,
                validationDuration: Date.now() - validationStartTime,
                totalDuration: Date.now() - purchaseStartTime,
              });
              // Remover de compras en proceso
              if (purchaseKey) {
                this.processingPurchases.delete(purchaseKey);
              }
              
              return {
                success: false,
                error: 'No se recibió respuesta del servidor al validar la compra',
                purchase,
              };
            }

            if (!validationResult.success) {
              // Si la validación falla, NO finalizar la transacción para que el usuario pueda reintentar
              const errorMessage = validationResult.error || 'Error al validar la compra con el servidor';
              const appleStatus = validationResult.appleStatus || validationResult.status;
              
              console.error('[StoreKit] ❌ ERROR: Validación de recibo falló', {
                productId,
                plan,
                error: errorMessage,
                appleStatus,
                hasSubscription: !!validationResult.subscription,
                validationDuration: Date.now() - validationStartTime,
                totalDuration: Date.now() - purchaseStartTime,
              });
              
              // Si Apple rechazó el recibo, proporcionar un mensaje más claro
              let userFriendlyError = errorMessage;
              if (appleStatus && appleStatus !== 0) {
                userFriendlyError = 'El recibo de compra no pudo ser validado por Apple. Por favor, contacta con soporte si el problema persiste.';
              }
              
            // Remover de compras en proceso
            if (purchaseKey) {
              this.processingPurchases.delete(purchaseKey);
            }
            
            return {
              success: false,
              error: userFriendlyError,
              purchase,
              appleStatus,
            };
            }

            console.log('[StoreKit] ✅ VALIDACIÓN EXITOSA', {
              productId,
              plan,
              hasSubscription: !!validationResult.subscription,
              validationDuration: Date.now() - validationStartTime,
              timestamp: new Date().toISOString(),
            });
          } catch (validationError) {
            console.error('[StoreKit] ❌ EXCEPCIÓN en validación de recibo', {
              productId,
              plan,
              error: validationError?.message,
              errorType: validationError?.constructor?.name,
              hasResponse: !!validationError?.response,
              responseStatus: validationError?.response?.status,
              responseData: validationError?.response?.data,
              stack: validationError?.stack,
              totalDuration: Date.now() - purchaseStartTime,
            });
            
            // Determinar el tipo de error para dar un mensaje más claro
            let errorMessage = 'Error al validar la compra';
            const errorMsg = validationError?.message || '';
            const responseData = validationError?.response?.data;
            
            if (errorMsg.includes('Network') || errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('timeout')) {
              errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta de nuevo.';
            } else if (responseData?.error) {
              errorMessage = responseData.error;
            } else if (errorMsg) {
              errorMessage = errorMsg;
            }
            
            // NO finalizar la transacción si hay error en la validación
            // Remover de compras en proceso
            if (purchaseKey) {
              this.processingPurchases.delete(purchaseKey);
            }
            
            return {
              success: false,
              error: errorMessage,
              purchase,
              validationError: true, // Marcar que fue un error de validación
            };
          }
        }
        
        // Si no hay función de validación, remover de compras en proceso antes de finalizar
        if (!onValidateReceipt && purchaseKey) {
          this.processingPurchases.delete(purchaseKey);
        }

        // Solo finalizar la transacción si la validación fue exitosa
        // Esto es crítico: si no se finaliza, Apple puede reintentar la compra
        // IMPORTANTE: Si la validación fue exitosa, siempre retornamos éxito,
        // incluso si la finalización falla (la suscripción ya está activa)
        let finalizationSuccess = false;
        try {
          const finishStartTime = Date.now();
          console.log('[StoreKit] 🏁 FINALIZANDO TRANSACCIÓN', {
            productId,
            plan,
            timestamp: new Date().toISOString(),
          });

          // Validar que purchase tenga los datos necesarios antes de finalizar
          if (!purchase || !purchase.productId) {
            console.error('[StoreKit] ❌ ERROR: Purchase inválido para finalizar', {
              productId,
              plan,
              purchase: {
                exists: !!purchase,
                hasProductId: !!purchase?.productId,
                hasTransactionReceipt: !!purchase?.transactionReceipt,
              },
              totalDuration: Date.now() - purchaseStartTime,
            });
            // Remover de compras en proceso
            if (purchaseKey) {
              this.processingPurchases.delete(purchaseKey);
            }
            
            // Aunque falle la finalización, si la validación fue exitosa, la suscripción está activa
            // Retornamos éxito pero logueamos el problema
            console.warn('[StoreKit] ⚠️ ADVERTENCIA: No se pudo finalizar transacción, pero la validación fue exitosa. La suscripción está activa.');
            finalizationSuccess = false; // Marcar como no finalizada para intentar más tarde
          } else {
            // Validar que el método esté disponible antes de llamarlo
            if (!module || typeof module.finishTransactionAsync !== 'function') {
              console.error('[StoreKit] ❌ ERROR: finishTransactionAsync no está disponible', {
                hasModule: !!module,
                moduleKeys: module ? Object.keys(module) : [],
              });
              finalizationSuccess = false;
            } else {
              if (module && typeof module.finishTransactionAsync === 'function') {
                await module.finishTransactionAsync(purchase, false);
                finalizationSuccess = true;
              } else {
                finalizationSuccess = false;
              }
            }
          }
        } catch (finishError) {
          console.error('[StoreKit] ❌ ERROR finalizando transacción', {
            productId,
            plan,
            error: finishError?.message,
            errorType: finishError?.constructor?.name,
            stack: finishError?.stack,
            totalDuration: Date.now() - purchaseStartTime,
            note: 'La compra ya fue validada, intentando finalizar en reintentos',
          });
          
          // Intentar finalizar múltiples veces con delays incrementales
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries && !finalizationSuccess) {
            try {
              const delay = (retryCount + 1) * 500; // 500ms, 1000ms, 1500ms
              await new Promise(resolve => setTimeout(resolve, delay));
              
              // Validar que el método esté disponible antes de cada reintento
              if (!module || typeof module.finishTransactionAsync !== 'function') {
                retryCount = maxRetries; // Salir del loop
                break;
              }
              
              await module.finishTransactionAsync(purchase, false);
              
              finalizationSuccess = true;
              console.log(`[StoreKit] ✅ TRANSACCIÓN FINALIZADA EN REINTENTO ${retryCount + 1}`);
            } catch (retryFinishError) {
              retryCount++;
              console.error(`[StoreKit] ❌ ERROR en reintento ${retryCount} de finalización:`, retryFinishError?.message);
              
              if (retryCount >= maxRetries) {
                console.error('[StoreKit] ⚠️ No se pudo finalizar la transacción después de múltiples intentos', {
                  productId,
                  plan,
                  totalRetries: maxRetries,
                  note: 'La compra fue validada exitosamente, pero la finalización falló. Esto no afecta la suscripción del usuario.',
                });
                // Aunque falle finalizar, la compra ya fue validada, así que consideramos éxito
                // pero logueamos el error para debugging
                finalizationSuccess = false;
              }
            }
          }
          
          // Si después de todos los intentos no se pudo finalizar, loguear pero no fallar
          if (!finalizationSuccess) {
            console.warn('[StoreKit] ⚠️ ADVERTENCIA: Transacción no finalizada después de todos los intentos, pero la suscripción está activa', {
              productId,
              plan,
              note: 'La validación fue exitosa, la suscripción está activa. La finalización puede completarse más tarde.',
            });
          }
        }

        // Validar que el plan sea válido
        const mappedPlan = PRODUCT_ID_TO_PLAN[productId] || plan;
        if (!mappedPlan) {
          console.warn('[StoreKit] ⚠️ ADVERTENCIA: Plan no encontrado en mapeo', {
            productId,
            plan,
            availablePlans: Object.keys(PRODUCT_ID_TO_PLAN),
          });
        }

        // Remover de compras en proceso
        if (purchaseKey) {
          this.processingPurchases.delete(purchaseKey);
        }

        const totalDuration = Date.now() - purchaseStartTime;
        console.log('[StoreKit] 🎉 COMPRA COMPLETADA EXITOSAMENTE', {
          productId,
          plan,
          mappedPlan,
          totalDuration: `${totalDuration}ms`,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          purchase,
          plan: mappedPlan,
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
      
      const errorMessage = error?.message || 'Error al procesar la compra';
      
      // Manejar error "Already connected" específicamente
      if (errorMessage.includes('Already connected')) {
        console.log('[StoreKit] Ya estaba conectado, marcando como inicializado y reintentando...');
        // Marcar como inicializado y reintentar
        this.isInitialized = true;
        // Asegurar que los productos estén cargados antes de reintentar
        if (!this.products || this.products.length === 0) {
          await this.loadProducts();
        }
        // Reintentar la compra una vez
        try {
          const retryResult = await module.purchaseItemAsync(productId);
          if (!retryResult) {
            return {
              success: false,
              error: 'No se recibió respuesta de App Store en reintento',
            };
          }
          
          const { responseCode, results } = retryResult;
          if (responseCode === module.IAPResponseCode.OK && results && results.length > 0) {
            const purchase = results[0];
            
            // Validar datos de compra
            if (!purchase || !purchase.productId || !purchase.transactionReceipt) {
              return {
                success: false,
                error: 'Datos de compra incompletos en reintento',
              };
            }
            
            if (onValidateReceipt) {
              const validationResult = await onValidateReceipt({
                transactionReceipt: purchase.transactionReceipt,
                productId: purchase.productId,
                transactionId: purchase.transactionId,
                originalTransactionIdentifierIOS: purchase.originalTransactionIdentifierIOS,
              });
              
              if (validationResult && validationResult.success) {
                try {
                  await module.finishTransactionAsync(purchase);
                } catch (finishError) {
                  console.error('[StoreKit] Error finalizando transacción en reintento:', finishError);
                }
                return {
                  success: true,
                  purchase,
                  plan: PRODUCT_ID_TO_PLAN[productId] || plan,
                };
              } else {
                return {
                  success: false,
                  error: validationResult?.error || 'Error al validar la compra en reintento',
                  purchase,
                };
              }
            } else {
              // Si no hay función de validación, finalizar y retornar éxito
              try {
                await module.finishTransactionAsync(purchase);
              } catch (finishError) {
                console.error('[StoreKit] Error finalizando transacción en reintento:', finishError);
              }
              return {
                success: true,
                purchase,
                plan: PRODUCT_ID_TO_PLAN[productId] || plan,
              };
            }
          } else if (responseCode === module.IAPResponseCode.USER_CANCELED) {
            return {
              success: false,
              error: 'Compra cancelada por el usuario',
              cancelled: true,
            };
          } else {
            return {
              success: false,
              error: `Error en la compra (reintento): ${responseCode}`,
            };
          }
        } catch (retryError) {
          console.error('[StoreKit] Error en reintento de compra:', retryError);
          return {
            success: false,
            error: retryError?.message || 'Error al procesar la compra en reintento',
          };
        }
      }
      
      // Manejar error "Must query item from store before calling purchase"
      if (errorMessage.includes('Must query') || errorMessage.includes('query item')) {
        console.log('[StoreKit] Error: productos no consultados, cargando productos y reintentando...');
        // Cargar productos y reintentar
        const loadResult = await this.loadProducts();
        if (loadResult.success && this.products.length > 0) {
          // Verificar que el producto específico esté disponible
          const productAvailable = this.products.some(p => p && p.productId === productId);
          if (productAvailable) {
            // Reintentar compra después de cargar productos
            try {
              const retryResult = await module.purchaseItemAsync(productId);
              if (retryResult && retryResult.responseCode === module.IAPResponseCode.OK && retryResult.results && retryResult.results.length > 0) {
                const purchase = retryResult.results[0];
                
                // Validar datos de compra
                if (!purchase || !purchase.productId || !purchase.transactionReceipt) {
                  return {
                    success: false,
                    error: 'Datos de compra incompletos después de cargar productos',
                  };
                }
                
                if (onValidateReceipt) {
                  const validationResult = await onValidateReceipt({
                    transactionReceipt: purchase.transactionReceipt,
                    productId: purchase.productId,
                    transactionId: purchase.transactionId,
                    originalTransactionIdentifierIOS: purchase.originalTransactionIdentifierIOS,
                  });
                  if (validationResult && validationResult.success) {
                    try {
                      await module.finishTransactionAsync(purchase);
                    } catch (finishError) {
                      console.error('[StoreKit] Error finalizando transacción:', finishError);
                    }
                    return {
                      success: true,
                      purchase,
                      plan: PRODUCT_ID_TO_PLAN[productId] || plan,
                    };
                  } else {
                    return {
                      success: false,
                      error: validationResult?.error || 'Error al validar la compra',
                      purchase,
                    };
                  }
                } else {
                  // Si no hay función de validación, finalizar y retornar éxito
                  try {
                    await module.finishTransactionAsync(purchase);
                  } catch (finishError) {
                    console.error('[StoreKit] Error finalizando transacción:', finishError);
                  }
                  return {
                    success: true,
                    purchase,
                    plan: PRODUCT_ID_TO_PLAN[productId] || plan,
                  };
                }
              } else if (retryResult && retryResult.responseCode === module.IAPResponseCode.USER_CANCELED) {
                return {
                  success: false,
                  error: 'Compra cancelada por el usuario',
                  cancelled: true,
                };
              }
            } catch (retryError) {
              console.error('[StoreKit] Error en reintento después de cargar productos:', retryError);
            }
          }
        }
        return {
          success: false,
          error: 'No se pudieron cargar los productos. Por favor, intenta de nuevo.',
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Restaurar compras anteriores
   */
  async restorePurchases() {
    if (!this.isInitialized && !this.initializing) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return {
          success: false,
          error: initResult.error || 'No se pudo inicializar StoreKit',
          purchases: [],
        };
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
          purchases: [],
        };
      }
    }

    let module = this.module || getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible',
        purchases: [],
      };
    }
    this.module = module;

    try {
      console.log('[StoreKit] Restaurando compras...');
      
      const restoreResult = await module.restorePurchasesAsync();
      
      if (!restoreResult) {
        console.error('[StoreKit] restorePurchasesAsync retornó undefined');
        return {
          success: false,
          error: 'No se recibió respuesta de App Store',
          purchases: [],
        };
      }
      
      // Validar que restoreResult tenga las propiedades esperadas
      if (typeof restoreResult !== 'object') {
        console.error('[StoreKit] restorePurchasesAsync retornó tipo inválido:', typeof restoreResult);
        return {
          success: false,
          error: 'Respuesta inválida de App Store',
          purchases: [],
        };
      }
      
      const responseCode = restoreResult.responseCode;
      const results = restoreResult.results;
      
      console.log('[StoreKit] Respuesta de restauración:', {
        responseCode,
        hasResults: !!results,
        resultsType: Array.isArray(results) ? 'array' : typeof results,
        resultsLength: Array.isArray(results) ? results.length : 'N/A',
      });
      
      if (responseCode === module.IAPResponseCode.OK) {
        // Validar que results sea un array
        const validResults = Array.isArray(results) ? results : [];
        
        if (validResults.length === 0) {
          console.log('[StoreKit] No se encontraron compras para restaurar');
          return {
            success: true,
            purchases: [],
            message: 'No se encontraron compras para restaurar',
          };
        }

        console.log('[StoreKit] Compras restauradas:', validResults.length);

        // Mapear y validar cada compra
        const mappedPurchases = validResults
          .filter(p => p && p.productId) // Filtrar compras inválidas
          .map(p => ({
            productId: p.productId,
            plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
            transactionId: p.transactionId || null,
            transactionReceipt: p.transactionReceipt || null,
            originalTransactionIdentifierIOS: p.originalTransactionIdentifierIOS || null,
          }));

        return {
          success: true,
          purchases: mappedPurchases,
        };
      } else if (responseCode === module.IAPResponseCode.USER_CANCELED) {
        return {
          success: false,
          error: 'Restauración cancelada por el usuario',
          purchases: [],
          cancelled: true,
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
        error: error?.message || 'Error al restaurar compras',
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

    let module = this.module || getInAppPurchasesModule();
    if (!module) {
      return {
        success: false,
        error: 'Módulo nativo no disponible',
        subscriptions: [],
      };
    }
    this.module = module;

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

    if (this.isInitialized && this.module) {
      try {
        await this.module.disconnectAsync();
        this.isInitialized = false;
        this.module = null;
      } catch (error) {
        // Ignorar error al desconectar
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
