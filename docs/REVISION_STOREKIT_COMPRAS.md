# Revisión: StoreKit y compras in-app

Revisión del flujo de compras con StoreKit (iOS) y su integración con el backend.

---

## Resumen del flujo

1. **Frontend (iOS)**  
   - `useSubscriptionScreen` → si `storeKitService.isAvailable()`, inicializa StoreKit, carga productos y llama `paymentService.purchaseWithStoreKit(plan.id)`.
   - `paymentService.purchaseWithStoreKit(plan)` crea `validateReceipt(receiptData)` y llama `storeKitService.purchaseSubscription(plan, validateReceipt)`.
   - **storeKitService**: `connectAsync` → `purchaseItemAsync(productId)` → recibe compra → llama `onValidateReceipt(receiptData)` → si OK, `finishTransactionAsync(purchase)` y retorna éxito.

2. **Validación del recibo**  
   - `validateReceipt` en `paymentService` hace `api.post(ENDPOINTS.PAYMENT_VALIDATE_RECEIPT, payload)` con `receipt`, `productId`, `transactionId`, `originalTransactionIdentifierIOS`.
   - Backend: `POST /api/payments/validate-receipt` (auth + Joi) → `appleReceiptService.validateReceiptWithApple(receipt, isSandbox)` → si `status === 0`, `appleReceiptService.processSubscription(userId, receiptResponse, productId, transactionId)` → responde `{ success, subscription }` o error con `appleStatus`.

3. **Restaurar compras**  
   - `storeKitService.restorePurchases()` → `restorePurchasesAsync()` → frontend valida cada compra con `POST /validate-receipt` (con `restore: true`) y devuelve el resultado agregado.

---

## Puntos fuertes

- **Separación clara**: StoreKit solo en iOS; Android usa Mercado Pago. `paymentService` unifica la API (`purchaseWithStoreKit`, `restorePurchases`, `getPlans`, etc.).
- **Validación server-side**: Todo recibo se valida con Apple y luego se procesa en backend (User, Subscription, Transaction, auditoría). No se confía solo en el cliente.
- **Transacción**: Se llama `finishTransactionAsync` solo tras validación exitosa; si la validación falla, no se finaliza y el usuario puede reintentar.
- **Evitar duplicados**: `processingPurchases` (Set) y el listener que solo notifica (no procesa) evitan procesar dos veces la misma compra.
- **Reintentos**: StoreKit maneja “Already connected” y “Must query item…” con reintento de compra o de carga de productos.
- **Sandbox vs producción**: Backend usa `isSandbox = NODE_ENV !== 'production'`; si Apple devuelve 21007, se revalida con sandbox.
- **IDs de producto**: Un solo lugar en frontend (`storeKitService`: `PRODUCT_IDS`, `PRODUCT_ID_TO_PLAN`) y en backend (`appleReceiptService`: `PRODUCT_ID_TO_PLAN`), alineados (`com.anto.app.monthly`, etc.).

---

## Mejoras aplicadas

- **Respuesta de validación**: En `paymentService.validateReceipt` ahora se devuelve `appleStatus` (y en el `catch` desde `error.response.data`). Así `storeKitService` puede mostrar el mensaje específico cuando Apple rechaza el recibo (p. ej. “El recibo de compra no pudo ser validado por Apple…”).

---

## Recomendaciones

### Backend

- **Variable de entorno**: `APPLE_SHARED_SECRET` es obligatoria para validar recibos; debe estar definida en producción y en entorno de pruebas (sandbox).
- **POST /validate-receipt**: Ya usa `paymentLimiter`, `authenticateToken`, `validateUserObjectId` y Joi; está bien protegido.
- **Producción**: En producción, si se usan recibos de sandbox (pruebas), Apple devolverá 21007 y el backend revalida con sandbox; el flujo está contemplado.

### Frontend

- **storeKitService.js**: Archivo muy largo (~930 líneas). Opcional: extraer constantes (`PRODUCT_IDS`, `PRODUCT_ID_TO_PLAN`) y/o helpers (`getInAppPurchasesModule`, lógica de reintentos) a módulos separados para facilitar pruebas y mantenimiento.
- **Expo / módulo nativo**: StoreKit depende de `expo-in-app-purchases`; no está disponible en Expo Go. Hace falta build nativo o prebuild para probar compras reales.
- **Restaurar compras**: Tras `restorePurchases`, se validan todas las compras con el backend y `useSubscriptionScreen` llama `loadData()`; el estado de suscripción se actualiza. Si en algún momento se muestra un botón “Restaurar compras”, conviene deshabilitarlo o mostrar loading mientras se valida.

### Pruebas

- **storeKitService:** Tests con mocks de `Platform` y `expo-in-app-purchases`: `isAvailable()` (Android → false; iOS con módulo no disponible → false), `getProductId` / `getPlanFromProductId` (mapeo de planes e IDs), `getProducts()` (array vacío sin productos cargados).
- **paymentService.validateReceipt / purchaseWithStoreKit:** Tests con mock de `storeKitService.purchaseSubscription` que invoca el callback de validación: éxito cuando el backend responde `success: true`; respuesta con `appleStatus` cuando el backend rechaza el recibo o cuando la petición lanza con `response.data.appleStatus`; retorno de error cuando StoreKit no está disponible.

---

## Contratos

| Origen        | Destino     | Contrato |
|---------------|------------|----------|
| storeKitService | paymentService | `purchaseSubscription(plan, onValidateReceipt)` con `onValidateReceipt(receiptData) => Promise<{ success, error?, subscription?, appleStatus? }>` |
| paymentService | Backend    | `POST /api/payments/validate-receipt` con body `{ receipt, productId, transactionId?, originalTransactionIdentifierIOS?, restore? }` |
| Backend       | Apple      | `verifyReceipt` con `receipt-data`, `password` (shared secret), `exclude-old-transactions` |

---

## Conclusión

El flujo de StoreKit y compras está bien estructurado: validación en backend, transacción finalizada solo tras éxito y manejo de errores y reintentos. Con la inclusión de `appleStatus` en la respuesta de validación, el usuario recibe mensajes más claros cuando Apple rechaza un recibo. **Añadidos tests** para `storeKitService` (isAvailable, getProductId, getPlanFromProductId, getProducts) y para `paymentService.purchaseWithStoreKit` / validación de recibo (éxito, rechazo con appleStatus, error con response.data.appleStatus). Para seguir mejorando: documentar en el README o en un doc de despliegue la necesidad de `APPLE_SHARED_SECRET` y, si se quiere, refactorizar `storeKitService` en módulos más pequeños.
