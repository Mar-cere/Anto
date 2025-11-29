# Próximos Pasos - Sistema de Pagos

## ✅ Completado

### Backend
- [x] Modelos de base de datos (Transaction, Subscription)
- [x] Servicio de pagos con Mercado Pago
- [x] Rutas API completas
- [x] Webhooks configurados
- [x] Middleware de validación
- [x] SDK de Mercado Pago instalado

---

## 📋 Próximos Pasos

### 1. Configuración de Mercado Pago (Prioridad Alta)

**Tiempo estimado:** 30-60 minutos

- [ ] Crear cuenta en Mercado Pago (https://www.mercadopago.cl)
- [ ] Verificar identidad y completar información del negocio
- [ ] Obtener credenciales:
  - Access Token (TEST-xxx para pruebas)
  - Public Key (TEST-xxx para pruebas)
- [ ] Configurar webhook en el panel de Mercado Pago
- [ ] Agregar variables de entorno al `.env`:
  ```env
  MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxx
  MERCADOPAGO_PRICE_MONTHLY=9990
  MERCADOPAGO_PRICE_YEARLY=79990
  MERCADOPAGO_SUCCESS_URL=https://tu-app.com/subscription/success
  MERCADOPAGO_CANCEL_URL=https://tu-app.com/subscription/cancel
  MERCADOPAGO_PENDING_URL=https://tu-app.com/subscription/pending
  MERCADOPAGO_WEBHOOK_URL=https://tu-backend.com/api/payments/webhook
  ```

**Documentación:** Ver `MERCADOPAGO_SETUP.md`

---

### 2. Frontend - Pantalla de Suscripción (Prioridad Alta)

**Tiempo estimado:** 4-6 horas

#### 2.1 Pantalla de Planes (`SubscriptionScreen.js`)

**Funcionalidades:**
- [ ] Mostrar planes disponibles (mensual y anual)
- [ ] Mostrar precios en CLP
- [ ] Mostrar características de cada plan
- [ ] Botón "Suscribirse" para cada plan
- [ ] Indicador de plan actual (si tiene suscripción activa)
- [ ] Badge de "Recomendado" para plan anual
- [ ] Mostrar ahorro del plan anual

**Diseño:**
- Cards con diseño atractivo
- Comparación lado a lado
- Animaciones al seleccionar plan
- Feedback háptico

#### 2.2 Integración con Mercado Pago

- [ ] Llamar a `POST /api/payments/create-checkout-session`
- [ ] Abrir URL de Mercado Pago en navegador/WebView
- [ ] Manejar redirección después del pago
- [ ] Mostrar estado de carga durante el proceso

#### 2.3 Pantalla de Estado de Suscripción

- [ ] Mostrar estado actual (free, trial, premium)
- [ ] Mostrar fecha de expiración
- [ ] Botón para cancelar suscripción
- [ ] Botón para actualizar método de pago
- [ ] Mostrar días restantes de trial

---

### 3. Frontend - Componentes UI (Prioridad Media)

**Tiempo estimado:** 2-3 horas

- [ ] `PlanCard.js` - Componente de tarjeta de plan
- [ ] `SubscriptionStatus.js` - Indicador de estado
- [ ] `PaymentMethodCard.js` - Tarjeta de método de pago
- [ ] `SubscriptionBadge.js` - Badge de suscripción premium

---

### 4. Frontend - Historial de Transacciones (Prioridad Media)

**Tiempo estimado:** 2-3 horas

- [ ] `TransactionHistoryScreen.js`
- [ ] Lista de transacciones con filtros
- [ ] Detalles de cada transacción
- [ ] Filtros por estado (completadas, pendientes, fallidas)
- [ ] Filtros por tipo (suscripción, reembolso)

---

### 5. Integración en Settings (Prioridad Media)

**Tiempo estimado:** 1 hora

- [ ] Agregar sección "Suscripción" en `SettingsScreen.js`
- [ ] Link a pantalla de suscripción
- [ ] Mostrar estado actual de suscripción
- [ ] Link a historial de transacciones

---

### 6. Indicadores de Suscripción (Prioridad Baja)

**Tiempo estimado:** 2-3 horas

- [ ] Badge "Premium" en header cuando tiene suscripción activa
- [ ] Indicadores en features premium
- [ ] Modales informativos para usuarios free
- [ ] Límites para usuarios free (ej: mensajes limitados)

---

### 7. Testing (Prioridad Alta)

**Tiempo estimado:** 2-4 horas

- [ ] Probar flujo completo de suscripción
- [ ] Probar webhooks con ngrok
- [ ] Probar cancelación de suscripción
- [ ] Probar con tarjetas de prueba de Mercado Pago
- [ ] Probar casos edge (pago fallido, pago pendiente)
- [ ] Probar redirecciones después del pago

---

### 8. Middleware de Validación (Prioridad Media)

**Tiempo estimado:** 1-2 horas

- [ ] Implementar `checkSubscription` middleware
- [ ] Restringir acceso a features premium
- [ ] Mensajes de error apropiados
- [ ] Redirección a pantalla de suscripción si no tiene acceso

---

## 🎯 Plan de Implementación Sugerido

### Sprint 1: Configuración y Pantalla Básica (1-2 días)
1. Configurar cuenta de Mercado Pago
2. Crear `SubscriptionScreen.js` básica
3. Integrar con API de planes
4. Probar flujo básico

### Sprint 2: Integración Completa (2-3 días)
1. Integrar checkout de Mercado Pago
2. Manejar redirecciones
3. Crear pantalla de estado de suscripción
4. Integrar en Settings

### Sprint 3: Mejoras y Testing (1-2 días)
1. Agregar componentes UI
2. Crear historial de transacciones
3. Testing completo
4. Ajustes de UX

---

## 📝 Notas Importantes

1. **Webhooks**: Para testing local, usar ngrok para exponer el endpoint
2. **Tarjetas de Prueba**: Mercado Pago proporciona tarjetas de prueba (ver `MERCADOPAGO_SETUP.md`)
3. **Moneda**: Todos los precios están en CLP (pesos chilenos)
4. **Trial**: El sistema incluye 21 días de trial automático

---

## 🔗 Recursos

- [Documentación de Mercado Pago](https://www.mercadopago.cl/developers/es/docs)
- [Guía de Setup](./MERCADOPAGO_SETUP.md)
- [Resumen de Implementación](./IMPLEMENTACION_PAGOS_RESUMEN.md)

---

**Última actualización:** 2025-01-XX
**Autor:** AntoApp Team

