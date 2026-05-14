/**
 * Servicio de StoreKit (In-App Purchase)
 * 
 * Gestiona las compras in-app usando StoreKit de Apple
 * Solo funciona en iOS
 * 
 * @author AntoApp Team
 */

import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

// Importar expo-in-app-purchases de forma condicional
let InAppPurchases = null;
let moduleChecked = false;

/** API mínima que debe exponer expo-in-app-purchases para considerar el módulo utilizable */
function isIapModuleUsable(m) {
  if (!m || typeof m !== 'object') {
    return false;
  }
  return (
    typeof m.connectAsync === 'function' &&
    typeof m.getProductsAsync === 'function' &&
    typeof m.purchaseItemAsync === 'function' &&
    typeof m.setPurchaseListener === 'function' &&
    m.IAPResponseCode != null &&
    typeof m.IAPResponseCode === 'object'
  );
}

function resolveIapExport(raw) {
  if (raw == null) {
    return null;
  }
  // Si la raíz del paquete ya expone la API completa, usarla siempre: así `setPurchaseListener`
  // y `connectAsync` comparten el mismo EventEmitter interno del módulo (evita avisos de
  // «no listeners» cuando Metro resuelve un `default` parcial distinto del namespace raíz).
  if (
    typeof raw === 'object' &&
    typeof raw.connectAsync === 'function' &&
    typeof raw.setPurchaseListener === 'function' &&
    raw.IAPResponseCode != null &&
    typeof raw.IAPResponseCode === 'object'
  ) {
    return raw;
  }
  const candidates = [];
  if (typeof raw === 'object') {
    candidates.push(raw);
    if (raw.default != null) {
      candidates.push(raw.default);
    }
  }
  /** Metro/CJS puede exponer API en `default` o en la raíz; priorizar el que incluye setPurchaseListener. */
  const usable = candidates.filter(
    (c) => c != null && typeof c === 'object' && typeof c.connectAsync === 'function',
  );
  if (usable.length === 0) {
    return null;
  }
  const withListener = usable.find((c) => typeof c.setPurchaseListener === 'function');
  return withListener || usable[0];
}

/**
 * Comprueba si el nativo ExpoInAppPurchases está registrado **sin** ejecutar
 * `require('expo-in-app-purchases')`: ese require puede lanzar "Cannot find native module"
 * y en algunos runtimes el error se muestra como fatal aunque exista try/catch arriba.
 */
