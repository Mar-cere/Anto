# Configuración de Mercado Pago - Guía Completa

## 📋 Prerequisitos

1. Cuenta de Mercado Pago (crear en https://www.mercadopago.cl)
2. Acceso al Panel de Mercado Pago
3. Variables de entorno configuradas

---

## 🔧 Configuración Inicial

### 1. Crear Cuenta en Mercado Pago

1. Ve a https://www.mercadopago.cl y crea una cuenta
2. Completa la información de tu negocio
3. Verifica tu identidad (requerido para recibir pagos)
4. Activa tu cuenta

### 2. Obtener Credenciales

1. Ve al Panel de Mercado Pago: https://www.mercadopago.cl/developers/panel
2. Navega a **Tus integraciones** → **Credenciales**
3. Copia las siguientes credenciales:
   - **Access Token** (TEST-xxx para pruebas, APP_USR-xxx para producción)
   - **Public Key** (TEST-xxx para pruebas, APP_USR-xxx para producción)

### 3. Configurar Precios

Los precios se configuran directamente en el código o variables de entorno:

```env
MERCADOPAGO_PRICE_MONTHLY=9990  # $9.990 CLP
MERCADOPAGO_PRICE_YEARLY=79990  # $79.990 CLP
```

### 4. Configurar Webhooks (Notificaciones IPN)

1. Ve a **Tus integraciones** → **Webhooks**
2. Click en **Crear webhook**
3. URL del endpoint: `https://tu-dominio.com/api/payments/webhook`
4. Selecciona los siguientes eventos:
   - `payment`
   - `subscription`
   - `preapproval`
5. Copia el **Webhook Secret** (si está disponible)

### 5. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxxxxxxx

# Precios (en pesos chilenos)
MERCADOPAGO_PRICE_MONTHLY=9990
MERCADOPAGO_PRICE_YEARLY=79990

# URLs de redirección (ajustar según tu frontend)
MERCADOPAGO_SUCCESS_URL=https://tu-app.com/subscription/success
MERCADOPAGO_CANCEL_URL=https://tu-app.com/subscription/cancel
MERCADOPAGO_PENDING_URL=https://tu-app.com/subscription/pending

# URL del webhook (debe ser accesible públicamente)
MERCADOPAGO_WEBHOOK_URL=https://tu-backend.com/api/payments/webhook

# Días de trial (opcional, default: 21)
MERCADOPAGO_TRIAL_DAYS=21

# Moneda (opcional, default: CLP)
MERCADOPAGO_CURRENCY=CLP
```

---

## 📦 Instalación del SDK

```bash
cd backend
npm install mercadopago
```

---

## 🧪 Testing

### Usar Tarjetas de Prueba

Mercado Pago proporciona tarjetas de prueba:

**Tarjeta aprobada:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura (ej: 11/25)
- Nombre: Cualquier nombre

**Tarjeta rechazada:**
- Número: `5031 4332 1540 6351`

**Tarjeta pendiente:**
- Número: `5031 7557 3453 0604` (con ciertos montos)

**Más tarjetas de prueba:**
- Ver: https://www.mercadopago.cl/developers/es/docs/checkout-pro/test-cards

### Probar Webhooks Localmente

Para testing local, puedes usar herramientas como:
- **ngrok**: `ngrok http 5000`
- **Stripe CLI** (si tienes cuenta): `stripe listen --forward-to localhost:5000/api/payments/webhook`

O usar el panel de Mercado Pago para simular notificaciones.

---

## 📝 Checklist de Configuración

- [ ] Cuenta de Mercado Pago creada y verificada
- [ ] Credenciales obtenidas (Access Token y Public Key)
- [ ] Precios configurados
- [ ] Webhook endpoint configurado
- [ ] Variables de entorno configuradas
- [ ] SDK de Mercado Pago instalado (`npm install mercadopago`)
- [ ] Servidor reiniciado con nuevas variables

---

## 🔄 Migración a Producción

1. **Cambiar a credenciales de Producción:**
   - Reemplaza `TEST-` con `APP_USR-` en Access Token
   - Reemplaza `TEST-` con `APP_USR-` en Public Key

2. **Actualizar Webhook:**
   - Crea nuevo endpoint con URL de producción
   - Verifica que la URL sea accesible públicamente

3. **Verificar Precios:**
   - Asegúrate de usar los precios correctos en producción

4. **Testing:**
   - Prueba el flujo completo en modo test primero
   - Verifica que los webhooks funcionen
   - Prueba con tarjetas reales en modo test

---

## 🆘 Troubleshooting

### Error: "Mercado Pago no está configurado correctamente"
- Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté en `.env`
- Verifica que el token comience con `TEST-` o `APP_USR-`

### Error: "Plan monthly no está configurado"
- Verifica que `MERCADOPAGO_PRICE_MONTHLY` esté en `.env`
- Verifica que el precio sea un número válido

### Webhooks no se reciben
- Verifica que la URL del webhook sea accesible públicamente
- Usa ngrok para testing local
- Verifica los logs del servidor
- Revisa el panel de Mercado Pago para ver el estado de las notificaciones

### Error al crear preferencia
- Verifica que el Access Token sea válido
- Verifica que los precios sean números positivos
- Revisa los logs de Mercado Pago en el panel

---

## 📚 Recursos Adicionales

- [Documentación de Mercado Pago](https://www.mercadopago.cl/developers/es/docs)
- [API Reference](https://www.mercadopago.cl/developers/es/reference)
- [Checkout Pro](https://www.mercadopago.cl/developers/es/docs/checkout-pro)
- [Suscripciones](https://www.mercadopago.cl/developers/es/docs/subscriptions)
- [Webhooks](https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks)

---

## 🔄 Conceptos Clave

### Conceptos de Mercado Pago:

| Concepto | Descripción |
|----------|-------------|
| Preference | Sesión de pago que genera un link para que el usuario complete el pago |
| Payer | Cliente/usuario que realiza el pago |
| Subscription | Suscripción recurrente (usando Preapproval API) |
| Payment | Pago individual procesado |
| IPN Notification | Notificación webhook que confirma eventos de pago |

### Flujo de Pago:

1. **Mercado Pago**: Crea Preference → Usuario paga → IPN Notification confirma

---

**Última actualización:** 2025-01-XX
**Autor:** AntoApp Team

