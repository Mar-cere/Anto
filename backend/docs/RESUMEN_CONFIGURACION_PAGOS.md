# Resumen de Configuración de Pagos - Mercado Pago

## ✅ Estado Actual

### Planes Configurados

Todos los planes están creados en Mercado Pago y listos para usar:

| Período | Precio | Plan ID | Estado |
|---------|--------|---------|--------|
| **Semanal** | $950 CLP | `44c72c56db2049a68cc274cd16a85ca3` | ✅ Configurado |
| **Mensual** | $3,600 CLP | `a5fc65fd717d4561b6a6f40a571b38fd` | ✅ Configurado |
| **Trimestral** | $10,200 CLP | `794e5fc846fc4f68b9bdf290b13b21c6` | ✅ Configurado |
| **Semestral** | $19,400 CLP | `f1cbb37d598444918d6725e70c1c46ff` | ✅ Configurado |
| **Anual** | $36,900 CLP | `897f1cdb24cc4df2971107d4192a28b0` | ✅ Configurado |

---

## ⚙️ Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env` del backend:

```env
# Mercado Pago - Credenciales
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxxxxxxx

# Precios en CLP
MERCADOPAGO_PRICE_WEEKLY=950
MERCADOPAGO_PRICE_MONTHLY=3600
MERCADOPAGO_PRICE_QUARTERLY=10200
MERCADOPAGO_PRICE_SEMESTRAL=19400
MERCADOPAGO_PRICE_YEARLY=36900

# IDs de Preapproval Plans
MERCADOPAGO_PREAPPROVAL_PLAN_ID_WEEKLY=44c72c56db2049a68cc274cd16a85ca3
MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY=a5fc65fd717d4561b6a6f40a571b38fd
MERCADOPAGO_PREAPPROVAL_PLAN_ID_QUARTERLY=794e5fc846fc4f68b9bdf290b13b21c6
MERCADOPAGO_PREAPPROVAL_PLAN_ID_SEMESTRAL=f1cbb37d598444918d6725e70c1c46ff
MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY=897f1cdb24cc4df2971107d4192a28b0

# URLs de redirección (ajustar según tu app)
MERCADOPAGO_SUCCESS_URL=https://tu-app.com/subscription/success
MERCADOPAGO_CANCEL_URL=https://tu-app.com/subscription/cancel
MERCADOPAGO_PENDING_URL=https://tu-app.com/subscription/pending

# Webhook
MERCADOPAGO_WEBHOOK_URL=https://tu-backend.com/api/payments/webhook
```

---

## 🔗 URLs de Checkout

El sistema genera automáticamente estas URLs cuando un usuario selecciona un plan:

- **Semanal**: `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=44c72c56db2049a68cc274cd16a85ca3`
- **Mensual**: `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=a5fc65fd717d4561b6a6f40a571b38fd`
- **Trimestral**: `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=794e5fc846fc4f68b9bdf290b13b21c6`
- **Semestral**: `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f1cbb37d598444918d6725e70c1c46ff`
- **Anual**: `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=897f1cdb24cc4df2971107d4192a28b0`

---

## ✅ Checklist de Configuración

### Backend
- [x] Modelos de base de datos (Transaction, Subscription)
- [x] Servicio de pagos con Mercado Pago
- [x] Rutas API completas
- [x] Soporte para Preapproval Plans
- [x] Webhooks configurados
- [ ] Variables de entorno configuradas
- [ ] Webhook configurado en panel de Mercado Pago

### Frontend
- [x] Pantalla de suscripción
- [x] Componentes UI (PlanCard, SubscriptionStatus)
- [x] Integración con API
- [x] Navegación configurada
- [ ] Probar flujo completo

### Mercado Pago
- [x] Planes creados
- [x] IDs obtenidos
- [ ] Webhook configurado
- [ ] Probar con tarjetas de prueba

---

## 🧪 Testing

### Tarjetas de Prueba

Usa estas tarjetas para probar:

**Tarjeta aprobada:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura

**Más tarjetas:** Ver [MERCADOPAGO_SETUP.md](./MERCADOPAGO_SETUP.md)

---

## 📝 Próximos Pasos

1. **Agregar variables de entorno** al `.env`
2. **Configurar webhook** en el panel de Mercado Pago
3. **Probar flujo completo** de suscripción
4. **Verificar webhooks** con ngrok (para testing local)

---

**Última actualización:** 2025-01-XX
**Autor:** AntoApp Team

