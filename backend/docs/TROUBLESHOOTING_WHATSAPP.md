# 🔧 Troubleshooting: WhatsApp No Funciona

## 🔍 Pasos para Diagnosticar

### 1. Verificar Configuración

Revisa los logs del servidor al iniciar. Deberías ver:

**Si WhatsApp Cloud API está configurado:**
```
[WhatsAppCloudService] ✅ WhatsApp Cloud API configurado correctamente
```

**Si NO está configurado:**
```
[WhatsAppCloudService] ⚠️ WhatsApp Cloud API no configurado
   - Falta WHATSAPP_CLOUD_ACCESS_TOKEN
   - Falta WHATSAPP_CLOUD_PHONE_NUMBER_ID
```

**Si Twilio está configurado (fallback):**
```
[WhatsAppService] ✅ Twilio configurado correctamente
```

### 2. Verificar Variables de Entorno

Asegúrate de tener estas variables en tu `.env` o en Render:

#### Para WhatsApp Cloud API (Recomendado):
```env
WHATSAPP_CLOUD_ACCESS_TOKEN=tu_token_aqui
WHATSAPP_CLOUD_PHONE_NUMBER_ID=tu_phone_id_aqui
DEFAULT_COUNTRY_CODE=+56  # Ajusta según tu país
```

#### Para Twilio (Fallback):
```env
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Probar el Endpoint de Prueba

Usa el endpoint de prueba para diagnosticar:

```bash
POST /api/users/me/emergency-contacts/:contactId/test-whatsapp
```

**Respuesta exitosa:**
```json
{
  "message": "Mensaje de prueba de WhatsApp enviado exitosamente",
  "service": "WhatsApp Cloud API (Meta)",
  "contact": {
    "_id": "...",
    "name": "Contacto",
    "phone": "+56912345678"
  },
  "messageId": "wamid.xxx",
  "status": "sent"
}
```

**Si hay error, verás:**
```json
{
  "message": "Error específico",
  "service": "WhatsApp Cloud API (Meta)",
  "error": "Descripción del error",
  "errorCode": 131026,
  "details": {...}
}
```

### 4. Revisar Logs del Servidor

Cuando intentas enviar un mensaje, revisa los logs:

**Logs exitosos:**
```
[WhatsAppCloudService] 📤 Enviando mensaje a +56912345678 (URL: https://graph.facebook.com/v18.0/xxx/messages)
[WhatsAppCloudService] ✅ Mensaje enviado exitosamente. MessageId: wamid.xxx
[EmergencyAlertService] ✅ WhatsApp enviado a Contacto (+56912345678)
```

**Logs con error:**
```
[WhatsAppCloudService] ❌ Error 400: {
  code: 131026,
  type: "OAuthException",
  message: "El número no está registrado en WhatsApp"
}
[EmergencyAlertService] ⚠️ WhatsApp no enviado a Contacto: El número no está registrado en WhatsApp
```

## 🐛 Errores Comunes y Soluciones

### Error: "WhatsApp Cloud API no configurado"

**Causa:** Faltan variables de entorno

**Solución:**
1. Verifica que `WHATSAPP_CLOUD_ACCESS_TOKEN` esté configurado
2. Verifica que `WHATSAPP_CLOUD_PHONE_NUMBER_ID` esté configurado
3. Reinicia el servidor después de agregar las variables

### Error: "Token de acceso inválido o expirado" (Código 190)

**Causa:** El token de acceso expiró o es inválido

**Solución:**
1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Genera un nuevo token de acceso
3. Actualiza `WHATSAPP_CLOUD_ACCESS_TOKEN` en las variables de entorno
4. Reinicia el servidor

### Error: "El número no está registrado en WhatsApp" (Código 131026)

**Causa:** El número de teléfono no tiene WhatsApp activo

**Solución:**
1. Verifica que el número tenga WhatsApp instalado y activo
2. Asegúrate de que el número esté en formato internacional (+56912345678)
3. Prueba con otro número que sepas que tiene WhatsApp

### Error: "Número de teléfono inválido" (Código 131047 o 131048)

**Causa:** El formato del número es incorrecto

**Solución:**
1. Asegúrate de que el número esté en formato internacional
2. Ejemplo correcto: `+56912345678`
3. Ejemplo incorrecto: `912345678` o `(9) 1234-5678`
4. Verifica que `DEFAULT_COUNTRY_CODE` esté configurado correctamente

### Error: "Límite de mensajes alcanzado" (Código 80007)

**Causa:** Has alcanzado el límite de 1,000 conversaciones/mes gratis

**Solución:**
1. Espera al siguiente mes
2. O actualiza a un plan de pago en Meta Business

### Error: "Parámetros inválidos" (Código 100)

**Causa:** El formato del mensaje o los parámetros son incorrectos

**Solución:**
1. Verifica que el mensaje no esté vacío
2. Verifica que el `PHONE_NUMBER_ID` sea correcto
3. Revisa los logs para más detalles

## 🔄 Verificar que el Servicio Está Funcionando

### Opción 1: Usar el Endpoint de Prueba

```bash
curl -X POST https://tu-api.com/api/users/me/emergency-contacts/:contactId/test-whatsapp \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json"
```

### Opción 2: Revisar los Logs al Enviar una Alerta Real

Cuando se detecta una crisis, revisa los logs:
- Si WhatsApp Cloud API está configurado, intentará usarlo primero
- Si falla, intentará con Twilio (si está configurado)
- Si ambos fallan, solo se enviará email

## 📝 Checklist de Verificación

- [ ] Variables de entorno configuradas correctamente
- [ ] Token de acceso válido y no expirado
- [ ] Phone Number ID correcto
- [ ] Número de teléfono en formato internacional
- [ ] El número tiene WhatsApp activo
- [ ] No se ha alcanzado el límite de mensajes
- [ ] Servidor reiniciado después de cambiar variables
- [ ] Logs del servidor revisados

## 🆘 Si Nada Funciona

1. **Verifica la configuración de Meta Business:**
   - Ve a [Meta for Developers](https://developers.facebook.com/)
   - Verifica que tu aplicación esté activa
   - Verifica que WhatsApp esté habilitado
   - Verifica que el número esté verificado

2. **Prueba con Twilio como alternativa:**
   - Configura las variables de Twilio
   - El sistema usará Twilio automáticamente si Cloud API no está configurado

3. **Revisa los logs completos:**
   - Busca errores específicos en los logs
   - Copia el error completo para investigar

4. **Contacta soporte:**
   - Si el error persiste, comparte los logs completos
   - Incluye el código de error específico
   - Incluye el formato del número que estás intentando usar

## 📚 Recursos

- [Guía de configuración de WhatsApp Cloud API](./WHATSAPP_CLOUD_API_SETUP.md)
- [Documentación oficial de WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Explorador de Graph API](https://developers.facebook.com/tools/explorer/)

