# 🔒 Seguridad de Pagos y Suscripciones

Documentación del sistema de seguridad implementado para garantizar la integridad de pagos y verificaciones de suscripción.

---

## 🛡️ Sistema de Seguridad Implementado

### 1. Verificación de Suscripción Robusta

#### Middleware `requireActiveSubscription`

**Ubicación:** `backend/middleware/checkSubscription.js`

**Características de seguridad:**
- ✅ Validación estricta de `userId` (formato ObjectId)
- ✅ Verificación doble: modelo `Subscription` y modelo `User`
- ✅ Actualización automática de status cuando el trial expira
- ✅ Logging completo de todas las verificaciones
- ✅ Prevención de acceso sin autenticación
- ✅ Validación de integridad de datos

**Eventos auditados:**
- `SUBSCRIPTION_CHECK_ALLOWED` - Acceso permitido
- `SUBSCRIPTION_CHECK_DENIED` - Acceso denegado
- `SUBSCRIPTION_CHECK_FAILED` - Error en verificación
- `TRIAL_EXPIRED` - Trial expirado

---

### 2. Sistema de Auditoría de Pagos

#### Servicio `paymentAuditService`

**Ubicación:** `backend/services/paymentAuditService.js`

**Funcionalidades:**
- ✅ Registro de todos los eventos relacionados con pagos
- ✅ Verificación de integridad de transacciones
- ✅ Detección de pagos completados sin suscripción activa
- ✅ Verificación de acceso de usuarios

**Métodos principales:**
- `logEvent()` - Registrar eventos de auditoría
- `verifyTransactionIntegrity()` - Verificar integridad de transacciones
- `findUnactivatedPayments()` - Encontrar pagos no activados
- `verifyUserAccess()` - Verificar acceso de usuario

---

### 3. Sistema de Recuperación de Pagos

#### Servicio `paymentRecoveryService`

**Ubicación:** `backend/services/paymentRecoveryService.js`

**Funcionalidades:**
- ✅ Detección automática de pagos completados sin activación
- ✅ Activación manual de suscripciones desde transacciones
- ✅ Procesamiento en lote de pagos no activados

**Endpoints:**
- `GET /api/payments/recovery/unactivated` - Listar pagos no activados
- `POST /api/payments/recovery/activate/:transactionId` - Activar suscripción manualmente
- `POST /api/payments/recovery/process-all` - Procesar todos los pagos no activados

---

### 4. Seguridad en Creación de Checkout

**Validaciones implementadas:**
- ✅ Verificación de que el usuario existe
- ✅ Validación de formato de `userId` (ObjectId)
- ✅ Validación de plan válido
- ✅ Validación de precio válido
- ✅ Registro completo de información del usuario en la transacción

**Información registrada en cada transacción:**
```javascript
{
  userId: ObjectId,
  userEmail: string,
  userName: string,
  plan: string,
  amount: number,
  preapprovalPlanId: string,
  createdAt: Date,
}
```

---

### 5. Seguridad en Activación de Suscripciones

**Validaciones implementadas:**
- ✅ Verificación de que la transacción existe
- ✅ Validación de que el usuario existe
- ✅ Validación de que el plan es válido
- ✅ Cálculo correcto de fechas según el plan
- ✅ Actualización sincronizada de `Subscription` y `User`
- ✅ Registro completo de la activación

**Información registrada:**
- ID de transacción
- ID de suscripción
- Email y nombre del usuario
- Plan y fechas del período
- Timestamp de activación

---

### 6. Seguridad en Webhooks

**Validaciones implementadas:**
- ✅ Manejo de múltiples formatos de notificación
- ✅ Búsqueda robusta de transacciones (por múltiples IDs)
- ✅ Validación de email del payer vs usuario
- ✅ Registro completo de todas las notificaciones
- ✅ Manejo de errores con logging detallado

**Tipos de notificaciones manejadas:**
- `payment` - Notificaciones de pagos
- `subscription` - Notificaciones de suscripciones
- `preapproval` - Notificaciones de preapproval (suscripciones recurrentes)

---

## 📊 Flujo de Seguridad Completo

### Flujo de Checkout

1. **Usuario solicita checkout**
   - ✅ Validación de usuario autenticado
   - ✅ Validación de plan válido
   - ✅ Creación de transacción con información completa del usuario
   - ✅ Registro de evento `CHECKOUT_CREATED`

2. **Usuario completa pago en Mercado Pago**
   - ✅ Mercado Pago procesa el pago
   - ✅ Webhook enviado al backend

3. **Backend recibe webhook**
   - ✅ Registro de evento `WEBHOOK_RECEIVED`
   - ✅ Búsqueda de transacción por múltiples criterios
   - ✅ Validación de email del payer
   - ✅ Actualización de estado de transacción
   - ✅ Activación de suscripción si el pago fue aprobado

