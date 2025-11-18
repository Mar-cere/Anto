# Mejoras para el Sistema de Contactos de Emergencia

Este documento contiene mejoras propuestas para el sistema de contactos de emergencia, organizadas por prioridad y complejidad de implementación.

---

## 🔴 PRIORIDAD ALTA - Mejoras Críticas

### 1. **Notificaciones Push al Usuario** ⚙️ Complejidad: 🟡 MEDIA
**Problema:** El usuario no recibe notificación inmediata cuando se envía una alerta a sus contactos.

**Solución:**
- Enviar notificación push al usuario cuando se detecta riesgo y se envían alertas
- Mensaje: "Hemos detectado una situación de riesgo y hemos notificado a tus contactos de emergencia"
- Esto ayuda al usuario a saber que el sistema está activo

**Archivos a modificar:**
- `backend/services/emergencyAlertService.js`: Agregar envío de notificación push
- `frontend/src/utils/notifications.js`: Agregar función para recibir notificaciones de alertas
- `frontend/src/screens/ChatScreen.js` o `DashScreen.js`: Manejar notificaciones de alertas

**Implementación:**
```javascript
// En emergencyAlertService.js después de enviar alertas
if (anySent) {
  // Enviar notificación push al usuario
  await sendPushNotification(userId, {
    title: 'Alerta de Emergencia Enviada',
    body: `Hemos notificado a ${successfulSends} contacto(s) de emergencia`,
    data: { type: 'emergency_alert', riskLevel }
  });
}
```

---

### 2. **Historial de Alertas Enviadas** ⚙️ Complejidad: 🟡 MEDIA
**Problema:** No hay registro de cuándo y a quién se enviaron alertas.

**Solución:**
- Crear modelo `EmergencyAlert` para registrar cada alerta enviada
- Guardar: fecha, nivel de riesgo, contactos notificados, estado de envío
- Mostrar historial en Settings para transparencia

**Archivos a crear/modificar:**
- `backend/models/EmergencyAlert.js`: Nuevo modelo
- `backend/services/emergencyAlertService.js`: Guardar registro de alertas
- `backend/routes/userRoutes.js`: Endpoint GET `/api/users/me/emergency-alerts`
- `frontend/src/screens/SettingsScreen.js`: Sección de historial de alertas

**Schema propuesto:**
```javascript
{
  userId: ObjectId,
  riskLevel: String, // 'MEDIUM' | 'HIGH'
  sentAt: Date,
  contacts: [{
    contactId: ObjectId,
    email: String,
    sent: Boolean,
    error: String
  }],
  messageContent: String (opcional, censurado),
  totalSent: Number,
  successfulSends: Number
}
```

---

### 3. **Validación de Email de Contactos** ⚙️ Complejidad: 🟢 BAJA
**Problema:** No se verifica que el email del contacto sea válido antes de guardarlo.

**Solución:**
- Agregar verificación de email al guardar contacto
- Enviar email de prueba opcional al agregar contacto
- Mostrar advertencia si el email no responde

**Archivos a modificar:**
- `backend/routes/userRoutes.js`: Agregar verificación de email
- `frontend/src/components/EmergencyContactsModal.js`: Opción de "Enviar email de prueba"

---

## 🟡 PRIORIDAD MEDIA - Mejoras Importantes

### 4. **Edición Individual de Contactos** ⚙️ Complejidad: 🟡 MEDIA
**Problema:** El modal actual solo permite agregar, no editar contactos existentes.

**Solución:**
- Crear modal de edición para contactos individuales
- Permitir editar nombre, email, teléfono, relación
- Validar que el nuevo email no esté duplicado

**Archivos a crear/modificar:**
- `frontend/src/components/EditEmergencyContactModal.js`: Nuevo componente
- `frontend/src/screens/SettingsScreen.js`: Agregar botón "Editar" en cada contacto
- `backend/routes/userRoutes.js`: Ya existe PUT endpoint, solo falta frontend

---

### 5. **SMS como Canal Alternativo** ⚙️ Complejidad: 🟠 ALTA
**Problema:** Solo se envían emails, que pueden no ser revisados inmediatamente.

**Solución:**
- Integrar servicio de SMS (Twilio, AWS SNS, etc.)
- Permitir al usuario elegir: Email, SMS, o ambos
- SMS más rápido para situaciones críticas

**Archivos a crear/modificar:**
- `backend/services/smsService.js`: Nuevo servicio
- `backend/services/emergencyAlertService.js`: Agregar envío de SMS
- `backend/models/User.js`: Agregar preferencia de canal (email/sms/ambos)
- `frontend/src/components/EmergencyContactsModal.js`: Checkbox para preferencia

