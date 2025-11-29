# Configuración de Planes de Mercado Pago

## ✅ Planes Configurados

### Planes Creados en Mercado Pago

| Período | Precio | Plan ID | URL de Checkout |
|---------|--------|---------|-----------------|
| **Semanal** | $950 CLP | `44c72c56db2049a68cc274cd16a85ca3` | [Link](https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=44c72c56db2049a68cc274cd16a85ca3) |
| **Mensual** | $3,600 CLP | `a5fc65fd717d4561b6a6f40a571b38fd` | [Link](https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=a5fc65fd717d4561b6a6f40a571b38fd) |
| **Trimestral (3 meses)** | $10,200 CLP | `794e5fc846fc4f68b9bdf290b13b21c6` | [Link](https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=794e5fc846fc4f68b9bdf290b13b21c6) |
| **Semestral (6 meses)** | $19,400 CLP | `f1cbb37d598444918d6725e70c1c46ff` | [Link](https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f1cbb37d598444918d6725e70c1c46ff) |
| **Anual** | $36,900 CLP | `897f1cdb24cc4df2971107d4192a28b0` | [Link](https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=897f1cdb24cc4df2971107d4192a28b0) |

---

## ⚙️ Variables de Entorno

Agrega estas variables a tu archivo `.env` del backend:

```env
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
```

---

## ✅ Verificación

### Precios Coinciden

- ✅ Semanal: $950 CLP
- ✅ Mensual: $3,600 CLP
- ✅ Trimestral: $10,200 CLP
- ✅ Semestral: $19,400 CLP
- ✅ Anual: $36,900 CLP

### URLs de Checkout

Todos los planes generan URLs con el formato correcto:
```
https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=PLAN_ID
```

---

## 🔄 Próximos Pasos

1. ✅ Planes creados en Mercado Pago
2. ✅ IDs obtenidos
3. ⏳ Agregar variables de entorno al `.env`
4. ⏳ Probar flujo completo de suscripción
5. ⏳ Configurar webhooks

---

**Última actualización:** 2025-01-XX
**Autor:** AntoApp Team

