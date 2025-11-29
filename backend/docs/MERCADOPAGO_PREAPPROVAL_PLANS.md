# Configuración de Preapproval Plans en Mercado Pago

## 📋 ¿Qué son los Preapproval Plans?

Los **Preapproval Plans** son planes de suscripción recurrente en Mercado Pago. A diferencia de las Preferences (pagos únicos), los Preapproval Plans permiten:

- ✅ Pagos recurrentes automáticos
- ✅ Gestión automática de renovaciones
- ✅ Períodos de prueba (trial)
- ✅ Cancelación desde el panel de Mercado Pago

---

## 🔧 Crear Preapproval Plans

### Opción 1: Desde el Panel de Mercado Pago (Recomendado)

1. Ve al Panel de Mercado Pago: https://www.mercadopago.cl/developers/panel
2. Navega a **Suscripciones** → **Planes**
3. Click en **Crear plan**
4. Completa la información:
   - **Nombre del plan**: "Anto Premium Mensual" / "Anto Premium Anual"
   - **Monto**: $9.990 CLP (mensual) / $79.990 CLP (anual)
   - **Frecuencia**: Mensual / Anual
   - **Período de prueba**: 21 días (opcional)
   - **Descripción**: Descripción del plan
5. Guarda el plan y **copia el ID del plan** (ej: `44c72c56db2049a68cc274cd16a85ca3`)

### Opción 2: Desde la API (Avanzado)

Puedes crear planes programáticamente usando la API de Mercado Pago, pero es más complejo. Ver documentación: https://www.mercadopago.cl/developers/es/docs/subscriptions

---

## 🔗 URL de Checkout

Una vez creado el plan, la URL de checkout tiene el formato:

```
https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=TU_PLAN_ID
```

Ejemplo:
```
https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=44c72c56db2049a68cc274cd16a85ca3
```

---

## ⚙️ Configuración en el Backend

### Variables de Entorno

Agrega los IDs de tus Preapproval Plans al archivo `.env`:

```env
# IDs de Preapproval Plans (obtenidos del panel de Mercado Pago)
MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY=44c72c56db2049a68cc274cd16a85ca3
MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY=tu_plan_id_anual_aqui
```

### Cómo Obtener el ID del Plan

1. Ve al Panel de Mercado Pago
2. Navega a **Suscripciones** → **Planes**
3. Click en el plan que quieres usar
4. El ID aparece en la URL o en los detalles del plan
5. También puedes verlo en la URL de checkout que Mercado Pago genera

---

## 🔄 Flujo de Suscripción

1. **Usuario selecciona plan** → Frontend llama a `POST /api/payments/create-checkout-session`
2. **Backend genera URL** → Usa el `preapproval_plan_id` para generar la URL de checkout
3. **Usuario es redirigido** → A `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=XXX`
4. **Usuario completa pago** → En la página de Mercado Pago
5. **Mercado Pago procesa** → Crea la suscripción recurrente automáticamente
6. **Webhook notifica** → Mercado Pago envía notificación IPN a nuestro backend
7. **Backend actualiza** → Crea/actualiza la suscripción en nuestra base de datos

---

## 📝 Notas Importantes

1. **Un plan por tipo**: Necesitas crear un Preapproval Plan para mensual y otro para anual
2. **IDs únicos**: Cada plan tiene un ID único que no cambia
3. **Modo Test vs Producción**: Los planes de test tienen IDs diferentes a los de producción
4. **Trial**: Puedes configurar días de prueba gratis en el plan
5. **Cancelación**: Los usuarios pueden cancelar desde su cuenta de Mercado Pago o desde tu app

---

## 🆘 Troubleshooting

### Error: "Preapproval Plan ID no está configurado"
- Verifica que `MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY` o `MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY` estén en `.env`
- Verifica que los IDs sean correctos (sin espacios, sin comillas)

### El link no funciona
- Verifica que el plan esté activo en el panel de Mercado Pago
- Verifica que estés usando el ID correcto (test vs producción)
- Verifica que tengas permisos para crear suscripciones

### La suscripción no se renueva automáticamente
- Verifica que el plan esté configurado con la frecuencia correcta
- Verifica que el método de pago del usuario esté activo
- Revisa los webhooks para ver si hay errores

---

## 📚 Recursos

- [Documentación de Suscripciones](https://www.mercadopago.cl/developers/es/docs/subscriptions)
- [API de Preapproval Plans](https://www.mercadopago.cl/developers/es/reference/subscriptions/_preapproval_plan_id/get)
- [Panel de Mercado Pago](https://www.mercadopago.cl/developers/panel)

---

**Última actualización:** 2025-01-XX
**Autor:** AntoApp Team

