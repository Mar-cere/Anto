# 📱 WhatsApp Message Templates - Solución para Error 63016

## ⚠️ Problema: Error 63016

Si ves este error:
```
Error 63016: Failed to send freeform message because you are outside the allowed window. 
If you are using WhatsApp, please use a Message Template.
```

**Significado:** WhatsApp Business API solo permite enviar mensajes libres (freeform) dentro de una **ventana de 24 horas** después de la última interacción del usuario. Fuera de esa ventana, **debes usar Message Templates aprobadas**.

## 🎯 Solución: Usar Message Templates

### ¿Qué son Message Templates?

Los Message Templates son mensajes pre-aprobados por WhatsApp que puedes enviar en cualquier momento, incluso fuera de la ventana de 24 horas. Son ideales para:
- Alertas de emergencia
- Notificaciones importantes
- Mensajes de prueba
- Recordatorios

### Ventana de 24 Horas

| Situación | Puedes Enviar |
|-----------|---------------|
| Usuario envió mensaje hace < 24h | ✅ Mensajes libres (freeform) |
| Usuario envió mensaje hace > 24h | ❌ Solo Message Templates |
| Primera vez enviando al usuario | ❌ Solo Message Templates |

## 📋 Configurar Message Templates en Twilio

### Paso 1: Crear Template en Twilio

1. Ve a [Twilio Console](https://console.twilio.com)
2. Ve a **Messaging** > **Content Templates** (o **Message Templates**)
3. Click en **Create Template** (Crear Template)
4. Selecciona **WhatsApp** como canal

### Paso 2: Configurar el Template

**Para Alertas de Emergencia:**

**Nombre del Template:** `emergency_alert` (o el que prefieras)

**Categoría:** `UTILITY` o `MARKETING` (según tu caso de uso)

**Idioma:** `Spanish (es)` o `English (en)`

**Cuerpo del Mensaje:**
```
🚨 Alerta de {{1}}

{{2}} necesita apoyo inmediato.

Nivel de riesgo: {{3}}

Por favor, contacta a {{2}} lo antes posible.

---
Este es un mensaje automático de {{1}}
```

**Variables:**
- `{{1}}` = Nombre de la app (ej: "Anto")
- `{{2}}` = Nombre del usuario
- `{{3}}` = Nivel de riesgo (ej: "Alto", "Medio")

**Para Mensajes de Prueba:**

**Nombre del Template:** `test_message`

**Cuerpo del Mensaje:**
```
🧪 [PRUEBA] Alerta de {{1}}

Esta es una prueba del sistema de alertas. {{2}} está verificando que el sistema funciona correctamente.

No hay emergencia real.

---
Este es un mensaje automático de {{1}}
```

**Variables:**
- `{{1}}` = Nombre de la app
- `{{2}}` = Nombre del usuario

### Paso 3: Enviar para Aprobación

1. Revisa el template cuidadosamente
2. Click en **Submit for Approval** (Enviar para Aprobación)
3. WhatsApp revisará el template (puede tardar 24-48 horas)
4. Una vez aprobado, recibirás una notificación

### Paso 4: Obtener el Content SID

Una vez aprobado:
1. Ve a **Content Templates**
2. Encuentra tu template aprobado
3. Copia el **Content SID** (formato: `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## 🔧 Configurar en el Backend

Agrega estas variables de entorno:

```env
# Message Templates (Content SIDs)
TWILIO_WHATSAPP_EMERGENCY_TEMPLATE=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_TEST_TEMPLATE=HXyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

**Nota:** Los Content SIDs empiezan con `HX` y son diferentes de los Message SIDs (que empiezan con `SM`).

## 🚀 Cómo Funciona

El sistema automáticamente:

1. **Intenta enviar mensaje libre** primero
2. **Si falla con error 63016**, intenta usar el template configurado
3. **Si no hay template configurado**, devuelve el error con instrucciones

### Ejemplo de Flujo

```
1. Usuario intenta enviar mensaje de prueba
2. Sistema intenta mensaje libre → Error 63016 (fuera de ventana)
3. Sistema detecta error 63016
4. Sistema intenta con TEST_MESSAGE_TEMPLATE
5. ✅ Mensaje enviado exitosamente
```

## 📝 Variables de Template

Los templates pueden tener variables dinámicas:

- `{{1}}`, `{{2}}`, `{{3}}`, etc. = Variables de texto
- `{{1}}` = Primer parámetro
- `{{2}}` = Segundo parámetro
- etc.

**Ejemplo de uso:**
```javascript
// Template: "Hola {{1}}, tu pedido {{2}} está listo"
// Parámetros: ["Juan", "#12345"]
// Resultado: "Hola Juan, tu pedido #12345 está listo"
```

## ⚠️ Limitaciones

1. **Aprobación requerida:** Los templates deben ser aprobados por WhatsApp
2. **Tiempo de aprobación:** 24-48 horas típicamente
3. **Formato estricto:** Los templates deben seguir las políticas de WhatsApp
4. **Sin emojis complejos:** Algunos emojis pueden no ser aprobados
5. **Sin URLs dinámicas:** Las URLs deben estar pre-aprobadas en el template

## 🔍 Verificar Estado del Template

Puedes verificar el estado de tus templates en:
- Twilio Console > Messaging > Content Templates
- Estados: `Draft`, `Pending`, `Approved`, `Rejected`

## 📚 Recursos

- [Twilio Content Templates](https://www.twilio.com/docs/content/whatsapp)
- [WhatsApp Message Templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates)
- [Políticas de WhatsApp para Templates](https://www.twilio.com/docs/content/whatsapp-policy)

## 💡 Recomendaciones

1. **Crea templates genéricos:** Que puedan usarse en múltiples situaciones
2. **Mantén mensajes claros:** WhatsApp rechaza templates confusos o engañosos
3. **Usa variables sabiamente:** No abuses de las variables
4. **Prueba antes de aprobar:** Revisa bien el template antes de enviarlo
5. **Ten templates de respaldo:** Por si uno es rechazado

## ✅ Checklist

- [ ] Template creado en Twilio Console
- [ ] Template enviado para aprobación
- [ ] Template aprobado por WhatsApp
- [ ] Content SID copiado
- [ ] Variables de entorno configuradas
- [ ] Servidor reiniciado
- [ ] Prueba realizada exitosamente

