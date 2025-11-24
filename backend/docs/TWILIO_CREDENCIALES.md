# 📋 Guía Rápida: Obtener Credenciales de Twilio

## 🎯 Pasos Rápidos

### 1️⃣ Crear Cuenta
1. Ve a: **https://www.twilio.com**
2. Click en **"Sign Up"** (Registrarse)
3. Completa el formulario y verifica tu email y teléfono

### 2️⃣ Obtener Credenciales

**Método más rápido:**

1. **Inicia sesión** en [Console de Twilio](https://console.twilio.com)
2. En el **Dashboard principal** (página de inicio), verás un panel con:
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: [👁️ Click para ver]
   ```
3. **Copia ambos valores**

**Si no los ves en el Dashboard:**

1. Click en tu **nombre de usuario** (arriba a la derecha)
2. O ve directamente a: **Settings** > **General**
3. Ahí encontrarás:
   - **Account SID**: Visible directamente
   - **Auth Token**: Click en el ícono del ojo 👁️ para revelarlo

### 3️⃣ Configurar WhatsApp Sandbox

1. En el menú lateral, ve a **Messaging** (Mensajería)
2. Click en **Try it out** (Pruébalo)
3. Click en **Send a WhatsApp message**
4. Verás un código como: `join abc-xyz-123`
5. **Abre WhatsApp** en tu teléfono
6. Envía ese código al número: **+1 415 523 8886**
7. Twilio te responderá confirmando

### 4️⃣ Configurar Variables de Entorno

En Render o tu `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 📸 Ubicación Visual de las Credenciales

```
┌─────────────────────────────────────────┐
│  Twilio Console                         │
├─────────────────────────────────────────┤
│                                         │
│  Account SID                            │
│  ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx     │ ← Copia esto
│                                         │
│  Auth Token                             │
│  [👁️] xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  │ ← Click en el ojo y copia
│                                         │
└─────────────────────────────────────────┘
```

## ⚠️ Importante

- **Auth Token**: Solo se muestra cuando haces click en el ojo 👁️
- **Guárdalo seguro**: Si lo pierdes, puedes generar uno nuevo
- **Número de WhatsApp**: Para pruebas usa `whatsapp:+14155238886`

## 🔗 Enlaces Útiles

- **Console de Twilio**: https://console.twilio.com
- **Dashboard**: https://console.twilio.com/us1/develop
- **Settings**: https://console.twilio.com/us1/develop/settings
- **WhatsApp Sandbox**: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

## ✅ Verificación

Después de configurar, verifica que todo funcione:

1. Reinicia el servidor
2. Deberías ver en los logs: `[WhatsAppService] ✅ Twilio configurado correctamente`
3. Prueba enviando un mensaje desde Settings

## 🆘 Problemas Comunes

**"Auth Token no se muestra"**
- Haz click en el ícono del ojo 👁️
- Si no aparece, ve a Settings > General > Auth Token

**"No encuentro el Account SID"**
- Está en el Dashboard principal
- O en Settings > General

**"No puedo unirme al Sandbox"**
- Asegúrate de enviar el código exacto que te muestra Twilio
- Envía al número correcto: +1 415 523 8886
- Espera unos segundos, puede tardar