**Servicios recomendados:**
- Twilio (más fácil de integrar)
- AWS SNS (más económico a escala)
- MessageBird (buena alternativa)

---

### 6. **Plantillas de Mensajes Personalizables** ⚙️ Complejidad: 🟡 MEDIA
**Problema:** El mensaje de alerta es genérico, no personalizable.

**Solución:**
- Permitir al usuario personalizar el mensaje base
- Variables disponibles: {userName}, {riskLevel}, {date}
- Mantener estructura profesional pero personalizada

**Archivos a modificar:**
- `backend/models/User.js`: Agregar campo `emergencyAlertTemplate`
- `backend/services/emergencyAlertService.js`: Usar template personalizado si existe
- `frontend/src/screens/SettingsScreen.js`: Editor de template

---

### 7. **Recordatorios Periódicos** ⚙️ Complejidad: 🟢 BAJA
**Problema:** El usuario puede olvidar actualizar sus contactos.

**Solución:**
- Enviar recordatorio mensual para verificar contactos
- Notificación: "¿Tus contactos de emergencia están actualizados?"
- Opción de "Recordarme más tarde" o "Ya están actualizados"

**Archivos a modificar:**
- `backend/services/notificationService.js`: Agregar recordatorios
- `frontend/src/utils/notifications.js`: Manejar recordatorios

---

## 🟢 PRIORIDAD BAJA - Mejoras Opcionales

### 8. **Estadísticas de Alertas** ⚙️ Complejidad: 🟡 MEDIA
**Problema:** No hay visibilidad de cuántas alertas se han enviado.

**Solución:**
- Dashboard de estadísticas en Settings
- Gráficos: alertas por mes, nivel de riesgo, contactos más notificados
- Útil para entender patrones

**Archivos a crear/modificar:**
- `backend/routes/userRoutes.js`: Endpoint de estadísticas
- `frontend/src/components/EmergencyAlertsStats.js`: Nuevo componente
- `frontend/src/screens/SettingsScreen.js`: Sección de estadísticas

---

### 9. **Prueba de Alerta Manual** ⚙️ Complejidad: 🟢 BAJA
**Problema:** No hay forma de probar que las alertas funcionan.

**Solución:**
- Botón "Probar alerta" en Settings
- Envía alerta de prueba a todos los contactos
- Indica claramente que es una prueba

**Archivos a modificar:**
- `backend/routes/userRoutes.js`: Endpoint POST `/api/users/me/emergency-contacts/test`
- `frontend/src/screens/SettingsScreen.js`: Botón de prueba

---

### 10. **Integración con Contactos del Teléfono** ⚙️ Complejidad: 🟠 ALTA
**Problema:** El usuario debe escribir manualmente los datos del contacto.

**Solución:**
- Permitir importar contactos del teléfono
- Seleccionar de lista de contactos
- Pre-llenar nombre, email, teléfono

**Archivos a crear/modificar:**
- `frontend/src/utils/contacts.js`: Nuevo util para acceder a contactos
- `frontend/src/components/EmergencyContactsModal.js`: Botón "Importar de contactos"
- Requiere permisos de contactos en `app.json`

**Librería recomendada:**
- `expo-contacts`: Para Expo
- `react-native-contacts`: Para React Native puro

---

### 11. **Notificaciones en Tiempo Real** ⚙️ Complejidad: 🟠 ALTA
**Problema:** Las alertas solo se envían cuando se detecta riesgo en el chat.

**Solución:**
- WebSockets o Server-Sent Events para notificaciones en tiempo real
- Notificar al usuario inmediatamente cuando se envía alerta
- Actualizar UI en tiempo real

**Archivos a crear/modificar:**
- `backend/services/websocketService.js`: Nuevo servicio
- `frontend/src/services/websocketClient.js`: Cliente WebSocket
- `frontend/src/screens/ChatScreen.js`: Integrar notificaciones en tiempo real

---

### 12. **Múltiples Idiomas en Alertas** ⚙️ Complejidad: 🟡 MEDIA
**Problema:** Las alertas solo están en español.

**Solución:**
- Detectar idioma del usuario
- Enviar alertas en el idioma preferido
- Soporte para español, inglés, portugués

**Archivos a modificar:**
- `backend/services/emergencyAlertService.js`: Detectar idioma del usuario
- `backend/constants/crisis.js`: Agregar traducciones
- `backend/models/User.js`: Ya tiene campo `preferences.language`

---

## 📊 Resumen de Prioridades

