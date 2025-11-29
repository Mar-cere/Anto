# Análisis del Sistema de Pagos - AntoApp

## 📋 Estado Actual

### ✅ Lo que ya existe:

1. **Modelo de Suscripción en User.js**
   - Campo `subscription` con:
     - `status`: 'free', 'trial', 'premium', 'expired'
     - `trialStartDate`, `trialEndDate`
     - `subscriptionStartDate`, `subscriptionEndDate`
     - `plan`: 'monthly', 'yearly'
   - Virtuals: `isInTrial`, `hasActiveSubscription`

2. **Endpoint de Consulta**
   - `GET /api/users/me/subscription` - Obtiene información de suscripción

3. **Trial Automático**
   - Al registrarse, se asigna trial de 21 días

### ❌ Lo que falta:

1. **Integración con Pasarela de Pago**
   - No hay integración con Stripe, PayPal u otra pasarela
   - No hay procesamiento de pagos

2. **Modelos de Datos**
   - No hay modelo para `Transaction` o `Payment`
   - No hay modelo para `Subscription` (solo está en User)
   - No hay historial de pagos

3. **Rutas de Pago**
   - No hay endpoints para crear suscripciones
   - No hay endpoints para procesar pagos
   - No hay endpoints para cancelar suscripciones
   - No hay endpoints para actualizar métodos de pago

4. **Webhooks**
   - No hay webhooks para eventos de pago
   - No hay sincronización con pasarela de pago

5. **Frontend**
   - No hay pantallas para gestionar suscripciones
   - No hay pantallas para seleccionar planes
   - No hay pantallas para gestionar métodos de pago
   - No hay indicadores de estado de suscripción

6. **Validación y Middleware**
   - No hay middleware para verificar suscripción activa
   - No hay validación de límites según plan

---

## 🎯 Propuesta de Implementación

### Opción 1: Mercado Pago (Seleccionada para Chile)

**Ventajas:**
- ✅ Popular en Latinoamérica
- ✅ Soporte para múltiples métodos locales
- ✅ Comisiones competitivas

**Desventajas:**
- ⚠️ Menos documentación en inglés
- ⚠️ Menos integración global

---

## 📐 Arquitectura Propuesta

### 1. Modelos de Base de Datos

