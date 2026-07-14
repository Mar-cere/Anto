# Plan de Implementación: Feature #15 "Sesiones programadas"

**Fecha:** 14 julio 2026  
**Estado:** Planificación  
**Propuesta matriz:** #15 (Urg 3, Imp 4, Ret 5, Imp* 5, Costo B, Tiempo S, Q2)  

---

## 1. Executive Summary

**Objetivo:** Establecer recordatorios configurables tipo "tu espacio con Anto" en horarios fijos para ritualizar el uso terapéutico de la app, combatiendo abandono silencioso y mejorando retención D7/D30.

**Valor de negocio:**
- **Retención máxima (5/5):** Ancla hábito de uso regular vs. uso reactivo ocasional
- **Bajo costo/tiempo (B/S):** Notificaciones locales + persistencia ligera, ~1 sprint
- **Diferenciador:** Transforma Anto de "app consultada" a "ritual terapéutico"
- **Encaje:** Complementa #2 (focos), #55 (paráfrasis), #47 (narrativa cierre), #163 (agendar desde cierre)

**Alcance:**
- ✅ Configuración de horarios fijos (diarios/semanales) con copy terapéutico
- ✅ Notificaciones locales con deep link al chat/foco activo
- ✅ Gestión UI: activar/pausar/editar sesiones
- ✅ Telemetría: programadas vs. cumplidas, latencia respuesta, origen (orgánico vs. notif)
- ❌ **Fuera:** Ajuste dinámico basado en uso (eso sería #157 win-back), sincronización con calendario externo (#43), notificaciones push remotas (MVP solo locales)

---

## 2. Contexto Técnico Actual

### 2.1. Infraestructura de Notificaciones Existente

**Backend:**
- `backend/services/notifications/` — SendGrid emails, push pools (Expo Push Notifications)
- `backend/models/User.js` — `preferences.notifications` (push enabled/disabled)
- `backend/models/PushToken.js` — tokens Expo por dispositivo
- Rate limiting en push: `backend/middleware/createRateLimiter.js`

**Frontend:**
- `frontend/src/services/notificationService.js` — Expo Notifications API, permisos, scheduling local
- `frontend/src/contexts/NotificationContext.js` — estado de permisos
- `frontend/src/navigation/linking.js` — deep linking existente (open conversation, etc.)

**Gaps identificados:**
- ❌ No hay modelo para sesiones programadas recurrentes
- ❌ No hay UI para configurar horarios personalizados
- ❌ No hay telemetría para medir adherencia a sesiones programadas
- ❌ Copy de notificaciones no está diseñado para "ritual" (actualmente solo transaccional)

### 2.2. Modelo de Usuario y Preferencias

**Subdocumento `User.preferences`** (Mongoose):
```javascript
preferences: {
  notifications: {
    enabled: Boolean,
    emailEnabled: Boolean,
    pushEnabled: Boolean,
    // Nuevo para #15:
    scheduledSessions: {
      enabled: Boolean,
      sessions: [{
        id: String,          // UUID
        dayOfWeek: Number,   // 0-6 (domingo-sábado)
        time: String,        // HH:mm formato 24h
        isActive: Boolean,   // pausar sin eliminar
        label: String,       // opcional: "Sesión mañana", "Check-in noche"
        notificationId: String, // ID de notif local Expo
      }],
      lastNotificationAt: Date,
      pausedUntil: Date,   // "silenciar por N días"
    },
  },
  // ... resto
}
```

### 2.3. Notificaciones Locales (Expo)

**API disponible:**
- `Notifications.scheduleNotificationAsync()` — programar notificación local
- `Notifications.cancelScheduledNotificationAsync(id)` — cancelar
- `Notifications.getAllScheduledNotificationsAsync()` — listar programadas
- Triggers: `daily`, `weekly`, `seconds` (absoluto/relativo)

**Limitaciones:**
- iOS: Max ~64 notificaciones locales programadas simultáneas
- Android: Sin límite práctico, pero batería/permisos
- Requiere foreground para re-programar si se cambia zona horaria (edge case)

---

## 3. Fases de Implementación

### **Fase 1: Backend — Modelo + API CRUD Sesiones Programadas**

**Objetivos:**
- Persistir configuración de sesiones en `User.preferences.notifications.scheduledSessions`
- Endpoints REST para crear, listar, actualizar, pausar, eliminar sesiones
- Validación: horarios válidos, límite de sesiones activas (ej. max 7), rate limiting
- i18n: ApiCopy ES/EN para respuestas

**Entregables:**
1. **Schema Mongoose** (modificar `User.js`):
   - `preferences.notifications.scheduledSessions` con validadores:
     - `dayOfWeek`: 0-6
     - `time`: regex `HH:mm` (00:00 - 23:59)
     - `sessions` array max length 10
     - `pausedUntil` <= now + 90 días
2. **API REST** (`backend/routes/scheduledSessionsRoutes.js`):
   - `GET /api/scheduled-sessions` — listar sesiones del usuario
   - `POST /api/scheduled-sessions` — crear sesión (Joi: dayOfWeek, time, label opcional)
   - `PUT /api/scheduled-sessions/:sessionId` — actualizar (time, isActive, label)
   - `DELETE /api/scheduled-sessions/:sessionId` — eliminar (soft: `isActive=false` o hard delete)
   - `POST /api/scheduled-sessions/pause` — pausar todas por N días (body: `pauseDays`)
   - `POST /api/scheduled-sessions/resume` — reactivar antes de `pausedUntil`
3. **Schemas Joi** (`backend/utils/scheduledSessionsSchemas.js`):
   - `createSessionSchema`: `dayOfWeek` (0-6), `time` (HH:mm), `label` (max 50 chars)
   - `updateSessionSchema`: id + campos editables
   - `pauseSchema`: `pauseDays` (1-90)
4. **ApiCopy i18n** (`backend/utils/scheduledSessionsApiCopy.js`):
   - Mensajes ES/EN: sesión creada, límite alcanzado, horario inválido, sesión no encontrada
5. **Rate limiting:** 10 req/min por usuario (evitar spam de configuración)

**Tests:**
- Unit: validación Joi, schemas Mongoose, límites
- Integration: CRUD completo, pausar/reanudar, casos edge (sesión duplicada, pausedUntil pasado)
- i18n: paridad ES/EN

---

### **Fase 2: Frontend — UI Configuración + Gestión Sesiones**

**Objetivos:**
- Pantalla `ScheduledSessionsScreen` en Ajustes para configurar horarios
- Crear/editar/pausar sesiones con UX nativa iOS/Android
- Scheduling de notificaciones locales sincronizado con backend
- Diseño "glass/chrome" adherente a Anto UI system

**Entregables:**
1. **Servicio API** (`frontend/src/services/scheduledSessionsService.js`):
   - `fetchScheduledSessions()` — GET lista
   - `createScheduledSession(dayOfWeek, time, label)` — POST
   - `updateScheduledSession(sessionId, updates)` — PUT
   - `deleteScheduledSession(sessionId)` — DELETE
   - `pauseAllSessions(pauseDays)` — POST pause
   - `resumeAllSessions()` — POST resume
   - Sanitización y validación client-side (time format, day range)
2. **Screen** (`frontend/src/screens/scheduledSessions/ScheduledSessionsScreen.js`):
   - Header: "Sesiones programadas" + botón "Agregar"
   - Lista de sesiones agrupadas por día (L-D) con pills
   - Cada sesión: hora, label opcional, switch activo/inactivo, botones editar/eliminar
   - Estado vacío: ilustración + copy "Crea tu primer espacio con Anto"
   - Botón "Pausar todas" (bottom sheet: picker 1-90 días)
3. **Modal** (`frontend/src/screens/scheduledSessions/SessionModal.js`):
   - Modo crear/editar
   - Picker día de la semana (horizontal pills: L, M, X, J, V, S, D)
   - Time picker nativo (iOS: drum, Android: clock)
   - Input label opcional (placeholder: "Ej. Sesión mañana")
   - Validación: no permitir horarios duplicados (mismo day+time)
4. **Notificaciones locales** (integración en servicio):
   - Al crear/editar sesión: llamar `Notifications.scheduleNotificationAsync()` con trigger `weekly`
   - Cancelar notif anterior si se actualiza horario
   - Al pausar/eliminar: `cancelScheduledNotificationAsync(notificationId)`
   - Persistir `notificationId` en backend para reconciliación
5. **Navegación:**
   - Agregar enlace en `SettingsScreen`: "Sesiones programadas" → `ROUTES.SCHEDULED_SESSIONS`
   - Registrar screen en `StackNavigator.js`
6. **Traducciones i18n** (`es.js`, `en.js`):
   - `SCHEDULED_SESSIONS.SCREEN_TITLE`, `EMPTY_STATE`, `CTA_ADD`, `CTA_PAUSE_ALL`
   - Días de semana: `DAYS.MONDAY`, etc.
   - Modales: `MODAL.TITLE_CREATE`, `MODAL.TITLE_EDIT`, `MODAL.LABEL_PLACEHOLDER`
   - Mensajes error: `ERRORS.DUPLICATE_TIME`, `ERRORS.INVALID_TIME`

**Tests:**
- Unit: `scheduledSessionsService.js` (sanitización, validación, manejo errores)
- i18n: paridad ES/EN para todas las claves
- Manual: navegación, crear/editar/pausar, permisos notificaciones

---

### **Fase 3: Notificaciones + Deep Linking + Telemetría**

**Objetivos:**
- Copy terapéutico para notificaciones ("Es tu momento con Anto")
- Deep link al chat o foco activo al tocar notificación
- Telemetría para medir adherencia: sesiones programadas vs. cumplidas, latencia, origen

**Entregables:**
1. **Copy Notificaciones** (`frontend/src/constants/scheduledSessionsCopy.js`):
   - Variaciones ES/EN para evitar fatiga:
     - `"Es tu momento con Anto"` / `"Your space with Anto is here"`
     - `"Tu espacio de hoy te espera"` / `"Your today's session awaits"`
     - `"¿Conectamos?"` / `"Ready to connect?"`
   - Rotar variación según `sessionId % variaciones.length`
   - Incluir label personalizado si existe: `"Es tu momento: ${label}"`
2. **Deep Linking** (extender `frontend/src/navigation/linking.js`):
   - Path: `anto://scheduled-session?sessionId=<uuid>`
   - Lógica:
     - Si hay foco activo (#2): abrir chat + inyectar snippet de foco
     - Si no: abrir última conversación o crear nueva con saludo contextual
   - Body de notificación: `{ sessionId, timestamp }`
3. **Telemetría Backend** (modelo `ScheduledSessionEvent`):
   - `backend/models/ScheduledSessionEvent.js`:
     ```javascript
     {
       userId: ObjectId,
       sessionId: String,  // de User.preferences
       eventType: String,  // 'notification_sent', 'session_started', 'session_skipped'
       timestamp: Date,
       metadata: {
         responseLatency: Number,  // ms desde notif hasta open
         originatedFromNotification: Boolean,
         conversationId: ObjectId,
       }
     }
     ```
   - Índice compuesto: `{ userId: 1, sessionId: 1, timestamp: -1 }`
4. **Endpoint Telemetría** (`backend/routes/scheduledSessionsRoutes.js`):
   - `POST /api/scheduled-sessions/events` — registrar evento
   - Joi schema: `eventType`, `sessionId`, `metadata` opcional
   - Rate limit: 20 req/min (eventos legítimos, evitar spam)
5. **Integración Frontend:**
   - Al recibir notificación (`NotificationContext`):
     - Registrar `session_started` con `responseLatency`
     - Pasar `sessionId` al chat via navigation params
   - Al abrir chat desde notificación:
     - Registrar en `Message.metadata.scheduledSessionId` (opcional)
6. **Dashboard Interno** (opcional, Fase 3+):
   - Endpoint `GET /api/internal/scheduled-sessions/stats`:
     - Adherencia: % de sesiones notificadas con `session_started` < 1 hora
     - Latencia p50/p95 desde notif hasta start
     - Sesiones activas vs. pausadas por cohorte
     - Retención D7/D30 segmentada: con sesiones programadas vs. sin

**Tests:**
- Unit: telemetría service, event recording, validación metadata
- Integration: flujo completo notif → deep link → event log
- i18n: copy de notificaciones ES/EN
- Manual: permisos notificaciones, deep linking funcional, toasts/alertas

---

## 4. Especificaciones Técnicas

### 4.1. Copy Terapéutico — Tono y Principios

**Voz:**
- **Invitación suave**, no demanda ("Es tu momento" vs. "Debes conectarte")
- **Ritualización** sin culpa: enfatizar el "espacio" personal, no la obligación
- **Personalización** cuando existe label: `"Tu sesión mañana: ${label}"`
- **Consistencia** con narrativa de producto (North Star: acompañante presente)

**Evitar:**
- ❌ Lenguaje urgente o alarmista ("¡No olvides tu sesión!")
- ❌ Gamificación numérica ("Racha de 7 días") — reservado para #156 con límites
- ❌ Tuteo excesivo sin contexto de alianza establecida

**Ejemplo ES:**
```
Título: "Es tu momento con Anto"
Body: "Tu espacio de hoy te espera. ¿Conectamos?"
```

**Ejemplo EN:**
```
Title: "Your space with Anto is here"
Body: "Ready to connect?"
```

### 4.2. Deep Linking — Rutas y Comportamiento

**Path:** `anto://scheduled-session?sessionId=<uuid>`

**Lógica de navegación:**
```javascript
// En linking.js
config: {
  screens: {
    ScheduledSessionEntry: {
      path: 'scheduled-session',
      parse: { sessionId: String },
      exact: true,
    },
  },
}

// En ScheduledSessionEntryScreen.js (intermediario)
useEffect(() => {
  const { sessionId } = route.params;
  
  // Registrar telemetría: session_started
  recordScheduledSessionEvent('session_started', sessionId, {
    responseLatency: Date.now() - notificationTimestamp,
    originatedFromNotification: true,
  });
  
  // Navegar al chat
  if (activeFocus) {
    navigation.navigate(ROUTES.CHAT, {
      conversationId: lastConversationId || 'new',
      scheduledSessionId: sessionId,
      focusContext: activeFocus.theme,
    });
  } else {
    navigation.navigate(ROUTES.CHAT, {
      conversationId: 'new',
      scheduledSessionId: sessionId,
    });
  }
}, [route.params]);
```

**Edge cases:**
- Usuario abre app manualmente antes de tocar notif: NO registrar `session_started` automático
- Notificación llega pero permisos denegados: log silencioso, no bloquear feature
- Múltiples notifs programadas al mismo tiempo (ej. zona horaria cambió): deduplicar, mostrar solo la más reciente

### 4.3. Límites y Guardrails

**Backend:**
- Max 10 sesiones programadas por usuario (validación Mongoose + Joi)
- Max 7 sesiones activas simultáneas (`isActive: true`)
- `pauseDays`: 1-90 días (validación Joi)
- Rate limiting: 10 req/min para CRUD, 20 req/min para telemetría

**Frontend:**
- Max 2 sesiones por día (UX: advertencia si se intenta más)
- Validación de horarios duplicados antes de enviar al backend
- Permisos de notificaciones: solicitar al crear primera sesión, no en cada acción

**Notificaciones locales:**
- iOS: Respetar límite de 64 notifs programadas (otras features pueden usar también)
- Estrategia: cancelar notifs >7 días en el futuro y re-programar on-demand

### 4.4. Persistencia y Sincronización

**Flujo crear sesión:**
1. Frontend: usuario configura día+hora en modal
2. POST `/api/scheduled-sessions` → backend persiste en `User.preferences`
3. Backend response: sesión con `_id` generado
4. Frontend: programa notif local con `Notifications.scheduleNotificationAsync()`
5. Frontend: PUT `/api/scheduled-sessions/:id` con `notificationId` de Expo
6. Backend: actualiza `notificationId` para reconciliación futura

**Reconciliación al abrir app:**
- Fetch `GET /api/scheduled-sessions`
- Comparar con notifs locales programadas (`getAllScheduledNotificationsAsync()`)
- Re-programar si faltan (ej. usuario cambió zona horaria, reinstalación)
- Cancelar notifs huérfanas (sesión eliminada en otro dispositivo)

---

## 5. Testing Strategy

### 5.1. Tests Unitarios

**Backend (`backend/tests/unit/`):**
1. `scheduledSessionsSchemas.test.js` (Joi validation):
   - ✅ dayOfWeek 0-6, time HH:mm válido
   - ✅ rechazar dayOfWeek = -1, 7, "Monday"
   - ✅ rechazar time = "25:00", "12:75", "12pm"
   - ✅ label max 50 chars, sanitización newlines/tabs
   - ✅ pauseDays 1-90, rechazar 0, 91, negativos
2. `scheduledSessionsService.test.js` (lógica de negocio):
   - ✅ crear sesión: agregar a array, generar UUID
   - ✅ límite de 10 sesiones totales, 7 activas
   - ✅ pausar todas: `pausedUntil` = now + pauseDays
   - ✅ reanudar antes de `pausedUntil`: reset campo
   - ✅ actualizar sesión: cambiar time, isActive, label
   - ✅ eliminar sesión: remover de array o `isActive = false`
3. `scheduledSessionsApiCopy.test.js` (i18n):
   - ✅ paridad ES/EN para todas las claves
   - ✅ mensajes de error específicos (límite, duplicado, no encontrado)

**Frontend (`frontend/src/services/__tests__/`):**
1. `scheduledSessionsService.test.js`:
   - ✅ sanitización time input (trim, uppercase → lowercase)
   - ✅ validación dayOfWeek client-side (0-6)
   - ✅ manejo de errores API (400, 404, 500)
   - ✅ filtrado de sesiones inactivas en lista
   - ✅ cálculo de próxima ocurrencia (para mostrar "En X horas")

### 5.2. Tests de Integración

**Backend (`backend/tests/integration/`):**
1. `scheduledSessionsRoutes.test.js`:
   - ✅ flujo CRUD completo: crear → listar → actualizar → eliminar
   - ✅ pausar todas → reanudar
   - ✅ crear sesión duplicada (mismo day+time): rechazar
   - ✅ intentar crear 11ª sesión: error límite
   - ✅ intentar pausar con `pauseDays=100`: error validación
   - ✅ rate limiting: 11ª request en 1 min → 429

**Frontend (manual o E2E con Detox):**
1. Permisos notificaciones:
   - ✅ primera sesión creada → solicitar permisos
   - ✅ permisos denegados → mostrar alert educativo, permitir continuar sin notifs
2. Scheduling notificaciones:
   - ✅ crear sesión → notif local programada (`getAllScheduledNotificationsAsync()` confirma)
   - ✅ editar hora → notif anterior cancelada, nueva programada
   - ✅ pausar sesión → notif cancelada
   - ✅ eliminar sesión → notif cancelada
3. Deep linking:
   - ✅ tocar notif → app abre en chat con `scheduledSessionId` en params
   - ✅ telemetría registrada: `session_started` con latency
4. Reconciliación:
   - ✅ abrir app después de cambio de zona horaria → notifs re-programadas

### 5.3. Tests de Hardening

**Validación robusta (Phase 1):**
1. Inputs inválidos:
   - ✅ `dayOfWeek`: string, null, undefined, float, negativo, >6
   - ✅ `time`: formatos incorrectos ("12 PM", "24:00", "1:5"), null, objeto
   - ✅ `label`: >50 chars, caracteres problemáticos (`<>{}"`), newlines/tabs
   - ✅ `pauseDays`: 0, negativo, Infinity, NaN, string
2. Edge cases concurrencia:
   - ✅ crear 2 sesiones simultáneas → ambas aceptadas si <10 total
   - ✅ pausar mientras otra request actualiza → último write gana (Mongoose `findOneAndUpdate`)
3. Datos legacy:
   - ✅ usuario sin `scheduledSessions` en preferences → inicializar con defaults
   - ✅ `notificationId` faltante → permitir operación, re-programar en próxima reconciliación

**Seguridad:**
1. Rate limiting:
   - ✅ 11 requests en <1 min → 429, headers `X-RateLimit-*`
2. Autenticación:
   - ✅ todos los endpoints requieren `authenticateToken`
3. Autorización:
   - ✅ usuario A no puede editar sesiones de usuario B (validación `userId` en token vs. DB)

---

## 6. Hardening Considerations

### 6.1. Validación Entrada Multicapa

**Backend:**
- Joi schemas con custom validators para `time` (regex `^([01]\d|2[0-3]):([0-5]\d)$`)
- Mongoose schema validators para `dayOfWeek` (enum 0-6) y array max length
- Sanitización: trim, lowercase time, remove newlines/tabs en `label`

**Frontend:**
- Validación pre-envío: dayOfWeek en picker, time en formato nativo
- Mensajes error amigables: "Elige un horario válido", no "Invalid time format"

### 6.2. Manejo de Errores

**Backend:**
- Diferenciar 400 (validación), 404 (sesión no encontrada), 500 (DB error)
- Logs estructurados con `userId` y `sessionId` para debugging
- Respuestas i18n según `Accept-Language` header

**Frontend:**
- Toast error: "No pudimos guardar la sesión. Intenta de nuevo."
- Fallback: si scheduling notif falla, permitir continuar (log warning, no bloquear)

### 6.3. Reconciliación y Resiliencia

**Reconciliación al abrir app:**
```javascript
// En App.js useEffect
useEffect(() => {
  const reconcileScheduledSessions = async () => {
    try {
      const remoteSessions = await fetchScheduledSessions();
      const localNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Cancelar notifs huérfanas
      const remoteSessionIds = new Set(remoteSessions.map(s => s.id));
      for (const notif of localNotifications) {
        if (notif.content?.data?.sessionId && !remoteSessionIds.has(notif.content.data.sessionId)) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
      
      // Re-programar notifs faltantes
      const localSessionIds = new Set(localNotifications.map(n => n.content?.data?.sessionId).filter(Boolean));
      for (const session of remoteSessions) {
        if (session.isActive && !localSessionIds.has(session.id)) {
          await scheduleLocalNotification(session);
        }
      }
    } catch (error) {
      console.warn('[reconcileScheduledSessions] Error:', error.message);
    }
  };
  
  reconcileScheduledSessions();
}, []);
```

**Limitaciones conocidas:**
- Cambio de zona horaria mientras app cerrada: notifs programadas en hora local incorrecta hasta próxima apertura (trade-off aceptable vs. complejidad de push remoto)
- iOS background refresh limitado: no garantía de re-scheduling automático sin abrir app

---

## 7. Success Metrics

### 7.1. Métricas de Adopción (Fase 2+)

**Objetivo:** ≥30% de usuarios activos crean al menos 1 sesión programada en primeros 30 días post-release.

**Medición:**
- `ScheduledSession.createdAt` vs. `User.createdAt` (cohorte)
- Segmentación: nuevos vs. recurrentes, con foco activo vs. sin foco

### 7.2. Métricas de Adherencia (Fase 3)

**Objetivo:** ≥60% de sesiones notificadas resultan en `session_started` <1 hora.

**Medición:**
- `ScheduledSessionEvent.eventType = 'session_started'` con `responseLatency < 3600000ms`
- Por cohorte: día de semana, hora del día, presencia de foco activo

**Alertas:**
- Adherencia <40% en cohorte → revisar copy de notificaciones o frecuencia

### 7.3. Métricas de Retención (Objetivo principal)

**Objetivo:** Usuarios con ≥2 sesiones programadas activas tienen D7 +15% vs. control.

**Medición:**
- Cohortes: `withScheduledSessions` (≥2 activas) vs. `withoutScheduledSessions`
- D7 retention: % usuarios con ≥1 mensaje en D7 desde primera sesión
- D30 retention: % usuarios con ≥1 mensaje en D30

**Instrumento:**
```javascript
// Endpoint interno: GET /api/internal/scheduled-sessions/retention-impact
// Similar a retentionImpactAnalyzer.js de #55
{
  cohortStartDate: '2026-07-14',
  cohortEndDate: '2026-08-14',
  cohortSize: 500,  // mínimo para significancia estadística
}

Response:
{
  withScheduledSessions: {
    totalUsers: 350,
    d7Retention: 0.72,
    d30Retention: 0.48,
  },
  withoutScheduledSessions: {
    totalUsers: 450,
    d7Retention: 0.58,
    d30Retention: 0.35,
  },
  lift: {
    d7Relative: 0.24,   // +24%
    d7Absolute: 0.14,   // +14 puntos
    d30Relative: 0.37,
    d30Absolute: 0.13,
  },
}
```

### 7.4. Métricas de Engagement

**Objetivo:** Usuarios con sesiones programadas tienen mayor engagement (mensajes/semana).

**Medición:**
- Promedio mensajes/semana: `withScheduledSessions` vs. `withoutScheduledSessions`
- Duración promedio de sesión (turnos por conversación)

---

## 8. Cronogramas

**Total estimado:** ~8-10 días hábiles (1 sprint, S)

### Fase 1: Backend (3 días)
- **Día 1:** Modelo + schemas Joi + ApiCopy i18n
- **Día 2:** API REST CRUD + pausar/reanudar + rate limiting
- **Día 3:** Tests unitarios + integración backend

### Fase 2: Frontend (3-4 días)
- **Día 4:** Servicio API + ScheduledSessionsScreen + SessionModal
- **Día 5:** Integración notificaciones locales (scheduling/cancelación)
- **Día 6:** Traducciones i18n + navegación + tests unit frontend
- **Día 7:** Tests manuales UX + permisos + reconciliación

### Fase 3: Notificaciones + Telemetría (2-3 días)
- **Día 8:** Copy notificaciones + deep linking + telemetría modelo
- **Día 9:** Endpoint telemetría + integración frontend
- **Día 10:** Tests E2E flujo completo + hardening + commit/PR

**Buffer:** +1-2 días para smoke testing en dispositivo físico (iOS/Android) y ajustes UX finales.

---

## 9. Riesgos y Mitigaciones

### 9.1. Riesgo: Permisos de Notificaciones Denegados

**Impacto:** Feature inútil sin notificaciones → usuario crea sesiones pero nunca recibe recordatorios.

**Mitigación:**
- **Onboarding educativo:** Explicar valor antes de solicitar permisos ("Te recordaremos tu espacio personal")
- **Degradación elegante:** Permitir crear sesiones sin permisos, mostrar banner info "Activa notificaciones para recibir recordatorios"
- **Deep link a ajustes:** Botón "Ir a Ajustes" (iOS: `Linking.openSettings()`)

### 9.2. Riesgo: Fatiga de Notificaciones

**Impacto:** Usuario silencia app o desinstala si siente notificaciones intrusivas.

**Mitigación:**
- **Límite de 7 sesiones activas** (max 1 por día promedio)
- **Copy suave** ("Es tu momento" vs. "¡No olvides tu sesión!")
- **Pausa fácil:** Botón "Pausar todas por N días" accesible desde UI
- **Telemetría:** Monitorear % de usuarios que pausan >2 veces en 30 días → revisar frecuencia/copy

### 9.3. Riesgo: Cambio de Zona Horaria

**Impacto:** Notificaciones se disparan en hora local incorrecta (ej. usuario viaja, notif llega a las 3am).

**Mitigación:**
- **Reconciliación al abrir app:** Detectar cambio de timezone (comparar `Intl.DateTimeFormat().resolvedOptions().timeZone`), re-programar notifs
- **No es crítico:** Edge case poco frecuente, trade-off aceptable vs. complejidad de push remoto
- **Documentación interna:** Registrar como limitación conocida, priorizar si feedback usuario indica dolor

### 9.4. Riesgo: Sincronización Multi-Dispositivo

**Impacto:** Usuario configura sesión en dispositivo A, no se refleja en dispositivo B (notificaciones locales no sincronizadas).

**Mitigación:**
- **Backend como source of truth:** API persiste sesiones, cada dispositivo reconcilia al abrir
- **Aceptable en MVP:** Sincronización perfecta requeriría push remoto (fuera de alcance Fase 1-3)
- **Follow-up #15.1 (futuro):** Migrar a push remoto vía Expo Push Notifications para sincronización perfecta

### 9.5. Riesgo: Adherencia Baja (<40%)

**Impacto:** Feature no mueve retención si usuarios ignoran notificaciones.

**Mitigación:**
- **Iteración de copy:** A/B test variaciones tono (invitación vs. validación vs. curiosidad)
- **Personalización:** Usar label personalizado, nombre de foco activo en notif
- **Contexto:** Deep link a conversación previa (no nueva) si existe, reducir fricción
- **Gamificación opcional:** Si adherencia muy baja, considerar #156 (racha presencia sana) como complemento

---

## 10. Dependencias

### 10.1. Dependencias Externas

**Expo Notifications API:**
- Versión: Expo SDK 54 (ya instalado en `frontend/`)
- Documentación: https://docs.expo.dev/versions/latest/sdk/notifications/

**MongoDB:**
- Subdocumento `User.preferences` (sin cambio de schema root, solo adición)

**Expo Push Token (futuro, Fase 3+):**
- Si se migra a push remoto: `expo-notifications` ya incluye `getExpoPushTokenAsync()`

### 10.2. Dependencias Internas

**Bloqueantes (deben existir antes de comenzar):**
- ✅ `User.preferences` schema existente
- ✅ `authenticateToken` middleware
- ✅ Frontend: `NotificationContext`, `notificationService.js`
- ✅ Deep linking config en `linking.js`

**Complementarias (mejoran feature si existen):**
- **#2 (Focos):** Si usuario tiene foco activo, deep link abre chat con snippet de foco
- **#47 (Narrativa cierre):** Integración futura con #163 (agendar desde cierre)
- **#163 (Agendar desde cierre):** CTA en cierre de sesión → crear/editar sesión programada

**Futuras (habilitan extensiones):**
- **#43 (Sync calendario):** Exportar sesiones programadas a Google/Apple Calendar
- **#156 (Racha presencia sana):** Dashboard de adherencia con copy sin culpa
- **#157 (Win-back 7–30 días):** Reactivación si usuario no responde a sesiones programadas

---

## 11. Extensiones Futuras (Fuera de MVP)

### 11.1. Fase 3+ (Post-MVP)

**Push Remoto:**
- Migrar de notificaciones locales a push remoto (Expo Push Notifications)
- **Ventaja:** Sincronización multi-dispositivo, re-scheduling sin abrir app
- **Costo:** Infraestructura backend para envío, job scheduler (Bull/Redis)

**Personalización Dinámica:**
- Ajustar horario sugerido basado en uso histórico (ej. "Tu horario más activo es las 20:00")
- Requerir telemetría de uso acumulada (mínimo 30 días de datos)

**Copy Contextual:**
- Inyectar foco activo en notif: `"Tu sesión de ansiedad te espera"`
- Inyectar última técnica usada: `"¿Probamos respiración de nuevo?"`

### 11.2. Integraciones con Otras Features

**#163 (Agendar desde cierre):**
- Botón en `LastSessionSummaryCard` (Perfil): "Agendar próxima sesión"
- Pre-llenar día/hora basado en cierre actual + 1-2 días

**#156 (Racha presencia sana):**
- Dashboard de adherencia: "Has cumplido 5 de 7 sesiones esta semana"
- Copy sin culpa: "Tu ritmo, tu proceso" (no "racha rota")

**#49 (Escala 0–10 foco):**
- Mostrar escala en notificación interactiva (iOS): "¿Cómo llegas hoy? 1-10"
- Respuesta rápida → registrar pre-sesión, inyectar en chat prompt

---

## 12. Criterios de Éxito (Definition of Done)

**Fase 1:**
- ✅ API REST CRUD completa con rate limiting
- ✅ Schemas Joi validados, ApiCopy i18n ES/EN
- ✅ Tests unitarios + integración backend ≥80% coverage
- ✅ Documentación en AGENTS.md (endpoints, configuración)

**Fase 2:**
- ✅ ScheduledSessionsScreen funcional con crear/editar/pausar
- ✅ Notificaciones locales programadas correctamente (verificado con `getAllScheduledNotificationsAsync()`)
- ✅ Traducciones i18n ES/EN con paridad test
- ✅ Navegación desde Ajustes + registro en StackNavigator
- ✅ Tests unitarios frontend + tests manuales UX

**Fase 3:**
- ✅ Deep linking funcional: tocar notif abre chat con `scheduledSessionId`
- ✅ Telemetría registrada: `session_started` con latency
- ✅ Copy notificaciones implementado con rotación
- ✅ Reconciliación al abrir app funcional
- ✅ Tests E2E flujo completo notif → deep link → telemetría

**Release:**
- ✅ Smoke testing en dispositivo físico iOS + Android
- ✅ Permisos notificaciones funcionan correctamente
- ✅ Sin regresiones en features existentes (CI green)
- ✅ Commit + push + PR creado con descripción detallada
- ✅ Matriz actualizada: #15 → `Sí*`

---

**Última actualización:** 14 julio 2026  
**Autor:** Cloud Agent (cursor/paraphrasis-validation-d63c)  
**Siguiente paso:** Implementar Fase 1 (Backend — Modelo + API CRUD Sesiones Programadas)
