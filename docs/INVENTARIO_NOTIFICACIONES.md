# Inventario de Notificaciones

Fecha de actualización: 2026-04-23 (incluye puerta conservadora de decisión operativa y canal único WhatsApp para alertas de crisis)

## Resumen rápido

- Sistemas detectados: `push remotas`, `locales programadas`, `toast in-app`, `banner in-app`, `alertas modales`.
- Fuente de verdad frontend vigente:
  - Push remotas/permisos/listeners/canales: `frontend/src/services/pushNotificationService.js`
  - Locales (scheduling/cancelación): `frontend/src/utils/notifications.js`
- Catálogo backend de tipos push (`this.NOTIFICATION_TYPES` en `backend/services/pushNotificationService.js`): **45** tipos.
- **Política de copy push (backend):** en `pushNotificationCopyPools.js`, cada bloque de títulos, cuerpos o lista de plantillas tiene **al menos 25** variantes donde aplica (incl. `followUpTitles`, `followUpNoHours`, `followUpWithHours`, ramas de `trialExpiring*` y sub-listas de emergencia). El resumen semanal usa **25** aperturas numéricas y **25** sufijos por tendencia emocional (`improving` / `stable` / `needsCare`). El test `motivational.midday` exige **≥25** mensajes en `motivational.midday`.
- Variantes visuales de toast: **5** (`success`, `error`, `warning`, `info`, `default`).
- Ocurrencias en código (medición directa sobre el árbol actual):
  - `Alert.alert(`: **59** (frontend).
  - `showToast(`: **86** (frontend).
  - Literales `type: '…'` en `frontend/src` (`.js`): `success` **18**, `error` **41**, `warning` **16**, `info` **7**, `default` **8** (incluye usos fuera de toast cuando aplica).
  - `scheduleNotificationAsync(`: **10** (frontend).
  - Listeners de recepción/tap de push: **2** (frontend).
  - Referencias a `notificationType` en `backend/services/*.js`: **35**.

## Tipos push (backend)

Fuente: `backend/services/pushNotificationService.js` (`NOTIFICATION_TYPES` + métodos `send*`).

Total: **45** valores. Tabla resumida (tipo → método principal → canal Android habitual → prioridad típica):