| # | Mejora | Prioridad | Complejidad | Impacto | ROI |
|---|--------|-----------|-------------|---------|-----|
| 1 | Notificaciones Push al Usuario | 🔴 ALTA | 🟡 MEDIA | Alto | ⭐⭐⭐⭐⭐ |
| 2 | Historial de Alertas | 🔴 ALTA | 🟡 MEDIA | Alto | ⭐⭐⭐⭐⭐ |
| 3 | Validación de Email | 🔴 ALTA | 🟢 BAJA | Medio | ⭐⭐⭐⭐ |
| 4 | Edición Individual | 🟡 MEDIA | 🟡 MEDIA | Medio | ⭐⭐⭐ |
| 5 | SMS como Canal Alternativo | 🟡 MEDIA | 🟠 ALTA | Alto | ⭐⭐⭐⭐ |
| 6 | Plantillas Personalizables | 🟡 MEDIA | 🟡 MEDIA | Bajo | ⭐⭐ |
| 7 | Recordatorios Periódicos | 🟡 MEDIA | 🟢 BAJA | Bajo | ⭐⭐⭐ |
| 8 | Estadísticas | 🟢 BAJA | 🟡 MEDIA | Bajo | ⭐⭐ |
| 9 | Prueba Manual | 🟢 BAJA | 🟢 BAJA | Bajo | ⭐⭐⭐ |
| 10 | Importar Contactos | 🟢 BAJA | 🟠 ALTA | Medio | ⭐⭐ |
| 11 | Tiempo Real | 🟢 BAJA | 🟠 ALTA | Alto | ⭐⭐⭐ |
| 12 | Múltiples Idiomas | 🟢 BAJA | 🟡 MEDIA | Bajo | ⭐⭐ |

---

## 📈 Matriz de Decisión: Prioridad vs Complejidad

```
COMPLEJIDAD
    │
ALTA│  [5] SMS          [10] Importar    [11] Tiempo Real
    │   🟡 MEDIA         🟢 BAJA          🟢 BAJA
    │
MEDIA│  [1] Push ⭐      [2] Historial ⭐  [4] Edición    [6] Plantillas
    │   🔴 ALTA          🔴 ALTA          🟡 MEDIA       🟡 MEDIA
    │
BAJA │  [3] Validación ⭐ [7] Recordatorios [9] Prueba
    │   🔴 ALTA          🟡 MEDIA          🟢 BAJA
    │
    └─────────────────────────────────────────────────────→ PRIORIDAD
         🔴 ALTA        🟡 MEDIA          🟢 BAJA
```

**Leyenda:**
- ⭐ = Alto ROI (Retorno de Inversión)
- 🔴 = Prioridad Alta
- 🟡 = Prioridad Media
- 🟢 = Prioridad Baja
- 🟠 = Complejidad Alta
- 🟡 = Complejidad Media
- 🟢 = Complejidad Baja

---

## 🎯 Matriz de Decisión: ROI (Retorno de Inversión)

### **Cuadrante 1: Alto Impacto, Baja Complejidad** ⭐⭐⭐⭐⭐ (HACER PRIMERO)
- ✅ **3. Validación de Email** - Fácil de implementar, mejora confiabilidad

### **Cuadrante 2: Alto Impacto, Media Complejidad** ⭐⭐⭐⭐⭐ (HACER SEGUNDO)
- ✅ **1. Notificaciones Push al Usuario** - Mejora experiencia del usuario
- ✅ **2. Historial de Alertas** - Transparencia y trazabilidad

### **Cuadrante 3: Alto Impacto, Alta Complejidad** ⭐⭐⭐⭐ (PLANIFICAR)
- ⚠️ **5. SMS como Canal Alternativo** - Requiere servicio externo
- ⚠️ **11. Tiempo Real** - Requiere WebSockets/SSE

### **Cuadrante 4: Medio Impacto, Baja Complejidad** ⭐⭐⭐ (HACER TERCERO)
- ✅ **7. Recordatorios Periódicos** - Mantiene datos actualizados
- ✅ **9. Prueba Manual** - Permite verificar funcionamiento

### **Cuadrante 5: Medio Impacto, Media Complejidad** ⭐⭐⭐ (CONSIDERAR)
- ✅ **4. Edición Individual** - Mejora UX
- ⚠️ **8. Estadísticas** - Nice to have
- ⚠️ **12. Múltiples Idiomas** - Expansión futura

### **Cuadrante 6: Bajo Impacto, Cualquier Complejidad** ⭐⭐ (OPCIONAL)
- ⚠️ **6. Plantillas Personalizables** - Funcionalidad avanzada
- ⚠️ **10. Importar Contactos** - Conveniencia adicional

---

## 🚀 Plan de Implementación Recomendado

### **Fase 1: Fundamentos (Sprint 1-2)** - ROI: ⭐⭐⭐⭐⭐
**Objetivo:** Mejoras críticas con bajo/medio esfuerzo