4. **Activación de suscripción**
   - ✅ Validación de transacción y usuario
   - ✅ Cálculo correcto de fechas
   - ✅ Actualización de `Subscription` y `User`
   - ✅ Registro de evento `SUBSCRIPTION_ACTIVATED`

---

### Flujo de Verificación de Acceso

1. **Usuario intenta acceder al chat**
   - ✅ Middleware `requireActiveSubscription` intercepta
   - ✅ Validación de `userId` (formato ObjectId)
   - ✅ Búsqueda en `Subscription` y `User`
   - ✅ Verificación de trial activo o suscripción premium
   - ✅ Actualización automática si el trial expiró
   - ✅ Registro de evento (`ALLOWED` o `DENIED`)

2. **Si el acceso es denegado**
   - ✅ Status actualizado si es necesario
   - ✅ Mensaje de error específico
   - ✅ Información de estado de suscripción

---

## 🔍 Detección y Recuperación

### Pagos No Activados

El sistema detecta automáticamente pagos que fueron completados pero no activaron suscripciones:

**Causas comunes:**
- Error en el webhook
- Error en la activación
- Problemas de red
- Errores de base de datos

**Solución:**
- Endpoint de recuperación manual
- Procesamiento en lote
- Verificación de integridad

---

## 📝 Logging y Auditoría

### Eventos Registrados

Todos los eventos críticos se registran con:
- Timestamp
- ID de usuario
- ID de transacción (si aplica)
- Información del evento
- IP y User-Agent (cuando está disponible)

**Tipos de eventos:**
- `CHECKOUT_CREATED` - Checkout iniciado
- `CHECKOUT_CREATION_FAILED` - Error creando checkout
- `WEBHOOK_RECEIVED` - Webhook recibido
- `PAYMENT_NOTIFICATION_RECEIVED` - Notificación de pago
- `PREAPPROVAL_NOTIFICATION_RECEIVED` - Notificación de preapproval
- `SUBSCRIPTION_ACTIVATED` - Suscripción activada
- `SUBSCRIPTION_ACTIVATION_FAILED` - Error activando suscripción
- `SUBSCRIPTION_CHECK_ALLOWED` - Verificación permitida
- `SUBSCRIPTION_CHECK_DENIED` - Verificación denegada
- `TRIAL_EXPIRED` - Trial expirado

---

## ✅ Validaciones de Seguridad

### Validaciones de Usuario

- ✅ `userId` debe ser un ObjectId válido
- ✅ Usuario debe existir en la base de datos
- ✅ Email del usuario debe coincidir con el payer (cuando está disponible)

### Validaciones de Transacción

- ✅ Transacción debe existir
- ✅ Transacción debe estar asociada a un usuario válido
- ✅ Estado de transacción debe ser válido
- ✅ Plan debe ser válido

### Validaciones de Suscripción

- ✅ Trial debe tener fechas válidas
- ✅ Suscripción premium debe tener fechas válidas
- ✅ Status debe ser válido según el estado actual

---

## 🚨 Manejo de Errores

### Errores Críticos

Todos los errores críticos se registran con:
- Mensaje de error
- Stack trace (limitado a 500 caracteres)
- Contexto del error
- ID de usuario y transacción

### Recuperación Automática

El sistema intenta recuperar automáticamente:
- Pagos completados sin activación
- Suscripciones con estados inconsistentes
- Trials expirados

---

## 🔐 Mejores Prácticas Implementadas

1. **Validación en múltiples capas**
   - Middleware de autenticación
   - Middleware de suscripción
   - Validaciones en servicios

2. **Logging completo**
   - Todos los eventos críticos se registran
   - Información suficiente para debugging
   - Sin información sensible en logs

3. **Transacciones atómicas**
   - Actualización de múltiples modelos en una operación
   - Rollback en caso de error

4. **Verificación de integridad**
   - Validación de datos antes de procesar
   - Verificación post-procesamiento
   - Detección de inconsistencias

5. **Recuperación proactiva**
   - Detección de problemas
   - Soluciones automáticas cuando es posible
   - Herramientas manuales para casos complejos

---

## 📚 Referencias

- `backend/middleware/checkSubscription.js` - Middleware de verificación
- `backend/services/paymentAuditService.js` - Servicio de auditoría
- `backend/services/paymentRecoveryService.js` - Servicio de recuperación
- `backend/services/paymentServiceMercadoPago.js` - Servicio de pagos
- `backend/routes/paymentRecoveryRoutes.js` - Rutas de recuperación

---

**Última actualización:** 2025-01-XX  
**Autor:** AntoApp Team