| Tipo (`notificationType`) | Categoría funcional | Método de envío | Canal Android | Prioridad |
|---|---|---|---|---|
| `crisis_warning` | Crisis y seguimiento | `sendCrisisWarning` | `anto-crisis` | `high` |
| `crisis_medium` | Crisis y seguimiento | `sendCrisisMedium` | `anto-crisis` | `high` |
| `crisis_high` | Crisis y seguimiento | `sendCrisisHigh` | `anto-crisis` | `high` |
| `crisis_followup` | Crisis y seguimiento | `sendFollowUp` | `anto-followup` | `high` |
| `crisis_resources` | Crisis y seguimiento | `sendCrisisResources` | `anto-crisis` | `high` |
| `technique_reminder` | Técnicas y bienestar | `sendTechniqueReminder` | `anto-reminders` | `default` |
| `breathing_reminder` | Técnicas y bienestar | `sendBreathingReminder` | `anto-reminders` | `default` |
| `mindfulness_reminder` | Técnicas y bienestar | `sendMindfulnessReminder` | `anto-reminders` | `default` |
| `grounding_reminder` | Técnicas y bienestar | `sendGroundingReminder` | `anto-reminders` | `default` |
| `progressive_relaxation` | Técnicas y bienestar | `sendProgressiveRelaxation` | `anto-reminders` | `default` |
| `progress_positive` | Progreso y logros | `sendProgressPositive` | `anto-reminders` | `default` |
| `achievement_unlocked` | Progreso y logros | `sendAchievementUnlocked` | `anto-reminders` | `default` |
| `streak_milestone` | Progreso y logros | `sendStreakMilestone` | `anto-reminders` | `default` |
| `weekly_progress` | Progreso y logros | `sendWeeklyProgress` | `anto-reminders` | `default` |
| `personal_best` | Progreso y logros | `sendPersonalBest` | `anto-reminders` | `default` |
| `habit_reminder` | Hábitos y tareas | `sendHabitReminder` | `anto-reminders` | `high` |
| `habit_missed` | Hábitos y tareas | `sendHabitMissed` | `anto-reminders` | `high` |
| `task_reminder` | Hábitos y tareas | `sendTaskReminder` | `anto-reminders` | `high` |
| `task_overdue` | Hábitos y tareas | `sendTaskOverdue` | `anto-reminders` | `high` |
| `task_due_soon` | Hábitos y tareas | `sendTaskDueSoon` | `anto-reminders` | `high` |
| `daily_checkin` | Check-ins y reflexión | `sendDailyCheckIn` | `anto-reminders` | `high` |
| `emotional_checkin` | Check-ins y reflexión | `sendWellbeingChatCheckIn` | `anto-reminders` | `high` |
| `gratitude_reminder` | Check-ins y reflexión | `sendGratitudeReminder` | `anto-reminders` | `default` |
| `journaling_prompt` | Check-ins y reflexión | `sendJournalingPrompt` | `anto-reminders` | `default` |
| `weekly_reflection` | Check-ins y reflexión | `sendWeeklyReflection` | `anto-reminders` | `default` |
| `motivational_message` | Motivación y apoyo | `sendMotivationalMessage` | `anto-reminders` | `default` |
| `morning_motivation` | Motivación y apoyo | `sendMotivationalMessage` (vía scheduler) | `anto-reminders` | `default` |
| `evening_reflection` | Motivación y apoyo | `sendMotivationalMessage` (vía scheduler) | `anto-reminders` | `default` |
| `midday_motivation` | Motivación y apoyo | `sendMiddayMotivation` | `anto-reminders` | `default` |
| `weekend_reflection` | Motivación y apoyo | `sendWeekendReflection` | `anto-reminders` | `default` |
| `wellness_tip` | Recordatorios preventivos | `sendWellnessTip` | `anto-reminders` | `default` |
| `self_care_reminder` | Recordatorios preventivos | `sendSelfCareReminder` | `anto-reminders` | `default` |
| `hydration_reminder` | Recordatorios preventivos | `sendHydrationReminder` | `anto-reminders` | `default` |
| `movement_break` | Recordatorios preventivos | `sendMovementBreak` | `anto-reminders` | `default` |
| `sleep_routine_reminder` | Recordatorios preventivos | `sendSleepRoutineReminder` | `anto-reminders` | `default` |
| `trial_expiring` | Trial y suscripciones | `sendTrialExpiring` | `anto-trial` | `high` |
| `trial_expired` | Trial y suscripciones | `sendTrialExpired` | `anto-trial` | `high` |
| `subscription_reminder` | Trial y suscripciones | `sendSubscriptionReminder` | `anto-trial` | `high` |
| `trial_welcome` | Trial y suscripciones | `sendTrialWelcome` | `anto-trial` | `default` |
| `subscription_renewal_hint` | Trial y suscripciones | `sendSubscriptionRenewalHint` | `anto-trial` | `default` |
| `emergency_alert_sent` | Alerta de emergencia | `sendEmergencyAlertSent` | `anto-crisis` | `high` |
| `emergency_contact_updated` | Alerta de emergencia | `sendEmergencyContactUpdated` | `anto-crisis` | `default` |
| `emergency_test_reminder` | Alerta de emergencia | `sendEmergencyTestReminder` | `anto-crisis` | `default` |
| `emergency_safety_review` | Alerta de emergencia | `sendEmergencySafetyReview` | `anto-crisis` | `default` |
| `emergency_info_digest` | Alerta de emergencia | `sendEmergencyInfoDigest` | `anto-crisis` | `default` |

Nota: prioridades y canales están centralizados en el mapa del servicio; si cambia el mapa, actualizar esta tabla.

## Pools de copy (push, backend)

Fuente: `backend/services/pushNotificationCopyPools.js`.

Resumen de **variantes** (títulos / cuerpos / listas; las funciones indican cuántas plantillas devuelven por rama). Criterio vigente: **≥25** entradas por lista de títulos o cuerpos (incl. cada rama de `trialExpiring*` y sub-listas de emergencia).

