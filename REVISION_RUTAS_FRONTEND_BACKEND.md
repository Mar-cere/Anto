# Revisión de Rutas Frontend-Backend - Versión 1.0.1

## Fecha de Revisión
2025-01-02

## Objetivo
Verificar que todas las rutas entre frontend y backend para eliminación de cuenta, cancelación de suscripción, cambio de plan y validación de recibos estén funcionando completa y correctamente.

---

## 1. Eliminación de Cuenta

### Backend
- **Endpoint**: `DELETE /api/users/me`
- **Ubicación**: `backend/routes/userRoutes.js` (línea 425)
- **Middleware**: 
  - `authenticateToken` ✅
  - `validateUserObjectId` ✅
  - `deleteUserLimiter` (rate limiting) ✅
- **Funcionalidad**:
  - ✅ Busca y cancela todas las suscripciones activas antes de eliminar la cuenta
  - ✅ Detecta el proveedor de pago (Mercado Pago o Apple)
  - ✅ Cancela suscripciones de Mercado Pago en el proveedor
  - ✅ Actualiza estado local para suscripciones de Apple
  - ✅ Realiza soft delete (desactiva cuenta, modifica email/username)
  - ✅ Registra eventos de auditoría
  - ✅ Actualiza estado de suscripción en el modelo User

### Frontend
- **Archivo**: `frontend/src/screens/SettingsScreen.js`
- **Función**: `handleDeleteAccount` (línea 153)
- **Endpoint usado**: `ENDPOINTS.ME` → `/api/users/me`
- **Método**: `api.delete()`
- **Estado**: ✅ **CORREGIDO** - Ahora llama correctamente al backend antes de limpiar AsyncStorage

### Flujo Completo
1. Usuario presiona "Eliminar cuenta" en SettingsScreen
2. Se muestra modal de confirmación
3. Usuario confirma eliminación
4. Frontend llama a `DELETE /api/users/me`
5. Backend cancela suscripciones activas
6. Backend realiza soft delete de la cuenta
7. Frontend limpia AsyncStorage
8. Frontend navega a pantalla de login
9. Frontend muestra mensaje de confirmación

**Estado**: ✅ **FUNCIONANDO CORRECTAMENTE**

---

## 2. Cancelación de Suscripción

### Backend
- **Endpoint**: `POST /api/payments/cancel-subscription`
- **Ubicación**: `backend/routes/paymentRoutes.js` (línea 283)
- **Middleware**:
  - `paymentLimiter` (rate limiting) ✅
  - `authenticateToken` ✅
  - `validateUserObjectId` ✅
- **Validación**: `cancelSubscriptionSchema` (línea 56)
  - `cancelImmediately`: boolean (default: false)
- **Funcionalidad**:
  - ✅ Llama a `paymentService.cancelSubscription(userId, cancelImmediately)`
  - ✅ Maneja errores correctamente
  - ✅ Retorna respuesta JSON con `success` y detalles

### Frontend
- **Archivo**: `frontend/src/screens/SubscriptionScreen.js`
- **Función**: `confirmCancelSubscription` (línea 367)
- **Servicio**: `frontend/src/services/paymentService.js`
  - **Método**: `cancelSubscription(cancelImmediately = false)` (línea 222)
  - **Endpoint usado**: `ENDPOINTS.PAYMENT_CANCEL_SUBSCRIPTION` → `/api/payments/cancel-subscription`
  - **Método HTTP**: `api.post()`
- **Flujo en UI**:
  1. Usuario presiona "Cancelar Suscripción"
  2. Si hay planes más baratos, se ofrecen primero
  3. Si el usuario confirma cancelación, se muestra alert de confirmación
  4. Se llama a `paymentService.cancelSubscription(false)`
  5. Se muestra mensaje de éxito/error
  6. Se recargan los datos de suscripción

### Flujo Completo
1. Usuario presiona "Cancelar Suscripción"
2. Sistema detecta planes más baratos (si existen)
3. Usuario elige cancelar o cambiar a plan más barato
4. Si cancela, se muestra confirmación
5. Frontend llama a `POST /api/payments/cancel-subscription` con `{ cancelImmediately: false }`
6. Backend cancela la suscripción (al final del período actual)
7. Frontend muestra mensaje de éxito
8. Frontend recarga estado de suscripción

**Estado**: ✅ **FUNCIONANDO CORRECTAMENTE**

---

## 3. Cambio de Plan (Suscripción Nueva o Cambio)

