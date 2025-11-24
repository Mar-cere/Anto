# Configuración de WhatsApp con Twilio

Este documento explica cómo configurar WhatsApp para enviar alertas a contactos de emergencia usando Twilio.

## 📋 Requisitos Previos

1. **Cuenta de Twilio** (gratis para empezar)
2. **Número de teléfono verificado** en Twilio
3. **WhatsApp Business Account** (se puede obtener a través de Twilio)

## 🔧 Configuración en Twilio

### Paso 1: Crear cuenta en Twilio

1. Ve a [https://www.twilio.com](https://www.twilio.com)
2. Click en **"Sign Up"** o **"Get Started"**
3. Completa el formulario:
   - Email
   - Contraseña
   - Nombre
4. Verifica tu email
5. Verifica tu número de teléfono (te enviarán un código por SMS)

### Paso 2: Obtener credenciales (Account SID y Auth Token)

**Opción A: Desde el Dashboard (más fácil)**

1. Después de iniciar sesión, serás redirigido al **Dashboard**
2. En la parte superior verás un panel con:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (empieza con "AC")
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (haz click en el ícono del ojo para verlo)
3. **IMPORTANTE**: Copia ambos valores, los necesitarás

**Opción B: Desde Settings**

1. Ve a [Console de Twilio](https://console.twilio.com)
2. En el menú lateral, click en **"Settings"** (Configuración)
3. Click en **"General"**
4. Ahí encontrarás:
   - **Account SID**: Visible directamente
   - **Auth Token**: Haz click en el ícono del ojo 👁️ para revelarlo

**⚠️ IMPORTANTE:**
- El **Auth Token** solo se muestra una vez cuando lo revelas
- Guárdalo en un lugar seguro
- Si lo pierdes, puedes generar uno nuevo desde Settings > General > Auth Token

### Paso 3: Configurar WhatsApp Sandbox (Para pruebas)

1. En la consola de Twilio, ve a **"Messaging"** (Mensajería) en el menú lateral
2. Click en **"Try it out"** (Pruébalo)
3. Click en **"Send a WhatsApp message"** (Enviar un mensaje de WhatsApp)
4. Verás un código como: `join example-code`
5. **Envía ese código por WhatsApp** al número: `+1 415 523 8886`
6. Twilio te responderá confirmando que te uniste al Sandbox
7. Una vez unido, podrás enviar mensajes a números que verifiques

**Ejemplo:**
- Código del Sandbox: `join abc-xyz`
- Envía por WhatsApp a: `+1 415 523 8886`
- Mensaje: `join abc-xyz`
- Twilio responderá: "You're all set! ..."

### Paso 4: Obtener número de WhatsApp de Twilio

**Para pruebas (Sandbox - GRATIS):**
- Usa el número del Sandbox: `whatsapp:+14155238886`
- Este número funciona inmediatamente para pruebas
- Solo puedes enviar a números que hayas verificado

**Para producción (requiere aprobación):**
1. Ve a **Phone Numbers** > **Manage** > **Buy a number**
2. Busca un número con capacidad de WhatsApp
3. Compra el número (costo mensual ~$1 USD)
4. O solicita aprobación para usar WhatsApp Business API

**Nota:** Durante la fase de prueba (Sandbox), solo puedes enviar mensajes a números que hayas verificado previamente.

### Paso 5: Solicitar aprobación para producción (Opcional)

Para enviar mensajes a cualquier número:
1. Ve a **Messaging** > **Settings** > **WhatsApp Senders**
2. Solicita aprobación para tu caso de uso
3. Twilio revisará tu solicitud (puede tardar varios días)

## 🔐 Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
DEFAULT_COUNTRY_CODE=+1  # Código de país por defecto (opcional, ej: +54 para Argentina, +52 para México)
```

### 📍 Dónde encontrar cada valor:

1. **TWILIO_ACCOUNT_SID**: 
   - Dashboard de Twilio (parte superior)
   - O Settings > General > Account SID
   - Formato: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **TWILIO_AUTH_TOKEN**:
   - Dashboard de Twilio (parte superior, click en el ojo 👁️)
   - O Settings > General > Auth Token (click en el ojo)
   - Formato: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **TWILIO_WHATSAPP_NUMBER**:
   - Para pruebas: `whatsapp:+14155238886` (número del Sandbox)
   - Para producción: El número que compres o te aprueben
   - **IMPORTANTE**: Debe empezar con `whatsapp:`

4. **DEFAULT_COUNTRY_CODE** (Opcional):
   - Código de país por defecto si los números no lo incluyen
   - Ejemplos: `+1` (USA), `+54` (Argentina), `+52` (México), `+34` (España)

## 📱 Formato de Números

Los números deben estar en formato internacional:
- ✅ `+1234567890` (con código de país)
- ✅ `whatsapp:+1234567890` (formato completo)
- ❌ `1234567890` (sin código de país)
- ❌ `(123) 456-7890` (formato local)

El servicio automáticamente formatea los números, pero es mejor guardarlos en formato internacional.

## 🚀 Uso

### Envío Automático

El sistema automáticamente enviará mensajes de WhatsApp cuando:
- Se detecte una situación de crisis (riesgo MEDIUM o HIGH)
- El contacto tenga un número de teléfono configurado
- WhatsApp esté configurado correctamente

### Envío Manual (Prueba)

Puedes probar el envío de WhatsApp desde:
- **Settings** > **Contactos de Emergencia** > Botón de prueba de WhatsApp
- O usando el endpoint: `POST /api/users/me/emergency-contacts/:contactId/test-whatsapp`

## 💰 Costos

### Plan Gratuito (Sandbox)
- ✅ Gratis para pruebas
- ⚠️ Solo a números verificados
- ⚠️ Mensajes limitados

### Plan de Pago
- **$0.005 - $0.01 USD por mensaje** (depende del país)
- ✅ Envío a cualquier número (después de aprobación)
- ✅ Sin límites

## ⚠️ Limitaciones del Sandbox

Durante la fase de prueba:
- Solo puedes enviar a números que hayas verificado
- Los mensajes deben empezar con el código del Sandbox
- Hay límites en la cantidad de mensajes

**Ejemplo de código del Sandbox:** `join <código>` (ej: `join example-code`)

## 🔍 Troubleshooting

### Error: "The number is not registered on WhatsApp"
- El número no tiene WhatsApp activo
- Verifica que el número esté correcto

### Error: "Cannot send messages to this number"
- El número no está en la lista de permitidos (Sandbox)
- Agrega el número al Sandbox de Twilio

### Error: "Invalid phone number"
- Verifica el formato del número
- Debe incluir código de país (ej: +1, +54, +52)

### Error: "WhatsApp not configured"
- Verifica que las variables de entorno estén configuradas
- Reinicia el servidor después de agregar las variables

## 📚 Recursos

- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Guía de Inicio Rápido](https://www.twilio.com/docs/whatsapp/quickstart)
- [Precios de Twilio](https://www.twilio.com/whatsapp/pricing)

## 🎯 Próximos Pasos

1. Configurar variables de entorno en Render
2. Probar con un número verificado
3. Solicitar aprobación para producción (opcional)
4. Actualizar números de contactos a formato internacional

