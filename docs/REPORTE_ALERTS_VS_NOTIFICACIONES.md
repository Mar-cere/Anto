# Reporte: Alerts UX vs Notificaciones

Fecha: 2026-04-15

## Objetivo

Separar en métricas y en implementación dos conceptos que hoy están mezclados:

- `Alert.alert` (modales UX y errores de flujo).
- Notificaciones reales del sistema (`push`, `local`, `websocket`).

## Estado actual (frontend)

- `Alert.alert(` en `frontend/src`: **90** ocurrencias.
- `showToast(` en `frontend/src`: **41** ocurrencias.
- Distribución actual de variantes toast:
  - `success`: 11
  - `info`: 3
  - `warning`: 12
  - `error`: 14
- Principal concentración:
  - `frontend/src/hooks/useSubscriptionScreen.js`: 22
  - `frontend/src/hooks/useSettingsScreen.js`: 12
  - `frontend/src/hooks/useChatScreen.js`: 8
  - `frontend/src/screens/TaskScreen.js`: 2

## Taxonomía propuesta

### 1) Modal UX (mantener `Alert.alert`)

Usar para decisiones bloqueantes o destructivas:

- Confirmaciones de eliminar/cancelar.
- Acciones con `style: 'destructive'` o `style: 'cancel'`.
- Flujos donde el usuario debe elegir antes de continuar.

Evento de reporte recomendado: `ui_modal_alert`.

### 2) Feedback UI (migrar a `Toast`)

Usar para estados transitorios que no requieren decisión:

- Éxito: guardado, actualizado, enviado.
- Error recuperable no bloqueante.
- Info breve post acción.

Evento de reporte recomendado: `ui_feedback_toast`.

### 3) Notificación real (reportar como notificación)

Usar para eventos que vienen de infraestructura de notificaciones:

- Push remotas (`expo-notifications`).
- Locales programadas (`scheduleNotificationAsync`).
- Eventos websocket con semántica de alerta/notificación.

Evento de reporte recomendado: `notification_event`.

## Criterio de separación para reportes

No contar `Alert.alert` como notificación por defecto.

Contar como notificación solamente si:

- proviene de handler/listener de push/local, o
- representa explícitamente un evento de notificación de backend (ej. emergencia enviada),
- y se registra con `notification_event`.

Todo `Alert.alert` restante se considera UX modal (`ui_modal_alert`).

## Plan de migración sugerido (priorizado)

1. **Fase 1 (rápida)**: empezar por `useSettingsScreen` y `useSubscriptionScreen`:
   - migrar éxitos e infos de `Alert.alert` a `showToast`.
   - mantener confirmaciones/destructivas como modal.
2. **Fase 2**: `useChatScreen` y `EmergencyContactsModal`:
   - separar errores bloqueantes de mensajes informativos.
3. **Fase 3**: instrumentación de métricas:
   - registrar `ui_modal_alert`, `ui_feedback_toast`, `notification_event`.

## KPI de éxito

- Reducción de `Alert.alert` en casos no bloqueantes.
- Reportes de notificaciones sin ruido de modales UX.
- Trazabilidad por tipo de evento (`ui_modal_alert` vs `notification_event`).