function isExpoInAppPurchasesNativeRegistered() {
  if (Platform.OS !== 'ios') {
    return false;
  }
  try {
    const core = require('expo-modules-core');
    if (typeof core.requireOptionalNativeModule === 'function') {
      const native = core.requireOptionalNativeModule('ExpoInAppPurchases');
      if (native != null) {
        return true;
      }
    }
  } catch {
    /* expo-modules-core no disponible en este entorno */
  }
  try {
    if (TurboModuleRegistry && typeof TurboModuleRegistry.get === 'function') {
      const tm = TurboModuleRegistry.get('ExpoInAppPurchases');
      if (tm != null) {
        return true;
      }
    }
    if (NativeModules?.ExpoInAppPurchases != null) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

// Función helper para obtener el módulo de forma segura
function getInAppPurchasesModule() {
  // Si ya verificamos y no está disponible, retornar null
  if (moduleChecked && !InAppPurchases) {
    if (__DEV__) {
      console.log('[StoreKit] getInAppPurchasesModule: módulo no disponible (cache)');
    }
    return null;
  }

  // Si ya está cargado y es válido, retornarlo
  if (InAppPurchases && isIapModuleUsable(InAppPurchases)) {
    return InAppPurchases;
  }

  // Intentar cargar el módulo dinámicamente
  try {
    if (!isExpoInAppPurchasesNativeRegistered()) {
      moduleChecked = true;
      InAppPurchases = null;
      if (__DEV__ && process.env.NODE_ENV !== 'test') {
        console.warn(
          '[StoreKit] IAP nativo no enlazado (no uses Expo Go). Genera un development build: npx expo run:ios o eas build --profile development',
        );
      }
      return null;
    }

    if (__DEV__ && process.env.NODE_ENV !== 'test') {
      console.log('[StoreKit] getInAppPurchasesModule: cargando expo-in-app-purchases…');
    }
    const raw = require('expo-in-app-purchases');
    const resolved = resolveIapExport(raw);

    if (!isIapModuleUsable(resolved)) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          '[StoreKit] expo-in-app-purchases: el JS existe pero la API no es utilizable (suele indicar que el nativo ExpoInAppPurchases no está en el binario). ' +
            'Expo Go no incluye compras in-app. Genera un binario nativo: npx expo run:ios, eas build, o instala desde TestFlight.',
          resolved ? Object.keys(resolved) : 'sin export válido',
        );
      }
      moduleChecked = true;
      InAppPurchases = null;
      return null;
    }

    InAppPurchases = resolved;
    moduleChecked = true;

    if (__DEV__) {
      console.log('[StoreKit] módulo IAP listo');
    }

    return InAppPurchases;
  } catch (error) {
    const msg = error?.message || String(error || '');
    const looksLikeMissingNpm =
      /cannot find module|unable to resolve module|does not exist in the haste module map/i.test(
        msg,
      );
    // Expo Go / build sin código nativo IAP: el JS existe pero el nativo no está enlazado
    const looksLikeNativeMissing =
      /native module|TurboModule|ExpoGo|not supported|ExpoInAppPurchases|cannot find native module/i.test(
        msg,
      );
    const looksLikeJestVirtualMock = /expo-in-app-purchases not available/i.test(msg);

    if (looksLikeMissingNpm) {
      console.error(
        '[StoreKit] Falta el paquete npm. Instala con: npx expo install expo-in-app-purchases',
        msg,
      );
    } else if (process.env.NODE_ENV !== 'test' || !looksLikeJestVirtualMock) {
      // Esperado en Expo Go o hasta recompilar tras añadir el módulo
      console.warn('[StoreKit] IAP no disponible en este entorno (rebuild nativo o dev client):', msg);
    }
    if (__DEV__ && !looksLikeMissingNpm && !looksLikeNativeMissing && !looksLikeJestVirtualMock) {
      console.warn('[StoreKit] Detalle:', error?.stack);
    }
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

/** Expo lanza esto cuando ya hay sesión IAP; no es un error para el usuario */
function isAlreadyConnectedError(err) {
  const msg = (err?.message || String(err || '')).toLowerCase();
  return msg.includes('already connected');
}

/**
 * expo-in-app-purchases (iOS) arma el historial con `restoreCompletedTransactions` y recorre
 * `SKPaymentQueue.transactions`; pueden repetirse filas o acumularse si hay varias restauraciones
 * en paralelo. Dedupe por id de transacción de Apple (orderId nativo).
 */
function dedupePurchaseHistoryRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return rows;
  }
  const byKey = new Map();
  for (const p of rows) {
    if (!p || !p.productId) continue;
    const tidRaw =
      p.orderId != null
        ? String(p.orderId)
        : p.transactionId != null
          ? String(p.transactionId)
          : p.transactionIdentifier != null
            ? String(p.transactionIdentifier)
            : '';
    const pt =
      typeof p.purchaseTime === 'number' && !Number.isNaN(p.purchaseTime)
        ? p.purchaseTime
        : Number(p.purchaseTime) || 0;
    const key = tidRaw || `${String(p.productId)}:${pt}`;
    const prev = byKey.get(key);
    if (!prev || pt >= (prev.purchaseTime || 0)) {
      byKey.set(key, { ...p, purchaseTime: pt });
    }
  }
  return Array.from(byKey.values());
}

class StoreKitService {
  constructor() {
    this.isInitialized = false;
    this.products = [];
    this.purchaseUpdateListener = null;
    this.initializing = false; // Flag para evitar múltiples inicializaciones simultáneas
    this.processingPurchases = new Set(); // Set para rastrear compras en proceso
    this.module = null; // Guardar referencia al módulo después de inicializar
    this.purchaseInProgress = false; // Mutex para evitar compras concurrentes
    this.productsLoadingPromise = null; // Mutex para evitar getProductsAsync concurrente
    /** Espera de respuesta IAP enlazada al listener (expo-in-app-purchases). */
    this._purchaseUpdateWaiter = null;
    /** Una sola restauración / historial a la vez (evita duplicar filas en la cola). */
    this._restoreInFlight = null;
    /** Último estado de registro del listener (solo para cleanup / diagnóstico). */
    this._iapPurchaseListenerBound = false;
  }

