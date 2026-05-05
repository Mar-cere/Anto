# Contrato v1: acciones de producto desde el chat (tareas y hábitos)

**Versión:** 1.1 (implementación en curso)  
**Fecha:** Mayo 2026  
**Relacionado:** [PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md](./PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md) (**#52**, **#53**, **#51** subtareas fuera de este contrato inicial), [CONTRATOS_API.md](./CONTRATOS_API.md) (`POST /api/tasks`, `POST /api/habits`).

Este documento fija el **contrato de producto y de payload** entre la respuesta del chat y las herramientas de tareas/hábitos. No sustituye el detalle OpenAPI; alinea frontend y backend antes de codificar.

---

## 1. Objetivo y alcance

| En alcance v1 | Fuera de alcance v1 |
|-----------------|---------------------|
| **Proponer** tarea o hábito desde el flujo de chat autenticado, con datos **pre-rellenados** para el modal de confirmación. | **Pomodoro** (#54): explícitamente aplazado. |
| Tras **confirmación explícita** del usuario, **persistir** con los mismos endpoints que la app ya usa. | **Subtareas con LLM** (#51): puede ir en v2 o misma release si hay capacidad; no forma parte del contrato mínimo aquí. |
| **Trazabilidad** de origen (conversación + mensaje) para resúmenes y seguimiento. | Creación **sin** paso de confirmación (siempre hay paso B). |
| Reglas de **no sobrecarga** y de **supresión** en crisis / alto riesgo. | Chat **invitado**: sin propuestas productivas (ver §6). |

---

## 2. Definición: “creación automática” + confirmación obligatoria

**“Automático”** en este contrato significa:

- El servidor (y/o el modelo bajo políticas del servidor) **arma un borrador** alineado a los esquemas de `POST /api/tasks` y `POST /api/habits`.
- El usuario **confirma** en UI (paso B); puede **editar** cualquier campo, pero el diseño prioriza que **casi todo venga listo** (p. ej. solo ajustar **hora** o **fecha concreta** del vencimiento / recordatorio).

**No** significa persistir en base de datos sin acción explícita del usuario.

Flujo resumido:

1. **A — Propuesta:** respuesta del turno incluye (opcionalmente) uno o más ítems en `proposedProductActions` (nombre tentativo del campo; ver §4).
2. **B — Confirmación:** modal o pantalla reutiliza `CreateTaskModal` / flujo de hábito con **valores iniciales** del borrador.
3. **C — Persistencia:** un `POST` normal a `/api/tasks` o `/api/habits` con el body final + metadatos de procedencia (§5).

---

## 3. Principios de seguridad y UX

- **El modelo propone; el servidor decide** qué entra en el JSON enviado al cliente (validación Joi o equivalente, allowlist de tipos y campos, límites de longitud).
- **Nunca** ejecutar `POST` de tarea/hábito dentro del handler que solo genera la respuesta del chat; la creación ocurre **solo** tras el paso B.
- **Doble envío:** deshabilitar el botón “Crear” hasta respuesta; mostrar error claro si falla la red.

### 3.1 Idempotencia en el paso C (`POST` de confirmación)

- El cliente puede enviar **`clientRequestId`**: string opcional (p. ej. UUID), `^[a-zA-Z0-9_-]{1,80}$`, generado al abrir el flujo desde el chat (misma clave en reintentos de red).
- El servidor persiste `clientRequestId` en `Task` / `Habit` con índice único parcial por `(userId, clientRequestId)` en documentos **no** borrados (soft delete); si ya existe un recurso activo con la misma clave, responde **HTTP 200** con el recurso existente y **`idempotentReplay: true`** en el JSON (además de `success` y `data`). Si es creación nueva, **HTTP 201** como siempre.
- Sin `clientRequestId`, el comportamiento es el histórico (sin deduplicación por esta vía).

### 3.2 Refinamiento del borrador en el paso A (LLM opcional)

- Tras la **heurística** que decide si hay propuesta y el tipo (`propose_task` / `propose_habit`), el servidor puede **enriquecer** el `draft` con una llamada breve a OpenAI (`backend/services/chatProductActionLlmService.js`).
- La respuesta del modelo se **fusiona** con el borrador base y se **re-valida** en servidor (títulos acotados, fechas no anteriores a hoy, iconos y enums permitidos). Si el LLM falla o no hay API key, se envía solo el borrador heurístico.
- **Variables de entorno:** `CHAT_PRODUCT_ACTION_LLM=false` desactiva el paso LLM; `OPENAI_PRODUCT_ACTION_MODEL` (opcional) elige modelo; `CHAT_PRODUCT_ACTION_LLM_TIMEOUT_MS` (default 12000) acota la espera.
- No cambia el paso B ni C: el usuario sigue confirmando y el `POST` sigue validando con Joi.

---

## 4. Campo en la respuesta del chat (contrato de transporte)

### 4.1 Nombre y ubicación

- **Nombre tentativo del arreglo:** `proposedProductActions` (evita confundir con `suggestions` actual de técnicas terapéuticas; ver inventario en la matriz).
- **Dónde viaja:** mismo objeto que hoy cierra el SSE (`done: true`) y, alineado, la respuesta no-streaming autenticada. El cliente que no entienda el campo lo **ignora**.

### 4.2 Elemento del arreglo (forma lógica)

Cada elemento:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `type` | string enum | Sí | `propose_task` \| `propose_habit` |
| `id` | string (UUID) | Sí | Identificador **de esta propuesta** en el turno (no confundir con `_id` de Mongo tras crear). |
| `draft` | object | Sí | Subobjeto acorde al tipo (§4.3 / §4.4). |
| `confidence` | number 0–1 | No | Opcional para analytics o para ocultar si &lt; umbral (política producto). |
| `rationaleShort` | string corta | No | Texto opcional para la tarjeta (“Por lo que contaste…”), sin volcar transcripto. |

Límite recomendado: **≤ 2** acciones productivas por turno, y con frecuencia acotada (§7).

### 4.3 `draft` para `propose_task`

Debe mapearse 1:1 a lo que acepta `taskSchema` en `backend/routes/taskRoutes.js` **salvo** lo que el usuario deba completar en el modal:

- `title` (string, 1–100)
- `description` (opcional, hasta 500)
- `dueDate` — **ISO 8601**; puede ser una fecha/hora **sugerida** (p. ej. fin del día) para que el usuario solo mueva la hora
- `priority`: `low` \| `medium` \| `high` \| `urgent` (default `medium`)
- `itemType`: `task` \| `reminder` \| `goal` (default `task`)
- `category`, `tags`, `notifications`, `repeat` según defaults sensatos del producto

El servidor **no** debe incluir `userId`; lo añade el `POST` autenticado.

### 4.4 `draft` para `propose_habit`

Alineado a `habitSchema` en `backend/routes/habitRoutes.js`:

- `title` (requerido)
- `description` (opcional)
- `icon`: uno de `VALID_ICONS` del backend
- `frequency`: `daily` \| `weekly` \| `monthly`
- `reminder`: objeto con al menos `enabled`, `time` (ISO) — hora sugerida editable en confirmación
- `priority`: `low` \| `medium` \| `high` (default `medium`)

---

## 5. Procedencia (trazabilidad chat → recurso)

**Requisito:** poder saber que una tarea o hábito **nació** de un turno concreto, para resúmenes y seguimiento.

| Campo | Dónde vive | Notas |
|-------|------------|--------|
| `conversationId` | Body en `POST` (dentro de `chatOrigin`) | `ObjectId` de la conversación. |
| `sourceMessageId` | Body en `POST` (dentro de `chatOrigin`) | Id del mensaje **asistente** del turno que llevó la propuesta (implementación actual). |

**Implementación:** `chatOrigin: { conversationId, sourceMessageId, source: 'chat_v1' }` opcional en `Task` y `Habit`; se envía desde el cliente en el `POST` de confirmación cuando el flujo nació en el chat. El servidor **valida** que la conversación pertenezca al usuario autenticado y que el mensaje exista en esa conversación (no se aceptan IDs ajenos).

---

## 6. Invitado y crisis

### 6.1 Chat invitado

- **No** se envía `proposedProductActions` en respuestas de invitado.
- El propósito del invitado es conversación de **alta sensibilidad / emergencia**; no se ofrecen herramientas de productividad ahí.
- Si el producto lo requiere, CTA separado (“Crear cuenta para guardar tareas”) fuera de este arreglo.

### 6.2 Crisis y riesgo alto

- Si el turno se clasifica en **crisis** o **riesgo alto** (mismos criterios o superset de los que ya usan escalas / routing clínico), **no** incluir `proposedProductActions` (tareas y hábitos pasan a **segundo plano**).
- Las sugerencias de **técnicas** existentes (`suggestions` en `actionSuggestionService`) pueden seguir sus propias reglas; el contrato v1 solo exige que **no** se mezcle confusión entre “técnica” y “crear tarea”.

---

## 7. No sobrecargar (frecuencia y prioridad)

Reglas de producto a implementar con flags o contadores server-side:

- **No** en cada mensaje: máximo **N** propuestas productivas por ventana (p. ej. por conversación o por hora), con N bajo al inicio (p. ej. 1 cada X turnos o 1 por sesión hasta validar).
- **Prioridad:** si hay conflicto entre muchas ideas, el servidor devuelve **como mucho** el límite del §4.2 y elige por política (claridad del intent, baja carga cognitiva declarada, etc.).
- **Coexistencia con `suggestions`:** mantener dos canales claros: técnicas vs `proposedProductActions`; evitar dos CTAs competidoras en el mismo turno si el diseño lo considera ruidoso (ajuste de UX en implementación).

---

## 8. Telemetría

**Servidor (memoria / agregados en `metricsService.js`):**

- `product_action_proposed` — `count`, `types`, `transport` (`sse` \| `http_json` \| `socket`), metadata con `conversationId` donde aplique.
- `product_action_created` — al **201** o **200** idempotente de `POST /api/tasks` o `POST /api/habits` cuando el documento persistido tiene `chatOrigin`; `data`: `resource` (`task` \| `habit`), `fromChat`, `idempotentReplay`.
- `product_action_create_failed` — origen de chat inválido (`validateChatOriginForUser`) o error al persistir con `chatOrigin` en el body; `data`: `fromChat`, `resource`. El cliente puede reportar el mismo tipo vía `POST /api/metrics/product-action` con `event: create_failed` (flujo modal con borrador desde chat).
- `product_action_confirm_dismissed` — cierre del modal sin confirmar; principalmente vía `POST /api/metrics/product-action` con `event: confirm_dismissed`, `surface` (`task_modal` \| `habit_modal`); agregado `bySurface`.

**Cliente:** `ENDPOINTS.METRICS_PRODUCT_ACTION` (`/api/metrics/product-action`), util `postProductActionTelemetry` — dismiss al cerrar modal si había `chatOrigin` / `clientRequestId` pendiente; `create_failed` en catch de creación en ese mismo flujo.

**Opcional / pendiente de producto:** `product_action_confirm_opened` / `edited`, y señales explícitas de enriquecimiento LLM (éxito / omitido / timeout).

---

## 9. Paridad técnica (recordatorio)

- **SSE `done`** vs **respuesta no-stream**: mismo shape para `proposedProductActions` (incluye paso heurístico + mismo enriquecimiento LLM si aplica).
- **Socket.IO** (`backend/config/socket.js`): emite `proposedProductActions` en `message:received` con la misma lógica de propuesta que `chatRoutes` (riesgo + heurística + LLM). Las **sugerencias de técnicas** (`suggestions`) pueden seguir solo en HTTP/SSE según producto; no forman parte de este contrato.

---

## 10. Checklist de implementación (resumen)

1. [x] Extender respuesta autenticada del chat con `proposedProductActions` validado servidor-side.  
2. [x] Reglas: no invitado, no crisis/alto riesgo (heurística de oferta); límites de frecuencia finos pendientes de tuning.  
3. [x] Frontend: al recibir propuesta, abrir modal con **draft** pre-cargado; confirmación → `POST` existente.  
4. [x] Persistir procedencia §5 en modelo (`chatOrigin` en `Task` / `Habit`).  
5. [x] Idempotencia §3.1 (`clientRequestId` + `idempotentReplay`).  
6. [x] Refinamiento LLM §3.2 (opcional, con fallback heurístico).  
7. [x] Telemetría §8: `product_action_created`, `product_action_create_failed`, `product_action_confirm_dismissed`, `POST /api/metrics/product-action`.

---

## 11. Implementación (Mayo 2026)

- **Heurística:** `backend/services/chatProductActionProposalService.js` (intención `plan` / `organize`, o `technique` con léxico de planificación en el mensaje; riesgo no MEDIUM/HIGH, sin crisis; hábito si regex en mensaje). Exporta también `mergeTaskDraftFromLlm`, `mergeHabitDraftFromLlm`, `mergeProductActionDraftFromLlm` para fusionar salida del LLM con límites de POST.
- **LLM (paso A):** `backend/services/chatProductActionLlmService.js` — `enrichProposedProductActionsWithLlm`; invocado desde `chatRoutes.js` (SSE `done` y JSON 201) y `socket.js` tras generar la respuesta del asistente. Ver §3.2.
- **HTTP:** `backend/routes/chatRoutes.js` — `proposedProductActions` en evento final stream y en cuerpo 201 no-stream.
- **Socket.IO:** `backend/config/socket.js` — `proposedProductActions` en `message:received`; misma evaluación de riesgo (`evaluateSuicideRisk`) y mismos servicios heurística + LLM.
- **Métricas:** `product_action_proposed` (`productActionProposals`); `product_action_created` / `product_action_create_failed` / `product_action_confirm_dismissed` (`productActionOutcomes`); `POST /api/metrics/product-action` en `metricsRoutes.js`; helpers `backend/utils/metricsProductActions.js` en rutas de creación.
- **Modelos / API:** `chatOrigin` y `clientRequestId` en `Task` y `Habit`; `POST`/`PUT` validados en `taskRoutes.js` / `habitRoutes.js` (Joi + idempotencia §3.1 + **`backend/utils/validateChatOriginForUser.js`** antes de persistir `chatOrigin`).
- **Cliente:** `useChatScreen` + `ChatMessageItem`; navegación a tareas/hábitos con borrador, `chatOrigin` y `taskClientRequestId` / `habitClientRequestId` (`frontend/src/utils/clientRequestId.js`).

*Última actualización: Mayo 2026 (v1.1). Revisar tras la primera release en staging.*
