# 🔧 Troubleshooting: WhatsApp No Funciona (Twilio)

## 🔍 Pasos para Diagnosticar

### 1. Verificar Configuración

Revisa los logs del servidor al iniciar. Deberías ver:

**Si Twilio está configurado:**
```
[WhatsAppService] ✅ Twilio configurado correctamente
```

**Si NO está configurado:**
```
[WhatsAppService] ⚠️ Twilio no configurado, WhatsApp deshabilitado
```

### 2. Verificar Variables de Entorno

Asegúrate de tener estas variables en tu `.env` o en Render:

```env
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
DEFAULT_COUNTRY_CODE=+56  # Ajusta según tu país
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
  "service": "Twilio WhatsApp",
  "contact": {
    "_id": "...",
    "name": "Contacto",
    "phone": "+56912345678"
  },
  "messageId": "SMxxxxx",
  "status": "sent"
}
```

**Si hay error, verás:**
```json
{
  "message": "Error específico",
  "service": "Twilio WhatsApp",
  "error": "Descripción del error"
}
```

### 4. Revisar Logs del Servidor

Cuando intentas enviar un mensaje, revisa los logs:

**Logs exitosos:**
```
[WhatsAppService] 📤 Enviando mensaje a whatsapp:+56912345678 desde whatsapp:+14155238886
[WhatsAppService] ✅ Mensaje enviado exitosamente. SID: SMxxxxx, Status: sent
[EmergencyAlertService] ✅ WhatsApp enviado a Contacto (+56912345678)
```

**Logs con error:**
```
[WhatsAppService] ❌ Error enviando mensaje: El número no está registrado en WhatsApp
[EmergencyAlertService] ⚠️ WhatsApp no enviado a Contacto: El número no está registrado en WhatsApp
```

## 🐛 Errores Comunes y Soluciones

### Error: "Twilio no configurado"

**Causa:** Faltan variables de entorno

**Solución:**
1. Verifica que `TWILIO_ACCOUNT_SID` esté configurado
2. Verifica que `TWILIO_AUTH_TOKEN` esté configurado
3. Verifica que `TWILIO_WHATSAPP_NUMBER` esté configurado
4. Reinicia el servidor después de agregar las variables

### Error: "El número no está registrado en WhatsApp" (Código 21608)

**Causa:** El número de teléfono no tiene WhatsApp activo o no está verificado en el sandbox

**Solución:**
1. Verifica que el número tenga WhatsApp instalado y activo
2. Si estás en modo sandbox, verifica el número en Twilio:
   - Ve a Twilio Console > Messaging > Try it out
   - Agrega el número a la lista de números verificados
3. Asegúrate de que el número esté en formato internacional (+56912345678)

### Error: "Número no autorizado (sandbox: solo números verificados)" (Código 21408)

**Causa:** Estás en modo sandbox y el número no está verificado

**Solución:**
1. Ve a Twilio Console > Messaging > Try it out
2. En la sección de WhatsApp Sandbox, agrega el número
3. Verifica el número siguiendo las instrucciones de Twilio
4. O solicita aprobación para producción para enviar a cualquier número

### Error: "Número de teléfono inválido" (Código 21211)

**Causa:** El formato del número es incorrecto

**Solución:**
1. Asegúrate de que el número esté en formato internacional
2. Ejemplo correcto: `+56912345678`
3. Ejemplo incorrecto: `912345678` o `(9) 1234-5678`
4. Verifica que `DEFAULT_COUNTRY_CODE` esté configurado correctamente

### Error: "Número no válido para WhatsApp" (Código 21614)

**Causa:** El número no es válido para WhatsApp

**Solución:**
1. Verifica que el número sea un número de teléfono válido
2. Asegúrate de que el número tenga WhatsApp activo
3. Prueba con otro número que sepas que funciona

## 🔄 Verificar que el Servicio Está Funcionando

### Opción 1: Usar el Endpoint de Prueba

```bash
curl -X POST https://tu-api.com/api/users/me/emergency-contacts/:contactId/test-whatsapp \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json"
```

### Opción 2: Revisar los Logs al Enviar una Alerta Real

Cuando se detecta una crisis, revisa los logs:
- Si Twilio está configurado, intentará enviar WhatsApp
- Si falla, solo se enviará email (no es crítico)

## 📝 Checklist de Verificación

- [ ] Variables de entorno configuradas correctamente
- [ ] Account SID válido
- [ ] Auth Token válido
- [ ] WhatsApp Number en formato correcto (`whatsapp:+14155238886`)
- [ ] Número de teléfono en formato internacional
- [ ] El número tiene WhatsApp activo
- [ ] Número verificado en Twilio (si estás en sandbox)
- [ ] Servidor reiniciado después de cambiar variables
- [ ] Logs del servidor revisados

## 🆘 Si Nada Funciona

1. **Verifica la configuración de Twilio:**
   - Ve a [Twilio Console](https://console.twilio.com)
   - Verifica que tu cuenta esté activa
   - Verifica que WhatsApp esté habilitado
   - Verifica que el número esté configurado correctamente

2. **Revisa los logs completos:**
   - Busca errores específicos en los logs
   - Copia el error completo para investigar

3. **Contacta soporte:**
   - Si el error persiste, comparte los logs completos
   - Incluye el código de error específico
   - Incluye el formato del número que estás intentando usar

## 📚 Recursos

- [Guía de configuración de Twilio WhatsApp](./WHATSAPP_SETUP.md)
- [Documentación oficial de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Twilio Console](https://console.twilio.com)