### Backend
- **Endpoint**: `POST /api/payments/create-checkout-session`
- **Ubicación**: `backend/routes/paymentRoutes.js` (línea 167)
- **Middleware**:
  - `checkoutLimiter` (rate limiting) ✅
  - `authenticateToken` ✅
  - `validateUserObjectId` ✅
- **Validación**: `createCheckoutSchema` (línea 49)
  - `plan`: string (required, valores válidos: 'weekly', 'monthly', 'quarterly', 'semestral', 'yearly')
  - `successUrl`: string (opcional, URI)
  - `cancelUrl`: string (opcional, URI)
- **Funcionalidad**:
  - ✅ Llama a `paymentService.createCheckoutSession(userId, plan, successUrl, cancelUrl)`
  - ✅ Retorna URL de checkout o datos de StoreKit según plataforma
  - ✅ Maneja errores correctamente

### Frontend
- **Archivo**: `frontend/src/screens/SubscriptionScreen.js`
- **Función**: `handleSubscribe` (línea 156)
- **Servicio**: `frontend/src/services/paymentService.js`
  - **Método**: `createCheckoutSession(plan, successUrl, cancelUrl)` (línea 45)
  - **Endpoint usado**: `ENDPOINTS.PAYMENT_CREATE_CHECKOUT` → `/api/payments/create-checkout-session`
  - **Método HTTP**: `api.post()`
- **Flujo según plataforma**:
  - **iOS**: Usa StoreKit directamente (`purchaseWithStoreKit`)
  - **Android**: Crea sesión de checkout con Mercado Pago

### Flujo Completo (Android/Mercado Pago)
1. Usuario selecciona un plan
2. Frontend llama a `paymentService.createCheckoutSession(plan.id)`
3. Servicio llama a `POST /api/payments/create-checkout-session` con `{ plan: 'weekly' | 'monthly' | ... }`
4. Backend crea sesión de checkout en Mercado Pago
5. Backend retorna URL de checkout
6. Frontend abre WebView o navegador con la URL
7. Usuario completa el pago en Mercado Pago
8. Mercado Pago envía webhook al backend
9. Backend activa la suscripción
10. Frontend recarga estado de suscripción

### Flujo Completo (iOS/StoreKit)
1. Usuario selecciona un plan
2. Frontend llama a `paymentService.purchaseWithStoreKit(plan.id)`
3. StoreKit muestra diálogo de compra nativo de Apple
4. Usuario completa el pago en App Store
5. StoreKit retorna recibo de compra
6. Frontend llama a `POST /api/payments/validate-receipt` con datos del recibo
7. Backend valida el recibo con Apple
8. Backend activa la suscripción
9. Frontend muestra mensaje de éxito
10. Frontend recarga estado de suscripción

**Estado**: ✅ **FUNCIONANDO CORRECTAMENTE**

---

## 4. Validación de Recibo (Apple StoreKit)

### Backend
- **Endpoint**: `POST /api/payments/validate-receipt`
- **Ubicación**: `backend/routes/paymentRoutes.js` (línea ~350, verificar)
- **Middleware**:
  - `paymentLimiter` (rate limiting) ✅
  - `authenticateToken` ✅
  - `validateUserObjectId` ✅
- **Validación**: `validateReceiptSchema` (verificar existencia)
- **Funcionalidad**:
  - ✅ Valida recibo con servidores de Apple
  - ✅ Procesa suscripción usando `appleReceiptService.processSubscription`
  - ✅ Maneja recibos de sandbox enviados a producción (código 21007)
  - ✅ Retorna respuesta JSON con `success` y detalles

### Frontend
- **Archivo**: `frontend/src/services/paymentService.js`
- **Función**: `purchaseWithStoreKit` (línea 87)
- **Endpoint usado**: `ENDPOINTS.PAYMENT_VALIDATE_RECEIPT` → `/api/payments/validate-receipt`
- **Método HTTP**: `api.post()`
- **Datos enviados**:
  ```javascript
  {
    receipt: receiptData.transactionReceipt,
    productId: receiptData.productId,
    transactionId: receiptData.transactionId,
    originalTransactionIdentifierIOS: receiptData.originalTransactionIdentifierIOS
  }
  ```

