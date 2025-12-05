# 📱 Configuración de WhatsApp Cloud API (Meta)

Esta guía explica cómo configurar WhatsApp Cloud API de Meta para enviar alertas a contactos de emergencia.

## 🎯 Ventajas de WhatsApp Cloud API

- ✅ **Más simple**: Solo requiere un token de acceso
- ✅ **Gratis**: 1,000 conversaciones/mes gratis
- ✅ **Sin sandbox**: Funciona directamente en producción
- ✅ **API oficial**: Soporte oficial de Meta
- ✅ **Más rápido**: Menos pasos de configuración que Twilio

## 📋 Requisitos Previos

1. **Cuenta de Meta Business** (gratis)
2. **Aplicación de Meta** (gratis)
3. **Número de teléfono** (puede ser tu número personal para pruebas)

## 🔧 Configuración Paso a Paso

### Paso 1: Crear Cuenta de Meta Business

1. Ve a [Meta Business Suite](https://business.facebook.com/)
2. Click en **"Crear cuenta"** o **"Iniciar sesión"**
3. Completa el formulario con:
   - Nombre de tu negocio
   - Tu nombre
   - Email
4. Verifica tu email

### Paso 2: Crear una Aplicación de Meta

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Click en **"Mis aplicaciones"** > **"Crear aplicación"**
3. Selecciona **"Negocio"** como tipo de aplicación
4. Completa:
   - Nombre de la aplicación (ej: "Anto Alertas")
   - Email de contacto
   - Propósito de la aplicación
5. Click en **"Crear aplicación"**

### Paso 3: Agregar Producto de WhatsApp

1. En el dashboard de tu aplicación, busca **"WhatsApp"**
2. Click en **"Configurar"** o **"Agregar producto"**
3. Selecciona **"WhatsApp"** y click en **"Configurar"**

### Paso 4: Obtener Credenciales

#### 4.1. Token de Acceso Temporal (Para pruebas)

1. En la sección de WhatsApp, ve a **"API Setup"** o **"Configuración de API"**
2. Encuentra **"Temporary access token"** o **"Token de acceso temporal"**
3. Click en **"Copy"** o **"Copiar"**
4. ⚠️ Este token expira en 24 horas, solo para pruebas

#### 4.2. Token de Acceso Permanente (Para producción)

1. Ve a **"Configuración"** > **"Básico"** en tu aplicación
2. Anota tu **"App ID"** y **"App Secret"**
3. Ve a **"Herramientas"** > **"Explorador de Graph API"**
4. Selecciona tu aplicación
5. Genera un token de acceso con permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
6. O usa el token del sistema (más simple para empezar)

#### 4.3. Phone Number ID

1. En la sección de WhatsApp, ve a **"API Setup"**
2. Encuentra **"Phone number ID"** o **"ID del número de teléfono"**
3. Copia este ID (es un número largo)

#### 4.4. Business Account ID (Opcional)

1. En la sección de WhatsApp, ve a **"API Setup"**
2. Encuentra **"Business account ID"** o **"ID de cuenta de negocio"**
3. Copia este ID (opcional, pero recomendado)

### Paso 5: Verificar Número de Teléfono

1. En la sección de WhatsApp, ve a **"API Setup"**
2. Click en **"Add phone number"** o **"Agregar número de teléfono"**
3. Ingresa tu número de teléfono
4. Verifica el código que recibes por SMS
5. Una vez verificado, puedes usar este número para enviar mensajes

### Paso 6: Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# WhatsApp Cloud API (Meta)
WHATSAPP_CLOUD_ACCESS_TOKEN=tu_token_de_acceso_aqui
WHATSAPP_CLOUD_PHONE_NUMBER_ID=tu_phone_number_id_aqui
WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID=tu_business_account_id_aqui  # Opcional
WHATSAPP_CLOUD_API_VERSION=v18.0  # Opcional, default: v18.0

# Código de país por defecto (para números sin código de país)
DEFAULT_COUNTRY_CODE=+56  # Chile, ajusta según tu país
```

### Paso 7: Probar la Configuración

1. Reinicia tu servidor
2. Verifica los logs - deberías ver:
   ```
   [WhatsAppCloudService] ✅ WhatsApp Cloud API configurado correctamente
   ```
3. Prueba enviando un mensaje de prueba desde la app

## 📱 Formato de Números

Los números deben estar en formato internacional:
- ✅ `+56912345678` (con código de país)
- ✅ `56912345678` (sin +, se agrega automáticamente)
- ❌ `912345678` (sin código de país, se agrega el DEFAULT_COUNTRY_CODE)
- ❌ `(9) 1234-5678` (formato local, se limpia automáticamente)

## 💰 Costos

### Plan Gratuito
- ✅ **1,000 conversaciones/mes gratis**
- ✅ Sin límite de mensajes dentro de esas conversaciones
- ✅ Perfecto para empezar

### Plan de Pago
- **$0.005 - $0.01 USD por conversación** después del límite gratis
- Depende del país del destinatario
- Muy económico comparado con Twilio

## ⚠️ Limitaciones

### Durante Pruebas
- Puedes enviar mensajes a números verificados
- Límite de 1,000 conversaciones/mes gratis
- Después del límite, se cobra por conversación

### En Producción
- Necesitas verificar tu negocio (puede tomar tiempo)
- Después de la verificación, puedes enviar a cualquier número
- Sin límites de mensajes (solo límite de conversaciones)

## 🔄 Migración desde Twilio

Si ya usas Twilio, puedes:

1. **Mantener ambos**: El sistema intentará usar Cloud API primero, luego Twilio como fallback
2. **Solo Cloud API**: Configura Cloud API y deshabilita Twilio
3. **Solo Twilio**: No configures Cloud API y seguirá usando Twilio

## 🐛 Solución de Problemas

### Error: "Token de acceso inválido"
- Verifica que el token no haya expirado
- Genera un nuevo token desde Meta for Developers
- Asegúrate de que el token tenga los permisos correctos

### Error: "Número de teléfono inválido"
- Verifica que el número esté en formato internacional
- Asegúrate de que el número esté registrado en WhatsApp
- Verifica que el número tenga el código de país correcto

### Error: "Límite de mensajes alcanzado"
- Has alcanzado el límite de 1,000 conversaciones/mes
- Espera al siguiente mes o actualiza a un plan de pago

### Error: "El número no está registrado en WhatsApp"
- El número debe tener WhatsApp activo
- Verifica que el número sea correcto
- Asegúrate de que el número esté en formato internacional

## 📚 Recursos Adicionales

- [Documentación oficial de WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Guía de inicio rápido](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Explorador de Graph API](https://developers.facebook.com/tools/explorer/)

## ✅ Verificación

Para verificar que todo funciona:

1. Configura las variables de entorno
2. Reinicia el servidor
3. Envía un mensaje de prueba desde la app
4. Verifica que recibas el mensaje en WhatsApp

Si todo funciona, verás en los logs:
```
[EmergencyAlertService] ✅ WhatsApp enviado a [Nombre] ([Número])
```

---

**¡Listo!** Ahora puedes usar WhatsApp Cloud API para enviar alertas de emergencia. 🎉

