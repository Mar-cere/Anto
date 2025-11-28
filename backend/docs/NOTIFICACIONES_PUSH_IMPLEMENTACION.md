# Sistema de Notificaciones Push - Implementación Completa

## 📋 Resumen

Se ha implementado un sistema completo de notificaciones push para alertar a los usuarios sobre crisis, seguimientos y recordatorios.

---

## ✅ Componentes Implementados

### Backend

#### 1. Servicio de Notificaciones Push
**Archivo:** `backend/services/pushNotificationService.js`

**Funcionalidades:**
- ✅ Envío de notificaciones push usando Expo Push Notifications
- ✅ Validación de tokens push
- ✅ Métodos específicos por tipo de notificación:
  - `sendCrisisWarning()` - Nivel WARNING
  - `sendCrisisMedium()` - Nivel MEDIUM
  - `sendCrisisHigh()` - Nivel HIGH
  - `sendFollowUp()` - Seguimientos post-crisis
  - `sendTechniqueReminder()` - Recordatorios de técnicas
  - `sendProgressPositive()` - Progreso positivo
- ✅ Envío masivo de notificaciones (`sendBulkNotifications()`)
- ✅ Configuración automática de canales Android
- ✅ Prioridades y sonidos según tipo

#### 2. Rutas de Notificaciones
**Archivo:** `backend/routes/notificationRoutes.js`

**Endpoints:**
- ✅ `POST /api/notifications/push-token` - Registrar token push
- ✅ `DELETE /api/notifications/push-token` - Eliminar token push
- ✅ `GET /api/notifications/push-token` - Estado del token

#### 3. Modelo User Actualizado
**Archivo:** `backend/models/User.js`

**Campos agregados:**
- ✅ `pushToken` - Token push del dispositivo
- ✅ `pushTokenUpdatedAt` - Fecha de última actualización

#### 4. Integración con Sistema de Crisis

**Archivo:** `backend/services/crisisFollowUpService.js`
- ✅ Envía notificaciones push en seguimientos post-crisis
- ✅ Calcula horas desde la crisis
- ✅ Mensajes personalizados según tiempo transcurrido

**Archivo:** `backend/routes/chatRoutes.js`
- ✅ Envía notificaciones push cuando se detecta crisis:
  - WARNING → `sendCrisisWarning()`
  - MEDIUM → `sendCrisisMedium()`
  - HIGH → `sendCrisisHigh()`

---

### Frontend

#### 1. Servicio de Notificaciones Push
**Archivo:** `frontend/src/services/pushNotificationService.js`

**Funcionalidades:**
- ✅ Registro de token push
- ✅ Envío automático de token al backend
- ✅ Configuración de canales Android
- ✅ Manejo de permisos
- ✅ Listeners para notificaciones recibidas
- ✅ Gestión de estado del token

**Funciones principales:**
- `registerForPushNotifications()` - Registra dispositivo
- `sendTokenToBackend()` - Envía token al servidor
- `getStoredPushToken()` - Obtiene token almacenado
- `removePushToken()` - Elimina token (logout)
- `setupNotificationListeners()` - Configura listeners
- `areNotificationsEnabled()` - Verifica permisos
- `requestNotificationPermissions()` - Solicita permisos

#### 2. Integración en Pantallas

**DashScreen.js:**
- ✅ Registra token push automáticamente al cargar
- ✅ No bloquea la carga si falla

**SignInScreen.js:**
- ✅ Registra token push después del login exitoso
- ✅ No bloquea el login si falla

**SettingsScreen.js:**
- ✅ Toggle para habilitar/deshabilitar notificaciones push
- ✅ Indicador de estado del token (Registrado/No registrado/Error)
- ✅ Descripción clara de la funcionalidad
- ✅ Alertas informativas al activar/desactivar

---

## 🔧 Configuración Requerida

### 1. Dependencias

**Backend:**
```bash
cd backend
npm install expo-server-sdk
```
✅ Ya está en `package.json` (versión 4.0.0)

**Frontend:**
✅ `expo-notifications` ya está instalado

### 2. Variables de Entorno

**Frontend:**
- Agregar `EXPO_PUBLIC_PROJECT_ID` en `.env` o `app.json`
- Obtener el Project ID desde: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/settings

**Backend:**
- No requiere variables adicionales (usa Expo Push Notification API directamente)

### 3. Permisos

**iOS:**
- Se solicitan automáticamente al registrar
- Requiere configuración en `Info.plist` para producción

**Android:**
- Se solicitan automáticamente al registrar
- Canales configurados automáticamente

---

## 📱 Flujo de Funcionamiento