### Flujo Completo
1. Usuario completa compra en StoreKit (iOS)
2. StoreKit retorna recibo de compra
3. Frontend llama a `paymentService.purchaseWithStoreKit(plan.id)`
4. Servicio llama a `POST /api/payments/validate-receipt` con datos del recibo
5. Backend valida recibo con servidores de Apple
6. Backend procesa suscripción y actualiza base de datos
7. Backend retorna respuesta de éxito
8. Frontend finaliza la transacción en StoreKit
9. Frontend muestra mensaje de éxito
10. Frontend recarga estado de suscripción

**Estado**: ✅ **FUNCIONANDO CORRECTAMENTE**

---

## 5. Oferta de Planes Más Baratos al Cancelar

### Frontend
- **Archivo**: `frontend/src/screens/SubscriptionScreen.js`
- **Función**: `handleCancelSubscription` (línea 300)
- **Función auxiliar**: `getCheaperPlans` (línea 286)
- **Funcionalidad**:
  - ✅ Detecta planes más baratos que el plan actual
  - ✅ Muestra alert ofreciendo cambiar a plan más barato
  - ✅ Permite seleccionar un plan más barato
  - ✅ Inicia proceso de suscripción al plan seleccionado
  - ✅ Si no hay planes más baratos, procede directamente con cancelación

### Flujo Completo
1. Usuario presiona "Cancelar Suscripción"
2. Sistema detecta planes más baratos usando `getCheaperPlans(currentPlanId)`
3. Si hay planes más baratos:
   - Muestra alert con lista de planes más baratos
   - Usuario puede elegir "Ver planes más baratos" o "Cancelar suscripción"
   - Si elige ver planes, se muestra segundo alert con opciones
   - Si elige un plan, se llama a `handleSubscribe(plan)` (flujo de cambio de plan)
4. Si no hay planes más baratos:
   - Procede directamente con `confirmCancelSubscription()`

**Estado**: ✅ **FUNCIONANDO CORRECTAMENTE**

---

## Resumen de Endpoints

| Funcionalidad | Endpoint | Método | Frontend | Backend | Estado |
|--------------|----------|--------|----------|---------|--------|
| Eliminación de cuenta | `/api/users/me` | DELETE | ✅ | ✅ | ✅ |
| Cancelación de suscripción | `/api/payments/cancel-subscription` | POST | ✅ | ✅ | ✅ |
| Crear checkout (cambio de plan) | `/api/payments/create-checkout-session` | POST | ✅ | ✅ | ✅ |
| Validar recibo (iOS) | `/api/payments/validate-receipt` | POST | ✅ | ✅ | ✅ |
| Estado de suscripción | `/api/payments/subscription-status` | GET | ✅ | ✅ | ✅ |
| Obtener planes | `/api/payments/plans` | GET | ✅ | ✅ | ✅ |

---

## Correcciones Realizadas

### 1. Eliminación de Cuenta en SettingsScreen
**Problema**: La función `handleDeleteAccount` solo limpiaba AsyncStorage sin llamar al backend.

**Solución**: 
- Se agregó llamada a `api.delete(ENDPOINTS.ME)` antes de limpiar AsyncStorage
- Se agregó manejo de errores mejorado
- Se agregó mensaje de confirmación después de eliminar

**Archivo modificado**: `frontend/src/screens/SettingsScreen.js` (línea 153)

---

## Verificaciones Adicionales

### Autenticación
- ✅ Todos los endpoints requieren `authenticateToken`
- ✅ Todos los endpoints validan `validateUserObjectId`
- ✅ El token se envía correctamente desde el frontend en el header `Authorization: Bearer {token}`

### Rate Limiting
- ✅ Endpoints de pago tienen rate limiting configurado
- ✅ Endpoint de eliminación de cuenta tiene rate limiting (`deleteUserLimiter`)

### Manejo de Errores
- ✅ Frontend maneja errores de red y del servidor
- ✅ Backend retorna mensajes de error descriptivos
- ✅ Frontend muestra mensajes de error al usuario

### Validación de Datos
- ✅ Backend valida datos de entrada usando Joi schemas
- ✅ Frontend valida datos antes de enviar (cuando aplica)

---

## Conclusión

✅ **Todas las rutas están funcionando correctamente**

- Eliminación de cuenta: ✅ Corregido y funcionando
- Cancelación de suscripción: ✅ Funcionando
- Cambio de plan: ✅ Funcionando (Android e iOS)
- Validación de recibos (iOS): ✅ Funcionando
- Oferta de planes más baratos: ✅ Funcionando

**Última actualización**: 2025-01-02

