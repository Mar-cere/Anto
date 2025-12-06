# 🔍 Verificar Número en Twilio WhatsApp Sandbox

## ⚠️ Problema: Mensaje en Cola ("queued") pero No Llega

Si ves en los logs:
```
[WhatsAppService] ✅ Mensaje enviado exitosamente. SID: SMxxxxx, Status: queued
```

Pero el mensaje **no llega** al teléfono, es muy probable que estés en **modo sandbox** y el número no esté verificado.

## 🎯 Solución: Verificar el Número en Twilio Sandbox

### Paso 1: Acceder a Twilio Console

1. Ve a [Twilio Console](https://console.twilio.com)
2. Inicia sesión con tu cuenta

### Paso 2: Ir a WhatsApp Sandbox

1. En el menú lateral, ve a **Messaging** (Mensajería)
2. Click en **Try it out** (Pruébalo)
3. Click en **Send a WhatsApp message** (Enviar un mensaje de WhatsApp)

### Paso 3: Ver el Código del Sandbox

Verás un código como:
```
join example-code
```

Este código es único para tu cuenta de Twilio.

### Paso 4: Unirse al Sandbox desde WhatsApp

1. Abre **WhatsApp** en tu teléfono
2. Envía el código del sandbox (ej: `join example-code`) al número: **+1 415 523 8886**
3. Twilio te responderá confirmando que te uniste al sandbox

### Paso 5: Verificar el Número de Destino

**IMPORTANTE:** El número que quieres **recibir** mensajes también debe estar verificado:

1. En la misma página de **WhatsApp Sandbox**, verás una sección de **"To"** (Para)
2. Ingresa el número de teléfono que quieres verificar (ej: `+56934522191`)
3. Twilio te enviará un código de verificación
4. Ingresa el código para verificar el número

**Alternativa:** Si el número ya está en tu cuenta de Twilio, puede estar automáticamente verificado.

## 📋 Verificar Estado del Mensaje

Puedes verificar el estado de un mensaje usando el endpoint:

```bash
GET /api/users/me/whatsapp-message-status/:messageSid
```

**Ejemplo:**
```bash
GET /api/users/me/whatsapp-message-status/SM33150fb90d7eb808dae192fbe9a3ec1f
```

**Respuesta:**
```json
{
  "message": "Estado del mensaje obtenido exitosamente",
  "status": "queued",
  "messageId": "SM33150fb90d7eb808dae192fbe9a3ec1f",
  "details": {
    "to": "whatsapp:+56934522191",
    "from": "whatsapp:+56994434888",
    "dateCreated": "2024-01-15T10:30:00Z",
    "errorCode": null,
    "errorMessage": null
  },
  "help": {
    "statusMeanings": {
      "queued": "Mensaje en cola esperando ser enviado",
      "sent": "Mensaje enviado exitosamente",
      "delivered": "Mensaje entregado al destinatario",
      "failed": "Mensaje falló al enviar"
    }
  }
}
```

## 🔍 Estados del Mensaje

| Estado | Significado | Acción |
|--------|-------------|--------|
| `queued` | Mensaje en cola | Verifica que el número esté verificado en sandbox |
| `sending` | Mensaje siendo enviado | Espera unos segundos |
| `sent` | Mensaje enviado | El mensaje fue enviado, pero puede no haber llegado |
| `delivered` | Mensaje entregado | ✅ El mensaje llegó al teléfono |
| `read` | Mensaje leído | ✅ El mensaje fue leído |
| `failed` | Mensaje falló | Revisa `errorCode` y `errorMessage` |
| `undelivered` | No entregado | El número puede no tener WhatsApp activo |

## ⚠️ Limitaciones del Sandbox

En modo sandbox:
- ✅ Solo puedes enviar a números **verificados**
- ✅ Mensajes limitados
- ✅ Gratis para pruebas
- ❌ No puedes enviar a cualquier número

## 🚀 Pasar a Producción

Para enviar a cualquier número sin verificación:

1. Ve a **Messaging** > **Settings** > **WhatsApp Senders**
2. Solicita aprobación para tu caso de uso
3. Twilio revisará tu solicitud (puede tardar varios días)
4. Una vez aprobado, podrás enviar a cualquier número

## 📚 Recursos

- [Twilio Console - WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Solicitar aprobación para producción](https://www.twilio.com/docs/whatsapp/quickstart)