| Clave / bloque | Títulos | Cuerpos / variantes |
|---|---:|---:|
| `crisisWarning` | 25 | 25 |
| `crisisMedium` | 25 | 25 |
| `crisisHigh` | 25 | 25 |
| `followUpTitles` | 25 | — |
| `followUpNoHours` | — | 25 |
| `followUpWithHours(h)` | — | 25 |
| `wellbeingCheckIn` | 25 | 25 |
| `techniqueTitles` | 25 | — |
| `techniqueBodies(…)` | — | 25 |
| `progressPositive` | 25 | 25 |
| `habitReminder` | 25 | 25 |
| `habitMissed` | 25 | 25 |
| `taskReminder` | 25 | 25 |
| `taskOverdue` | 25 | 25 |
| `taskDueSoon` | 25 | 25 |
| `dailyCheckIn` | 25 (fn `greeting`) | 25 |
| `breathing` | 25 | 25 |
| `mindfulness` | 25 | 25 |
| `achievement` | 25 | 25 |
| `streak` | 25 | 25 |
| `personalBest` | 25 | 25 |
| `weeklyProgress` | 25 | (cuerpo vía `buildWeeklyProgressBody`) |
| `motivationalTitles` | 25 | — |
| `motivational.morning` | — | 25 |
| `motivational.afternoon` | — | 26 |
| `motivational.midday` | — | 30 |
| `motivational.evening` | — | 25 |
| `gratitude` | 25 | 25 |
| `wellnessTips` | — | 26 |
| `selfCare` | 25 | 25 |
| `trialExpiringTitles(d)` | 25 por rama (`days === 1` / resto) | — |
| `trialExpiringBodies(d)` | — | 25 por rama |
| `trialExpired` | 25 | 25 |
| `subscriptionReminder` | 25 | 25 |
| `emergencySent.testTitles` | 25 | — |
| `emergencySent.testBodies(ok,total)` | — | 25 |
| `emergencySent.liveTitles` | 25 | — |
| `emergencySent.liveBodies(ok,total)` | — | 25 |
| `crisisResources` | 25 | 25 |
| `grounding` | 25 | 25 |
| `progressiveRelaxation` | 25 | 25 |
| `journaling` | 25 | 25 |
| `weeklyReflection` | 25 | 25 |
| `midday` | 25 | 25 |
| `weekend` | 25 | 25 |
| `hydration` | 25 | 25 |
| `movementBreak` | 25 | 25 |
| `sleepRoutine` | 25 | 25 |
| `trialWelcome` | 25 | 25 |
| `renewalHint` | 25 | 25 |
| `emergencyContactUpdated` | 25 | `bodiesWithName` 25 + `bodiesGeneric` 25 |
| `emergencyTestReminder` | 25 | 25 |
| `emergencySafetyReview` | 25 | 25 |
| `emergencyInfoDigest` | 25 | 25 |
| `buildWeeklyProgressBody` | — | **25** aperturas + **25**/**25**/**25** sufijos (`improving` / `stable` / `needsCare`) |

## Datos locales de mensajes (frontend)

Fuente: `frontend/src/data/notifications.js`

- **92** pares título/cuerpo en total.
- **23** por franja: `morning`, `afternoon`, `evening`, `any` (23 × 4).

## Disparadores y orquestación

| Flujo | Archivo origen | Disparador principal | Resultado |
|---|---|---|---|
| Scheduler por hora/minuto | `backend/services/notificationScheduler.js` | Matching de hora configurada (`morning`/`evening`) | `morning_motivation` o `evening_reflection` |
| Scheduler por inactividad | `backend/services/notificationScheduler.js` | `inactivity.hours > 48` | `daily_checkin` |
| Scheduler por progreso | `backend/services/notificationScheduler.js` | `progress.improvement` | `progress_positive` |
| Scheduler por estado emocional | `backend/services/notificationScheduler.js` | `negativeStreak > 3` | `emotional_checkin` |
| Envío directo por servicio | `backend/services/pushNotificationService.js` | Llamadas desde servicios/rutas | Cualquier `notificationType` |
| Registro de engagement | `backend/services/pushNotificationService.js` + `backend/models/NotificationEngagement.js` | Tras cada envío (si hay `userId`) | estado `sent`/`error` persistido |

## Notificaciones locales (frontend)

Fuente: `frontend/src/utils/notifications.js`

| Tipo local | Función | Canal Android | Repetición | Uso |
|---|---|---|---|---|
| Inmediata | `sendImmediateNotification` | sin canal explícito | no | feedback puntual |
| Programada puntual | `scheduleLocalNotification` | sin canal explícito | depende de trigger | recordatorio genérico |
| Diaria | `scheduleDailyNotification` | `anto-notifications` | sí | mensaje motivacional diario |
| Alternada | `scheduleAlternateNotifications` | sin canal explícito | no | pruebas/experimentos |
| Múltiples por día | `scheduleMultipleDailyNotifications` | sin canal explícito | sí | varias franjas horarias |
| Por tarea | `scheduleTaskNotification` | sin canal explícito | no | recordatorio de tarea |
| Por hábito | `scheduleHabitNotification` | `anto-habits` | no | recordatorio de hábito |