  /**
   * Verificar si StoreKit está disponible (solo iOS y módulo nativo disponible)
   */
  isAvailable() {
    if (Platform.OS !== 'ios') {
      return false;
    }
    try {
      return getInAppPurchasesModule() != null;
    } catch {
      return false;
    }
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
      hasSetPurchaseListener: typeof module.setPurchaseListener === 'function',
    });

    // Si ya está inicializado, NO asumir conexión viva: iOS puede cortar la conexión.
    // Dejamos que el flujo continúe para re-validar y (si hace falta) re-conectar.

    // Si ya se está inicializando, esperar a que termine
    if (this.initializing) {
      // Esperar hasta que termine la inicialización
      let attempts = 0;
      while (this.initializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (this.isInitialized && this.module && typeof this.module.purchaseItemAsync === 'function') {
          // Otra llamada completó init; tras Fast Reload el paquete IAP puede haber perdido el listener.
          this.setupPurchaseListeners();
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
    // No registrar setPurchaseListener antes de connectAsync: expo hace remove()+addListener()
    // en cada setPurchaseListener; si el nativo emite Expo.purchasesUpdated entre medias, RN
    // muestra "no listeners registered" y se pueden perder eventos.

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
        // Si el error es "Already connected", considerar como éxito (no spamear como ERROR)
        if (isAlreadyConnectedError(connectError)) {
          console.log('[StoreKit] connectAsync: ya conectado a App Store (esperado)', {
            code: errCode || undefined,
          });
          this.module = module; // Asegurar que el módulo esté guardado
          
          // Verificar que el módulo tenga los métodos necesarios
          if (typeof module.purchaseItemAsync === 'function' && module.IAPResponseCode) {
            this.isInitialized = true;
            this.initializing = false;
            this.setupPurchaseListeners();
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
        console.error('[StoreKit] CONNECTION_FAILED:', errMsg, errCode ? `(code: ${errCode})` : '');
        console.error('[StoreKit] ❌ Error en connectAsync', {
          error: errMsg,
          code: errCode,
          errorType: connectError?.constructor?.name,
          hasModule: !!module,
        });
        // Si no es "Already connected", resetear estado y lanzar error
        this.initializing = false;
        this.module = null;
        throw connectError;
      }
      
      // Validar que el resultado sea válido (en iOS connectAsync a veces no devuelve objeto)
      if (connectResult == null || connectResult.connected === undefined) {
        // Tratar como éxito: conexión puede estar activa aunque no devolvió resultado
        console.log('[StoreKit] connectAsync sin resultado explícito, asumiendo conectado');
        connectResult = { connected: true };
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

      // setupPurchaseListeners ya se llamó antes de connectAsync; volver a registrar no duplica
      // callbacks útiles (expo reemplaza la suscripción interna) y recupera tras Fast Refresh.
      this.setupPurchaseListeners();

      // Cargar productos disponibles (no crítico si falla, se cargarán cuando se necesiten)
      this.loadProducts().catch(err => {
        console.warn('[StoreKit] Error precargando productos (no crítico):', err);
      });

      return { success: true };
    } catch (error) {
      this.initializing = false;
      const errMsg = error?.message || String(error);
      const errCode = error?.code ?? error?.responseCode ?? '';

      // Si el error es "Already connected", considerar como éxito (sin logs de error)
      if (isAlreadyConnectedError(error)) {
        console.log('[StoreKit] initialize: ya conectado a App Store (esperado)', {
          code: errCode || undefined,
        });
        this.module = module;

        if (typeof module.purchaseItemAsync === 'function' && module.IAPResponseCode) {
          this.isInitialized = true;
          this.initializing = false;
          this.setupPurchaseListeners();
          return { success: true };
        }
        this.module = null;
        this.isInitialized = false;
        this.initializing = false;
        return {
          success: false,
          error: 'Módulo de compras incompleto. Por favor, reinicia la app.',
        };
      }

      console.error('[StoreKit] CONNECTION_FAILED:', errMsg, errCode ? `(code: ${errCode})` : '');
      console.error('[StoreKit] Error inicializando:', error);

      // Resetear estado en caso de error
      this.module = null;
      this.isInitialized = false;
      this.initializing = false;

      return {
        success: false,
        error: error?.message || 'Error al inicializar StoreKit',
      };
    } finally {
      // Evitar que el singleton quede trabado en modo "initializing"
      if (this.initializing) {
        this.initializing = false;
      }
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
    // setPurchaseListener de expo hace remove()+add en cada llamada; no usamos early-return:
    // tras Fast Refresh el EventEmitter interno puede quedar sin suscriptores mientras el singleton
    // de esta clase sigue vivo — hay que volver a registrar siempre que se invoque setup.

    const setListener = module.setPurchaseListener || module.addPurchaseUpdateListener;
    if (typeof setListener !== 'function') {
      console.error(
        '[StoreKit] setupPurchaseListeners: setPurchaseListener no disponible en el módulo IAP (revisá resolveIapExport / duplicados de expo-in-app-purchases).',
        { keys: module ? Object.keys(module).slice(0, 30) : [] },
      );
      return;
    }
    // setPurchaseListener no devuelve la suscripción; el paquete reemplaza el listener interno en cada llamada.
    setListener(
      async (update) => {
        console.log('[StoreKit] 📬 Listener: Actualización de compra recibida', {
          hasUpdate: !!update,
          responseCode: update?.responseCode,
          hasResults: !!(update?.results && Array.isArray(update.results)),
          resultsCount: update?.results?.length || 0,
        });

        const waiter = this._purchaseUpdateWaiter;
        if (waiter) {
          const IAPResponseCode = module.IAPResponseCode;
          if (!update) {
            waiter.reject(new Error('Respuesta vacía de App Store'));
            return;
          }
          const { responseCode, results } = update;
          if (responseCode === IAPResponseCode.USER_CANCELED) {
            waiter.reject(Object.assign(new Error('CANCELLED'), { code: 'USER_CANCELED' }));
            return;
          }
          if (responseCode === IAPResponseCode.OK && Array.isArray(results) && results.length > 0) {
            const match = results.find((r) => r && r.productId === waiter.productId);
            if (match) {
              waiter.resolve(update);
              return;
            }
            if (results.length === 1) {
              waiter.resolve(update);
              return;
            }
            console.warn('[StoreKit] Listener OK sin coincidencia de productId', {
              expected: waiter.productId,
              got: results.map((r) => r?.productId),
            });
            waiter.reject(
              new Error(
                `App Store devolvió varios resultados y ninguno coincide con el producto esperado (${waiter.productId}). Volvé a intentar o usá «Restaurar compras».`,
              ),
            );
            return;
          }
          waiter.reject(
            new Error(`App Store rechazó la compra (código ${responseCode ?? 'desconocido'})`),
          );
          return;
        }

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
            const PurchaseState = module.InAppPurchaseState || module.PurchaseState || {};
            const PURCHASED = PurchaseState.PURCHASED ?? 1;
            const RESTORED = PurchaseState.RESTORED ?? 2;
            if (purchase.purchaseState === PURCHASED) {
              console.log('[StoreKit] 📢 Listener: Compra exitosa detectada (será procesada por purchaseSubscription):', purchase.productId);
            } else if (purchase.purchaseState === RESTORED) {
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
    this._iapPurchaseListenerBound = true;
    // Marcador para teardown: expo no expone remove; al desmontar la app basta con dejar de usar el singleton.
    this.purchaseUpdateListener = { remove: () => {} };
  }

  /**
   * Inicia purchaseItemAsync y espera la respuesta por setPurchaseListener.
   * expo-in-app-purchases suele resolver purchaseItemAsync en undefined; el resultado real llega al listener.
   */
  awaitPurchaseUpdateAfterRequest(module, productId) {
    if (this._purchaseUpdateWaiter) {
      return Promise.reject(
        new Error(
          'Hay una compra pendiente procesándose. Esperá unos segundos o usá «Restaurar compras».',
        ),
      );
    }
    return new Promise((resolve, reject) => {
      const TIMEOUT_MS = 90000;
      let timeoutId;

      const cleanupAndResolve = (update) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        this._purchaseUpdateWaiter = null;
        resolve(update);
      };
      const cleanupAndReject = (err) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        this._purchaseUpdateWaiter = null;
        reject(err);
      };

      // Debe ejecutarse antes del waiter y de purchaseItemAsync. Idempotente si initialize() ya enlazó.
      this.setupPurchaseListeners();

      timeoutId = setTimeout(() => {
        cleanupAndReject(
          new Error(
            'App Store no respondió en el tiempo esperado. Usá «Restaurar compras» si el cargo fue realizado.',
          ),
        );
      }, TIMEOUT_MS);

      this._purchaseUpdateWaiter = {
        productId,
        resolve: cleanupAndResolve,
        reject: cleanupAndReject,
      };

      try {
        const maybePromise = module.purchaseItemAsync(productId);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.catch((purchaseError) => {
            const msg = purchaseError?.message || '';
            if (msg.includes('Must wait for promise to resolve')) {
              cleanupAndReject(
                new Error(
                  'Hay una compra pendiente procesándose. Esperá unos segundos o usá «Restaurar compras».',
                ),
              );
              return;
            }
            cleanupAndReject(purchaseError);
          });
        }
      } catch (purchaseError) {
        const msg = purchaseError?.message || '';
        if (msg.includes('Must wait for promise to resolve')) {
          cleanupAndReject(
            new Error(
              'Hay una compra pendiente procesándose. Esperá unos segundos o usá «Restaurar compras».',
            ),
          );
          return;
        }
        cleanupAndReject(purchaseError);
      }
    });
  }

  /**
   * Cargar productos disponibles desde App Store
   */
  async loadProducts() {
    if (this.productsLoadingPromise) {
      return this.productsLoadingPromise;
    }

    this.productsLoadingPromise = (async () => {
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
    })();

    try {
      return await this.productsLoadingPromise;
    } finally {
      this.productsLoadingPromise = null;
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
    if (this.purchaseInProgress) {
      return {
        success: false,
        error: 'Ya hay una compra en curso. Espera unos segundos e intenta nuevamente.',
      };
    }
    // CRÍTICO: tomar el mutex antes de cualquier await para evitar race (doble tap)
    this.purchaseInProgress = true;
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

    // Asegurar listener antes de comprar (idempotente si initialize() ya enlazó).
    this.setupPurchaseListeners();

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

      // Solicitar compra: purchaseItemAsync puede resolver undefined; el resultado llega por setPurchaseListener.
      const purchaseRequestTime = Date.now();
      let purchaseResult;
      try {
        purchaseResult = await this.awaitPurchaseUpdateAfterRequest(module, productId);
      } catch (purchaseError) {
        const msg = purchaseError?.message || String(purchaseError || '');
        if (msg === 'CANCELLED') {
          return {
            success: false,
            cancelled: true,
            error: 'Compra cancelada por el usuario.',
          };
        }
        console.error('[StoreKit] ❌ Error esperando actualización de compra (listener)', {
          productId,
          error: msg,
          errorType: purchaseError?.constructor?.name,
          stack: purchaseError?.stack,
        });
        if (msg.includes('Must wait for promise to resolve')) {
          return {
            success: false,
            error:
              'La compra anterior todavía se está procesando. Espera unos segundos y vuelve a intentar.',
          };
        }
        return {
          success: false,
          error: msg || 'Error al procesar la compra. Por favor, intenta de nuevo.',
        };
      }
      const purchaseRequestDuration = Date.now() - purchaseRequestTime;

      // Marcar que estamos procesando esta compra para evitar duplicados en el listener
      let purchaseKey = null;

      console.log('[StoreKit] 📱 Respuesta de App Store recibida (listener)', {
        productId,
        hasResult: !!purchaseResult,
        responseTime: `${purchaseRequestDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      if (!purchaseResult) {
        console.warn('[StoreKit] Sin respuesta del listener tras purchaseItemAsync', {
          productId,
          plan,
          totalDuration: Date.now() - purchaseStartTime,
        });
        return {
          success: false,
          error:
            'App Store no devolvió confirmación de la compra. Espera unos segundos, usa «Restaurar compras» o revisa si ya tienes la suscripción activa.',
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
        // Reintentar la compra una vez (resultado vía listener, no del return de purchaseItemAsync)
        try {
          let retryResult;
          try {
            retryResult = await this.awaitPurchaseUpdateAfterRequest(module, productId);
          } catch (listenerErr) {
            if (listenerErr?.message === 'CANCELLED') {
              return {
                success: false,
                error: 'Compra cancelada por el usuario',
                cancelled: true,
              };
            }
            return {
              success: false,
              error: listenerErr?.message || 'Error al procesar la compra en reintento',
            };
          }
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
            // Reintentar compra después de cargar productos (resultado vía listener)
            try {
              let retryResult;
              try {
                retryResult = await this.awaitPurchaseUpdateAfterRequest(module, productId);
              } catch (listenerErr) {
                if (listenerErr?.message === 'CANCELLED') {
                  return {
                    success: false,
                    error: 'Compra cancelada por el usuario',
                    cancelled: true,
                  };
                }
                throw listenerErr;
              }
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
    } finally {
      this.purchaseInProgress = false;
      if (this._purchaseUpdateWaiter) {
        const w = this._purchaseUpdateWaiter;
        this._purchaseUpdateWaiter = null;
        try {
          w.reject(new Error('Operación de compra interrumpida.'));
        } catch {
          /* ignore */
        }
      }
    }
  }

  /**
   * Restaurar compras anteriores
   */
  async restorePurchases() {
    if (this._restoreInFlight) {
      if (__DEV__) {
        console.log('[StoreKit] restorePurchases: operación ya en curso, reutilizando la misma petición');
      }
      return this._restoreInFlight;
    }

    const run = async () => {
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
        let attempts = 0;
        while (this.initializing && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
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

        const historyResult = await module.getPurchaseHistoryAsync();

        if (!historyResult) {
          console.error('[StoreKit] getPurchaseHistoryAsync retornó undefined');
          return {
            success: false,
            error: 'No se recibió respuesta de App Store',
            purchases: [],
          };
        }

        if (typeof historyResult !== 'object') {
          console.error('[StoreKit] getPurchaseHistoryAsync retornó tipo inválido:', typeof historyResult);
          return {
            success: false,
            error: 'Respuesta inválida de App Store',
            purchases: [],
          };
        }

        const responseCode = historyResult.responseCode;
        const results = historyResult.results;

        const rawCount = Array.isArray(results) ? results.length : 0;

        console.log('[StoreKit] Respuesta historial compras:', {
          responseCode,
          hasResults: !!results,
          resultsType: Array.isArray(results) ? 'array' : typeof results,
          resultsLength: Array.isArray(results) ? results.length : 'N/A',
        });

        if (responseCode === module.IAPResponseCode.OK) {
          const validResults = Array.isArray(results) ? results : [];

          if (validResults.length === 0) {
            console.log('[StoreKit] No se encontraron compras para restaurar');
            return {
              success: true,
              purchases: [],
              message: 'No se encontraron compras para restaurar',
            };
          }

          const deduped = dedupePurchaseHistoryRows(validResults);
          if (deduped.length !== validResults.length && __DEV__) {
            console.log('[StoreKit] Historial deduplicado', {
              antes: validResults.length,
              despues: deduped.length,
            });
          }

          console.log('[StoreKit] Compras restauradas (historial):', deduped.length);

          const mappedPurchases = deduped
            .filter((p) => p && p.productId)
            .map((p) => ({
              productId: p.productId,
              plan: PRODUCT_ID_TO_PLAN[p.productId] || p.productId,
              transactionId: p.transactionId || p.orderId || null,
              transactionReceipt: p.transactionReceipt || null,
              originalTransactionIdentifierIOS:
                p.originalTransactionIdentifierIOS || p.originalOrderId || null,
              purchaseTime:
                typeof p.purchaseTime === 'number' && !Number.isNaN(p.purchaseTime)
                  ? p.purchaseTime
                  : Number(p.purchaseTime) || 0,
            }));

          return {
            success: true,
            purchases: mappedPurchases,
            _debugRawHistoryCount: __DEV__ ? rawCount : undefined,
          };
        }

        if (responseCode === module.IAPResponseCode.USER_CANCELED) {
          return {
            success: false,
            error: 'Restauración cancelada por el usuario',
            purchases: [],
            cancelled: true,
          };
        }

        return {
          success: false,
          error: `Error restaurando compras: ${responseCode}`,
          purchases: [],
        };
      } catch (error) {
        console.error('[StoreKit] Error restaurando compras:', error);
        return {
          success: false,
          error: error?.message || 'Error al restaurar compras',
          purchases: [],
        };
      }
    };

    this._restoreInFlight = run().finally(() => {
      this._restoreInFlight = null;
    });
    return this._restoreInFlight;
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
        const validResults = dedupePurchaseHistoryRows(Array.isArray(results) ? results : []);
        const activeSubscriptions = validResults.filter((p) => {
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
    if (this.purchaseUpdateListener && typeof this.purchaseUpdateListener.remove === 'function') {
      this.purchaseUpdateListener.remove();
    }
    this.purchaseUpdateListener = null;
    this.purchaseInProgress = false;
    this.processingPurchases = new Set();
    if (this._purchaseUpdateWaiter) {
      const w = this._purchaseUpdateWaiter;
      this._purchaseUpdateWaiter = null;
      try {
        w.reject(new Error('StoreKit desconectado.'));
      } catch {
        /* ignore */
      }
    }

    if (this.isInitialized && this.module) {
      try {
        await this.module.disconnectAsync();
        this.isInitialized = false;
        this.module = null;
        this._iapPurchaseListenerBound = false;
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