#### Transaction Model
```javascript
{
  userId: ObjectId,
  type: 'subscription' | 'one-time',
  amount: Number,
  currency: String,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  paymentMethod: String,
  paymentProvider: 'stripe' | 'paypal',
  providerTransactionId: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### Subscription Model (Mejorado)
```javascript
{
  userId: ObjectId,
  status: 'active' | 'canceled' | 'past_due' | 'unpaid',
  plan: 'monthly' | 'yearly',
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  canceledAt: Date,
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  paymentMethodId: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Servicios Backend

#### paymentService.js
- `createCheckoutSession()` - Crear sesión de pago
- `createSubscription()` - Crear suscripción
- `cancelSubscription()` - Cancelar suscripción
- `updatePaymentMethod()` - Actualizar método de pago
- `getSubscriptionStatus()` - Obtener estado de suscripción
- `handleWebhook()` - Procesar webhooks de Stripe

#### subscriptionService.js
- `activateSubscription()` - Activar suscripción
- `deactivateSubscription()` - Desactivar suscripción
- `checkSubscriptionStatus()` - Verificar estado
- `getSubscriptionFeatures()` - Obtener características según plan

### 3. Rutas API

```
POST   /api/payments/create-checkout-session
POST   /api/payments/create-subscription
POST   /api/payments/cancel-subscription
POST   /api/payments/update-payment-method
GET    /api/payments/subscription-status
POST   /api/payments/webhook (Stripe)
GET    /api/payments/plans
GET    /api/payments/transactions
```

### 4. Middleware

#### checkSubscription.js
```javascript
// Verificar si el usuario tiene suscripción activa
// Restringir acceso a features premium
```

### 5. Frontend

#### Pantallas
- `SubscriptionScreen.js` - Ver planes y suscripción actual
- `PaymentMethodScreen.js` - Gestionar métodos de pago
- `TransactionHistoryScreen.js` - Historial de transacciones
- `UpgradeScreen.js` - Pantalla de upgrade

#### Componentes
- `PlanCard.js` - Tarjeta de plan
- `SubscriptionStatus.js` - Indicador de estado
- `PaymentForm.js` - Formulario de pago

---

## 💰 Planes Propuestos

### Plan Free
- ✅ Chat básico (limitado)
- ✅ Técnicas terapéuticas básicas
- ✅ Hábitos y tareas (limitados)
- ❌ Sin análisis avanzado
- ❌ Sin historial completo
- ❌ Sin exportación de datos

### Plan Premium Mensual ($9.99/mes)
- ✅ Chat ilimitado
- ✅ Todas las técnicas terapéuticas
- ✅ Análisis emocional avanzado
- ✅ Historial completo
- ✅ Exportación de datos
- ✅ Soporte prioritario

### Plan Premium Anual ($79.99/año - 33% descuento)
- ✅ Todo lo del plan mensual
- ✅ Ahorro de 2 meses
- ✅ Acceso anticipado a nuevas features

---

## 🔄 Flujo de Pago Propuesto

1. **Usuario selecciona plan** → Frontend muestra planes
2. **Usuario hace clic en "Suscribirse"** → Se crea checkout session
3. **Usuario completa pago** → Stripe procesa pago
4. **Webhook recibe confirmación** → Backend actualiza suscripción
5. **Usuario recibe confirmación** → Frontend muestra éxito
6. **Suscripción activa** → Usuario accede a features premium

---

## 📝 Próximos Pasos

1. **Fase 1: Configuración Base**
   - [ ] Crear cuenta Stripe
   - [ ] Configurar variables de entorno
   - [ ] Instalar SDK de Stripe
   - [ ] Crear modelos de base de datos

2. **Fase 2: Backend**
   - [ ] Crear servicios de pago
   - [ ] Crear rutas API
   - [ ] Implementar webhooks
   - [ ] Crear middleware de validación

3. **Fase 3: Frontend**
   - [ ] Crear pantallas de suscripción
   - [ ] Integrar Stripe Checkout
   - [ ] Crear componentes de UI
   - [ ] Implementar gestión de estado

4. **Fase 4: Testing**
   - [ ] Probar flujo completo
   - [ ] Probar webhooks
   - [ ] Probar casos edge
   - [ ] Testing de seguridad

5. **Fase 5: Deployment**
   - [ ] Configurar webhooks en producción
   - [ ] Configurar variables de entorno
   - [ ] Monitoreo y logging
   - [ ] Documentación

---

## 🔒 Consideraciones de Seguridad

1. **Validación de Webhooks**
   - Verificar firma de Stripe
   - Validar eventos recibidos

2. **Protección de Datos**
   - No almacenar información de tarjetas
   - Usar tokens de Stripe
   - Encriptar datos sensibles

3. **Rate Limiting**
   - Limitar intentos de pago
   - Prevenir abuso

4. **Logging**
   - Registrar todas las transacciones
   - Monitorear eventos sospechosos

---

## 📊 Métricas a Implementar

- Tasa de conversión (trial → premium)
- Ingresos recurrentes mensuales (MRR)
- Churn rate
- Lifetime value (LTV)
- Métricas por plan

---

## ❓ Preguntas para Decidir

1. ¿Qué pasarela de pago prefieres? (Stripe recomendado)
2. ¿Qué precios quieres establecer?
3. ¿Qué features serán premium?
4. ¿Necesitas soporte para múltiples monedas?
5. ¿Quieres ofrecer descuentos o promociones?

---

**Última actualización:** 2025-01-XX
**Autor:** AntoApp Team