## Recepción push en app (frontend)

Fuente: `frontend/src/services/pushNotificationService.js`

| Componente | Archivo | Detalle |
|---|---|---|
| Inicialización global | `initializeNotifications` | configura una vez handler + canales (idempotente) |
| Handler global | `setNotificationHandler` | muestra alerta, sonido y badge; sube prioridad para crisis/followup |
| Listener foreground | `addNotificationReceivedListener` | callback cuando llega una push con app abierta |
| Listener tap | `addNotificationResponseReceivedListener` | callback al tocar una push |
| Canales Android | `setupNotificationChannels` | `anto-crisis`, `anto-followup`, `anto-reminders`, `anto-notifications`, `anto-trial` |

## Notificaciones in-app (UI)

### Toast

Fuente: `frontend/src/context/ToastContext.js` y `frontend/src/components/Toast.js`

| Variante visual | Color/estilo | Icono | Uso observado |
|---|---|---|---|
| `success` | `colors.success` | `checkmark-circle` | usado |
| `error` | `colors.error` | `close-circle` | definido |
| `warning` | `colors.warning` | `warning` | definido |
| `info` | `colors.info` | `information-circle` | definido |
| `default` | `colors.cardBackground` + borde | sin icono | fallback |

### Banner de permisos

Fuente: `frontend/src/components/NotificationsPromptBanner.js`

| Elemento | Estilo | CTA |
|---|---|---|
| Banner informativo | fondo `colors.primary + '20'`, borde izquierdo `colors.primary` | `Activar` / `Cerrar` |

## Cantidades y cobertura (aprox.)

- `Alert.alert(` en `frontend/src`: **59**.
- `showToast(` en `frontend/src`: **86**.
- literales `type: '…'` en `frontend/src` (`.js`): `success` **18**, `error` **41**, `warning` **16**, `info` **7**, `default` **8**.
- `scheduleNotificationAsync(` en `frontend/src`: **10**.
- listeners push (`addNotificationReceivedListener` + `addNotificationResponseReceivedListener`) en `frontend/src`: **2**.
- referencias `notificationType` en `backend/services/*.js`: **35**.

## Observaciones de mantenimiento

- Solapamiento frontend resuelto: `services/pushNotificationService.js` concentra push remotas y `utils/notifications.js` solo locales.
- Canal trial alineado de punta a punta: frontend y backend usan `anto-trial` para `trial_*` y `subscription_*` (incl. `subscription_renewal_hint`).
- `Alert.alert` concentra mucho volumen UX y no equivale a sistema de notificaciones push; conviene separarlo en reportes.
- Para recalcular conteos de líneas (`Alert`, `showToast`, `scheduleNotificationAsync`, literales `type:`), usar búsqueda en el repo sobre `frontend/src`.
- Al ampliar copy en `pushNotificationCopyPools.js`, mantener **≥25** variantes por lista coherente y comprobar que `buildWeeklyProgressBody` siga generando siempre subcadenas `N hábitos` y `N tareas` en cada apertura (véase test unitario).

## Crisis: puerta operativa conservadora (v1)

Fuente: `backend/constants/crisis.js` (`buildCrisisActionDecision`) + uso en `backend/routes/chatRoutes.js`.

- Se separa `riskLevel` (clínico) de `actionLevel` (operativo).
- `actionLevel` posibles:
  - `MONITOR` (`LOW`)
  - `SUPPORT_USER` (`WARNING`)
  - `VERIFY` (`MEDIUM`/`HIGH` por defecto)
  - `ALERT_CONTACTS` (solo si pasa puerta de evidencia)
- Señales consideradas en la puerta:
  - críticas: `advancedPlanning`, `farewellSignals`
  - moderadas: `obsessiveDistress`, `isolation`, `communicationDisengagement`, `trendDeterioration`
  - contexto: `recentCrisisHistory`
- Umbrales conservadores actuales:
  - `HIGH`: alerta contactos si `confidence >= 0.90` y evidencia fuerte/acumulada.
  - `MEDIUM`: alerta contactos si `confidence >= 0.95` y evidencia acumulada.
- Si no pasa la puerta:
  - se mantiene `VERIFY`,
  - se envían señales de soporte al usuario (push de crisis según nivel),
  - no se notifica a contactos de emergencia.
- Canal de alertas a contactos (v1 actual):
  - **solo WhatsApp** desde `backend/services/emergencyAlertService.js`.
  - el canal email para alertas de emergencia fue deshabilitado para evitar ambigüedad operativa.
