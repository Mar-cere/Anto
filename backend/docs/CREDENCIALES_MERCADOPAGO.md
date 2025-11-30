# 🔑 Credenciales de Mercado Pago - ¿Qué Necesitas?

Guía clara sobre qué credenciales son **obligatorias** y cuáles son **opcionales**.

---

## ✅ OBLIGATORIO (Para que funcione)

### 1. Access Token ⭐ **ESENCIAL**

**¿Qué es?**  
El token que permite que tu backend se comunique con la API de Mercado Pago.

**¿Dónde obtenerlo?**  
- Panel de Desarrolladores: https://www.mercadopago.cl/developers/panel
- Ve a tu aplicación → Credenciales → Access Token
- Para desarrollo: `TEST-xxxxxxxxxxxxx`
- Para producción: `APP_USR-xxxxxxxxxxxxx`

**Variable de entorno:**
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-token-aqui
```

**Sin esto:** ❌ El sistema de pagos NO funcionará

---

## 📋 OPCIONAL (Ya configurado, pero puedes personalizar)

### 2. Preapproval Plan IDs

**¿Qué es?**  
Los IDs de los planes de suscripción que ya creaste en Mercado Pago.

**¿Dónde obtenerlos?**  
Ya los tienes configurados en el código. Si quieres cambiarlos:
- Panel de Mercado Pago → Suscripciones → Planes
- Copia el ID de cada plan

**Variables de entorno (opcionales, ya tienen valores por defecto):**
```env
MERCADOPAGO_PREAPPROVAL_PLAN_ID_WEEKLY=44c72c56db2049a68cc274cd16a85ca3
MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY=a5fc65fd717d4561b6a6f40a571b38fd
MERCADOPAGO_PREAPPROVAL_PLAN_ID_QUARTERLY=794e5fc846fc4f68b9bdf290b13b21c6
MERCADOPAGO_PREAPPROVAL_PLAN_ID_SEMESTRAL=f1cbb37d598444918d6725e70c1c46ff
MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY=897f1cdb24cc4df2971107d4192a28b0
```

**Sin esto:** ⚠️ El sistema usará los valores por defecto (que ya están configurados)

---

## 🔒 OPCIONAL (Solo si quieres validar webhooks)

### 3. Webhook Secret

**¿Qué es?**  
Un secreto para validar que las notificaciones webhook realmente vienen de Mercado Pago.

**¿Dónde obtenerlo?**  
- Panel de Mercado Pago → Tus integraciones → Webhooks
- Al crear un webhook, puede que te den un secret
- **Nota:** Mercado Pago no siempre proporciona un webhook secret

**Variable de entorno (opcional):**
```env
MERCADOPAGO_WEBHOOK_SECRET=tu-secret-aqui
```

**Sin esto:** ⚠️ Los webhooks funcionarán, pero no se validará su autenticidad (generalmente está bien para empezar)

---

## ❌ NO NECESITAS

### Public Key

**¿Qué es?**  
Una clave pública que se usa en el frontend para integraciones directas.

**¿La necesitas?**  
❌ **NO** para el backend. Solo se usa si haces integraciones directas desde el frontend (que no es nuestro caso).

**Variable de entorno:**
```env
# NO es necesaria para el backend
MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxxxxxxx
```

---

## 📊 Resumen Rápido

| Credencial | Obligatorio | Dónde obtenerlo | Sin esto... |
|------------|-------------|-----------------|-------------|
| **Access Token** | ✅ **SÍ** | Panel → Credenciales | ❌ No funciona |
| **Preapproval Plan IDs** | ⚠️ Opcional | Ya configurados | ⚠️ Usa valores por defecto |
| **Webhook Secret** | ⚠️ Opcional | Panel → Webhooks | ⚠️ Webhooks sin validación |
| **Public Key** | ❌ NO | Panel → Credenciales | ✅ No afecta |

---

## 🚀 Configuración Mínima para Empezar

**Solo necesitas esto:**

```env
# backend/.env
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-token-aqui
```

**Eso es todo.** El resto ya está configurado con valores por defecto.

---

## 🔍 ¿Cómo Verificar qué Tienes?

### 1. Revisa tu archivo `.env`:

```bash
cd backend
cat .env | grep MERCADOPAGO
```

### 2. Verifica en Render:

1. Ve a tu proyecto en Render
2. Environment → Busca variables que empiecen con `MERCADOPAGO_`

### 3. Prueba el endpoint:

```bash
curl http://localhost:5000/api/payments/plans
```

- ✅ **200 OK** = Access Token configurado correctamente
- ❌ **503 Error** = Access Token no configurado o inválido

---

## 📝 Checklist de Configuración

- [ ] **Access Token** configurado (OBLIGATORIO)
- [ ] Preapproval Plan IDs configurados (opcional, ya están por defecto)
- [ ] Webhook Secret configurado (opcional, solo si quieres validar webhooks)
- [ ] Servidor reiniciado después de agregar variables

---

## 🆘 Problemas Comunes

### "No sé qué token usar"

- **Para desarrollo/pruebas:** Usa el que comienza con `TEST-`
- **Para producción:** Usa el que comienza con `APP_USR-`

### "No encuentro el Webhook Secret"

- No te preocupes, es opcional
- Mercado Pago no siempre lo proporciona
- Los webhooks funcionarán sin él

### "¿Necesito el Public Key?"

- **NO** para el backend
- Solo se usa en el frontend para integraciones directas
- No lo necesitas para este proyecto

---

**Última actualización:** 2025-01-XX  
**Autor:** AntoApp Team