### 1. Registro de Token
1. Usuario inicia sesión o carga el dashboard
2. Se solicita permiso de notificaciones
3. Se obtiene token push de Expo
4. Token se guarda localmente en AsyncStorage
5. Token se envía al backend y se almacena en el modelo User

### 2. Detección de Crisis
1. Usuario envía mensaje en el chat
2. Sistema detecta nivel de riesgo (WARNING/MEDIUM/HIGH)
3. Se envía notificación push al usuario según nivel
4. Si es MEDIUM/HIGH, también se envían alertas a contactos de emergencia

### 3. Seguimiento Post-Crisis
1. Sistema programa seguimientos automáticos
2. Al llegar el momento del seguimiento:
   - Verifica si usuario ha estado activo
   - Si no está activo, envía notificación push
   - Mensaje personalizado según horas transcurridas

---

## 🎯 Tipos de Notificaciones

### Crisis WARNING
- **Título:** "⚠️ Cuidado con tu bienestar"
- **Mensaje:** "Detectamos que estás pasando por un momento difícil. ¿Quieres que te ayudemos con algunas técnicas de regulación?"
- **Canal:** `anto-crisis`
- **Prioridad:** Alta

### Crisis MEDIUM
- **Título:** "🔔 Apoyo disponible"
- **Mensaje:** "Estamos aquí para ti. Hemos notificado a tus contactos de emergencia. ¿Quieres conversar?"
- **Canal:** `anto-crisis`
- **Prioridad:** Alta

### Crisis HIGH
- **Título:** "🚨 Apoyo inmediato"
- **Mensaje:** "Tu seguridad es importante. Hemos notificado a tus contactos de emergencia. Estamos aquí para ayudarte."
- **Canal:** `anto-crisis`
- **Prioridad:** Alta

### Seguimiento Post-Crisis
- **Título:** "💙 ¿Cómo te sientes ahora?"
- **Mensaje:** Personalizado según horas transcurridas
- **Canal:** `anto-followup`
- **Prioridad:** Alta

### Recordatorio de Técnica
- **Título:** "🧘 Técnica de regulación"
- **Mensaje:** Personalizado según técnica y emoción
- **Canal:** `anto-reminders`
- **Prioridad:** Normal

### Progreso Positivo
- **Título:** "🎉 ¡Buen progreso!"
- **Mensaje:** Personalizado según logro
- **Canal:** `anto-reminders`
- **Prioridad:** Normal

---

## 🔍 Testing

### Probar Registro de Token
1. Iniciar sesión en la app
2. Ir a Settings → Notificaciones Push
3. Activar el toggle
4. Verificar que el estado muestre "✅ Registrado"

### Probar Notificación de Crisis
1. Enviar mensaje en el chat que active detección de crisis
2. Verificar que se reciba notificación push
3. Verificar que el mensaje sea apropiado según nivel de riesgo

### Probar Seguimiento
1. Generar una crisis
2. Esperar al momento programado del seguimiento
3. Verificar que se reciba notificación si el usuario no está activo

---

## 📝 Notas Importantes

### Expo Go vs Development Build
- ⚠️ **Expo Go:** Las notificaciones push remotas NO funcionan
- ✅ **Development Build:** Requerido para notificaciones push remotas
- ✅ **Build de Producción:** Funciona completamente

### Project ID
- Es necesario configurar `EXPO_PUBLIC_PROJECT_ID` para obtener tokens push
- Se puede obtener desde el dashboard de Expo

### Tokens Inválidos
- El sistema valida automáticamente los tokens
- Si un token es inválido, se registra en logs pero no bloquea el flujo

### Fallbacks
- Si falla el envío de notificación push, no bloquea el flujo principal
- Los errores se registran en logs para debugging

---

## 🚀 Próximos Pasos Sugeridos

1. **Configurar Project ID de Expo**
   - Agregar en variables de entorno
   - O en `app.json`

2. **Testing en Dispositivo Real**
   - Crear development build
   - Probar registro de token
   - Probar recepción de notificaciones

3. **Mejoras Futuras**
   - Notificaciones de recordatorios de técnicas
   - Notificaciones de progreso positivo
   - Configuración granular de preferencias
   - Historial de notificaciones enviadas

---

## ✅ Estado de Implementación

- ✅ Backend completo
- ✅ Frontend completo
- ✅ Integración con crisis
- ✅ Integración con seguimientos
- ✅ UI en Settings
- ⚠️ Pendiente: Configurar Project ID de Expo
- ⚠️ Pendiente: Testing en dispositivo real

---

**Fecha de implementación:** Noviembre 2025  
**Versión:** 1.0.0