1. ✅ **Validación de Email** (Complejidad: 🟢 BAJA)
   - Tiempo estimado: 2-4 horas
   - Impacto: Alto en confiabilidad

2. ✅ **Notificaciones Push al Usuario** (Complejidad: 🟡 MEDIA)
   - Tiempo estimado: 4-6 horas
   - Impacto: Alto en experiencia del usuario

3. ✅ **Historial de Alertas** (Complejidad: 🟡 MEDIA)
   - Tiempo estimado: 6-8 horas
   - Impacto: Alto en transparencia

**Total Fase 1:** ~12-18 horas

---

### **Fase 2: Mejoras de UX (Sprint 3-4)** - ROI: ⭐⭐⭐
**Objetivo:** Mejorar la experiencia de usuario

4. ✅ **Edición Individual de Contactos** (Complejidad: 🟡 MEDIA)
   - Tiempo estimado: 4-6 horas
   - Impacto: Medio en usabilidad

5. ✅ **Recordatorios Periódicos** (Complejidad: 🟢 BAJA)
   - Tiempo estimado: 3-4 horas
   - Impacto: Bajo pero útil

6. ✅ **Prueba Manual de Alertas** (Complejidad: 🟢 BAJA)
   - Tiempo estimado: 2-3 horas
   - Impacto: Medio en confianza del usuario

**Total Fase 2:** ~9-13 horas

---

### **Fase 3: Funcionalidades Avanzadas (Sprint 5-6)** - ROI: ⭐⭐⭐⭐
**Objetivo:** Agregar capacidades avanzadas

7. ✅ **SMS como Canal Alternativo** (Complejidad: 🟠 ALTA)
   - Tiempo estimado: 12-16 horas
   - Impacto: Alto en efectividad
   - **Nota:** Requiere servicio externo (Twilio/AWS SNS)

8. ✅ **Plantillas Personalizables** (Complejidad: 🟡 MEDIA)
   - Tiempo estimado: 6-8 horas
   - Impacto: Bajo pero personalización

9. ✅ **Estadísticas de Alertas** (Complejidad: 🟡 MEDIA)
   - Tiempo estimado: 8-10 horas
   - Impacto: Bajo pero informativo

**Total Fase 3:** ~26-34 horas

---

### **Fase 4: Expansión y Optimización (Sprint 7+)** - ROI: ⭐⭐
**Objetivo:** Funcionalidades opcionales y expansión

10. ✅ **Integración con Contactos del Teléfono** (Complejidad: 🟠 ALTA)
    - Tiempo estimado: 10-12 horas
    - Impacto: Medio en conveniencia
    - **Nota:** Requiere permisos de contactos

11. ✅ **Notificaciones en Tiempo Real** (Complejidad: 🟠 ALTA)
    - Tiempo estimado: 16-20 horas
    - Impacto: Alto pero complejo
    - **Nota:** Requiere WebSockets/SSE

12. ✅ **Múltiples Idiomas** (Complejidad: 🟡 MEDIA)
    - Tiempo estimado: 8-10 horas
    - Impacto: Bajo pero expansión internacional

**Total Fase 4:** ~34-42 horas

---

## 📊 Resumen de Esfuerzo Total

| Fase | Horas Estimadas | Prioridad | ROI Promedio |
|------|----------------|-----------|--------------|
| Fase 1 | 12-18h | 🔴 ALTA | ⭐⭐⭐⭐⭐ |
| Fase 2 | 9-13h | 🟡 MEDIA | ⭐⭐⭐ |
| Fase 3 | 26-34h | 🟡 MEDIA | ⭐⭐⭐⭐ |
| Fase 4 | 34-42h | 🟢 BAJA | ⭐⭐ |
| **TOTAL** | **81-107h** | - | - |

**Recomendación:** Implementar Fase 1 y Fase 2 primero (21-31 horas total) para obtener el máximo ROI.

---

## 💡 Ideas Adicionales

- **Código de Verificación:** Enviar código al contacto para verificar que recibió la alerta
- **Respuesta del Contacto:** Permitir que el contacto responda confirmando que está al tanto
- **Alertas Escalonadas:** Si el primer contacto no responde, notificar al segundo
- **Geolocalización:** Incluir ubicación aproximada del usuario en alertas de alto riesgo
- **Modo Silencioso:** Permitir desactivar alertas temporalmente (vacaciones, etc.)
- **Contactos Temporales:** Agregar contactos solo para un período específico
- **Compartir con Profesionales:** Permitir agregar profesionales de salud mental como contactos especiales

---

¿Cuál de estas mejoras te gustaría implementar primero?

