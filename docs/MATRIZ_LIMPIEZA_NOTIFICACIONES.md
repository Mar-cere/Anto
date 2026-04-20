# Matriz de Limpieza de Notificaciones

Fecha: 2026-04-15
Base: `docs/INVENTARIO_NOTIFICACIONES.md`

## Objetivo

Reducir duplicidad, alinear canales/prioridades y dejar una fuente de verdad unica para notificaciones.

## Fuente de verdad propuesta

- Push remotas: `backend/services/pushNotificationService.js`
- Recepcion y permisos push app: `frontend/src/services/pushNotificationService.js`
- Notificaciones locales: `frontend/src/utils/notifications.js` (solo locales)
- UI in-app: `frontend/src/context/ToastContext.js` + `frontend/src/components/Toast.js`

## Matriz de acciones

| ID | Problema | Impacto | Prioridad | Accion concreta | Archivo(s) | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| NTF-01 | Solapamiento entre servicio push frontend y util de notificaciones | Alto | P0 | Separar responsabilidades: push remoto vs locales, sin funciones duplicadas | `frontend/src/services/pushNotificationService.js`, `frontend/src/utils/notifications.js` | Medio | M |
| NTF-02 | Desalineacion canal trial (`anto-trial` vs `anto-reminders`) | Alto | P0 | Mapear `trial_*` y `subscription_reminder` a `anto-trial` en backend | `backend/services/pushNotificationService.js` | Bajo | S |
| NTF-03 | Tipos toast definidos pero casi sin uso (`error/warning/info`) | Medio | P1 | Estandarizar llamadas `showToast` por caso de uso y reemplazar feedback inconsistente | `frontend/src/**` | Bajo | M |
| NTF-04 | Alto volumen de `Alert.alert` mezclado con UX/no-notificacion | Medio | P1 | Clasificar: confirmacion UX vs error bloqueante; migrar feedback no bloqueante a toast | `frontend/src/**` | Medio | L |
| NTF-05 | Canales Android posiblemente no reflejan taxonomia real | Medio | P1 | Revisar taxonomia de canales y documentar reglas por tipo | `frontend/src/services/pushNotificationService.js`, `backend/services/pushNotificationService.js` | Bajo | S |
| NTF-06 | Falta de documento operativo para nuevos tipos | Medio | P2 | Agregar checklist de alta de tipo (backend + frontend + analytics + QA) | `docs/INVENTARIO_NOTIFICACIONES.md` | Bajo | S |
| NTF-07 | Riesgo de regresion sin pruebas focalizadas | Alto | P0 | Crear suite minima de pruebas para mapeo tipo->canal/prioridad y scheduler | `backend/tests/**`, `frontend/tests/**` | Medio | M |

## Plan por fases

### Fase 1 (P0, inmediata)

1. Ejecutar `NTF-02`: corregir canales de trial/suscripcion en backend.
2. Ejecutar `NTF-01`: definir contrato claro:
   - `services/pushNotificationService.js`: token, permisos, listeners, backend sync.
   - `utils/notifications.js`: scheduling local y cancelaciones.
3. Ejecutar `NTF-07` (minimo viable): tests de mapeo `notificationType -> channelId/priority`.

### Fase 2 (P1)

4. Ejecutar `NTF-03`: guia de uso de toast por severidad.
5. Ejecutar `NTF-04`: migracion gradual de `Alert.alert` no bloqueantes a toast.
6. Ejecutar `NTF-05`: ajustar canales Android y naming definitivo.

### Fase 3 (P2)

7. Ejecutar `NTF-06`: checklist operativo para alta/modificacion de tipos.

## Definition of Done (DoD)

- No hay funciones duplicadas entre `frontend/src/services/pushNotificationService.js` y `frontend/src/utils/notifications.js`.
- Todos los tipos `trial_*` y `subscription_reminder` enrutan a canal `anto-trial` (si ese canal se mantiene).
- Existe test automatizado que valida mapeos de `getChannelId()` y `getPriority()`.
- Se reduce el uso de `Alert.alert` en escenarios no bloqueantes.
- El inventario y esta matriz quedan actualizados en cada cambio de tipos.

## Checklist de ejecucion rapida

- [x] Alinear canal trial en backend.
- [x] Congelar contrato de responsabilidades frontend (push remoto vs local).
- [ ] Agregar tests de mapeo y scheduler.
- [ ] Definir regla de uso: `Toast` vs `Alert.alert`.
- [ ] Actualizar docs y comunicar al equipo.

## Estado de avance

- 2026-04-15: `NTF-01` ejecutado en frontend.
  - Se agrego `initializeNotifications()` idempotente en `frontend/src/services/pushNotificationService.js`.
  - `frontend/src/navigation/AppNavigator.js` inicializa notificaciones al boot.
  - `frontend/src/utils/notifications.js` quedo enfocado en locales (sin handler/permisos/canales duplicados).
  - Se removio configuración duplicada de handler en `frontend/src/hooks/useSettingsScreen.js`.
- 2026-04-15: `NTF-02` ejecutado en backend.
  - `backend/services/pushNotificationService.js` enruta `trial_expiring`, `trial_expired` y `subscription_reminder` a `anto-trial`.
