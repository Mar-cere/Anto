# Contrato v1: compromisos entre sesiones (#202)

**Versión:** 1.0  
**Fecha:** Julio 2026  
**Relacionado:** [PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md](./PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md) (**#20**, **#202**), [CONTRATO_CHAT_ACCIONES_V1.md](./CONTRATO_CHAT_ACCIONES_V1.md) (**#52**, **#53**), [PROTOCOLO_CRISIS_V1.md](./PROTOCOLO_CRISIS_V1.md).

Este documento fija el **contrato de producto** para acuerdos entre sesiones: visión de acompañamiento (instar, observar, ayudar — no obligar ni «revisar deberes»), superficies (dashboard + chat), API, reglas de prompt y criterios de aceptación. No sustituye OpenAPI; alinea frontend, backend y copy antes de cerrar la implementación.

---

## 1. Objetivo y alcance

### 1.1 Promesa de producto

| Sí | No |
|----|-----|
| Recordar **lo que el usuario acordó** retomar entre conversaciones | Asignar «deberes» ni evaluar cumplimiento escolar |
| **Invitar** a retomar con una pregunta suave | Insistir, culpar o repreguntar en bucle |
| **Renegociar** u **omitir** sin drama | Archivar en silencio sin consentimiento |
| Puente opcional a **tarea / hábito** del ecosistema | Compromiso aislado sin vida en el resto de la app |
| Inferir candidatos en chat **solo con confirmación explícita** | Persistir compromisos sin paso de confirmación |

**Mantra de copy (ES):** «Lo que quedó para retomar» — evitar «deber», «tarea pendiente» o «¿hiciste los ejercicios?».

### 1.2 En alcance v1

| Área | Detalle |
|------|---------|
| **Creación** | Cierre de sesión (`SessionInsight`), sugerencia en chat al cerrar tramo accionable, puente desde tarea/hábito confirmados (#52–#53) |
| **Persistencia** | `SessionCommitment` + API `/api/session-commitments` (existente) |
| **Follow-up** | Dashboard (foco) + **una** apertura suave en chat; sincronizados |
| **Respuestas** | Sí / En parte / Aún no / **Omitir**; renegociación suave |
| **Ecosistema** | Opción «convertir en tarea/hábito»; vínculo `sourceMeta` con protocolos TCC |
| **Notificaciones** | Opt-in; resumen **semanal** suave (máx. 1/semana), no nag por compromiso |
| **Protocolos** | BA, ABC, exposición, AT, psicoed — vía `sourceMeta.interventionId` |

### 1.3 Fuera de alcance v1

| Ítem | Notas |
|------|--------|
| Pantalla dedicada «Mis compromisos» | Lista completa; v2 si hace falta |
| Recordatorio **diario** por compromiso | Demasiado «revisión»; contradice visión |
| Auto-completar compromiso al marcar hábito | Solo mención suave en follow-up conversacional |
| Chat invitado | Sin compromisos |
| **Crisis** y post-crisis reciente | Sin crear ni follow-up (§8) |
| Inferencia sin confirmación | Prohibido |

---

## 2. Definición: «compromiso» vs tarea / hábito

| Concepto | Rol |
|----------|-----|
| **Compromiso** | Acuerdo **lingüístico** entre sesiones («retomar con mi hermana», «probar la respiración antes de dormir»). Texto corto, seguimiento cualitativo. |
| **Tarea / hábito** | Acción **persistida** en herramientas de producto (#52–#53). Recordatorios, check-ins, métricas. |
| **Puente** | Un compromiso puede **originar** o **vincularse** a tarea/hábito; son entidades distintas. Completar la tarea **no** cierra automáticamente el compromiso. |

Flujo resumido:

1. **A — Candidato:** la IA o el cierre de sesión propone un texto de compromiso.
2. **B — Confirmación:** el usuario confirma, edita o rechaza (nunca persistir sin B).
3. **C — (Opcional) Materializar:** oferta de crear tarea/hábito con draft pre-cargado (contrato acciones chat).
4. **D — Follow-up:** una invitación suave en dashboard y/o chat; renegociar u omitir.

---

## 3. Principios de estilo y retención

Alineado a `openaiPromptBuilder` (desahogo primero) y decisión de producto (jul 2026):

1. **Una pregunta por compromiso por ventana** — no repreguntar en el mismo hilo si el usuario cambió de tema.
2. Si el usuario abre con algo urgente, **el compromiso espera** — no bloquear el hilo.
3. Copy de follow-up: *«¿Qué tal con…?»*, *«¿Retomamos lo que habíamos dejado?»* — nunca *«¿Hiciste…?»* ni tono evaluativo.
4. Tras **omitir** o **dos** «Aún no» sin avance: ofrecer acortar el compromiso o archivar; **no** volver a preguntar hasta que el usuario lo reactive.
5. **Prioridad conversacional:** instar → observar → ayudar; si no hay apertura, soltar el tema.

---

## 4. Momentos de creación (cuándo y quién)

### 4.1 Canales permitidos

| Canal | Prioridad | Regla |
|-------|-----------|--------|
| **Cierre de sesión** (`SessionInsight`) | Alta | Principal; máx. **2** sugerencias de texto; CTA «Guardar como compromiso» (existente). |
| **Chat — tramo accionable** | Media | Solo al **cerrar** un micro-acuerdo (no en desahogo). Campo `proposedCommitments` (§6) con confirmación en UI. |
| **Post tarea/hábito** (#52–#53) | Media | Tras confirmar `POST` task/habit: chip opcional «¿También como compromiso de sesión?». |
| **Manual** | Baja | API `source: manual` reservado; UI mínima si se expone en v2. |

### 4.2 Cuándo **no** proponer

- Primeros turnos de **ventilación** sin ancla accionable.
- Clasificación **crisis**, **HIGH** o **MEDIUM** en protocolo crisis activo.
- Usuario dijo explícitamente que **no quiere** tareas ni ejercicios en ese hilo.
- Ya hay **3** compromisos activos visibles en foco (§7).
- Misma conversación: máx. **1** propuesta de compromiso no solicitada por cada **30 min** (enfriamiento).

### 4.3 Confirmación obligatoria

- La IA puede **detectar** candidatos en el texto; el servidor solo persiste tras **acción explícita** del usuario (tap en CTA, confirmación en modal o `POST` deliberado).
- Edición del `label` antes de guardar siempre permitida.

---

## 5. Modelo de datos (`SessionCommitment`)

Implementación actual (`backend/models/SessionCommitment.js`); extensiones v1 en **negrita**:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | ObjectId | Propietario |
| `conversationId` | ObjectId \| null | Conversación de origen |
| `label` | string 2–240 | Texto del acuerdo (guardrails clínicos) |
| `source` | enum | `session_insight` \| `manual` \| `chat_action` \| **`chat_proposed`** (nuevo, propuesta confirmada desde chat) |
| `status` | enum | `active` \| `completed` \| `skipped` \| `archived` |
| `followUpAt` | Date | Default **+72 h** desde creación |
| `followUpAnswer` | enum | `pending` \| `yes` \| `partial` \| `no` |
| `completedAt` | Date \| null | |
| `sourceMeta` | object \| null | `{ interventionId?, taskId?, habitId?, proposedMessageId? }` |
| **`followUpAttempts`** | number | Contador de intentos de follow-up (dashboard + chat); default `0` |
| **`lastFollowUpAt`** | Date \| null | Último recordatorio mostrado |
| **`renegotiatedFrom`** | ObjectId \| null | Si se acortó desde otro compromiso archivado |

**Límites servidor (mantener / ajustar):**

- Máx. **12** activos por usuario (backend).
- Máx. **3** mostrados en foco del dashboard (producto).
- Máx. **2** creaciones sugeridas por cierre de sesión.

---

## 6. API HTTP

Base: **`/api/session-commitments`** (autenticado). Copy i18n: `sessionCommitmentApiCopy`.

### 6.1 `GET /`

Query: `status` (`active` \| `all`), `limit` (default 8, max 20).

Respuesta: `{ success, commitments: Commitment[] }`.

### 6.2 `POST /`

Body:

```json
{
  "label": "Caminar diez minutos después del almuerzo",
  "conversationId": "<optional ObjectId>",
  "source": "session_insight",
  "followUpHours": 72,
  "sourceMeta": { "interventionId": "behavioral_activation" }
}
```

Errores: `labelRequired`, `labelTooLong`, `labelClinical`, `tooManyActive` (409).

### 6.3 `PATCH /:id`

Body parcial:

| Campo | Efecto |
|-------|--------|
| `followUpAnswer: yes` \| `partial` | Marca `completed` + `completedAt` |
| `followUpAnswer: no` | Mantiene `active`; dispara flujo renegociación en cliente |
| `status: skipped` | **Omitir** — no cuenta como fracaso |
| `status: archived` | Archivo tras renegociación |
| `label` (v1.1) | Renegociación: nuevo texto, opcional `renegotiatedFrom` |

### 6.4 Integración dashboard

`GET /api/summary/focus` incluye hasta **5** compromisos activos; la UI de foco muestra máx. **3** con follow-up pendiente.

---

## 7. Follow-up: dashboard + chat

### 7.1 Dashboard (`DashboardFocusCard`)

- Sección «Compromisos y foco» (copy `FOCUS_COMMITMENTS`).
- Por ítem con `followUpAnswer === pending` y `followUpAt <= now` (o sin fecha y ≥48 h desde creación):
  - Pregunta: `FOCUS_COMMITMENT_FOLLOW_UP` («¿Pudiste con esto?»).
  - Chips: **Sí** \| **En parte** \| **Aún no** \| **Omitir** (nuevo; `status: skipped`).
- Si respondió en dashboard → **no** repetir la misma pregunta en chat.

### 7.2 Chat (apertura suave)

**Condiciones** (todas):

1. Hay ≥1 compromiso `active` con `followUpAnswer === pending`.
2. Pasaron ≥**48 h** desde `createdAt` o desde `lastFollowUpAt`.
3. `followUpAttempts < 2` para ese compromiso.
4. Usuario **no** está en crisis / post-crisis reciente.
5. No se mostró follow-up de compromisos en **esta** conversación en las últimas 24 h.

**Comportamiento:**

- Inyectar en prompt sección «Compromisos pendientes» (máx. **1** ítem, el más antiguo).
- La IA abre con **una** frase de invitación; si el usuario ignora o cambia de tema, **no insistir** en ese hilo.
- Al mostrar follow-up en chat: `PATCH` con `followUpAttempts++` y `lastFollowUpAt = now` (nuevo campo o vía servicio dedicado).

### 7.3 Respuesta «Aún no» y renegociación

| Respuesta | Acción sistema | Copy orientativo (ES) |
|-----------|----------------|------------------------|
| **Sí** | `completed` | Breve validación del esfuerzo; sin gamificación infantil |
| **En parte** | `completed` o mantener `active` según producto | Una pregunta: «¿Qué parte sí y qué faltó?» + opción «Ajustar compromiso» |
| **Aún no** | `followUpAnswer: no`, `active` | «Está bien. ¿Lo hacemos más pequeño, lo dejamos para otro momento o lo omitimos por ahora?» |
| **Omitir** | `status: skipped` | Sin culpa; no reintentar salvo reactivación manual |

Tras **2** intentos sin cierre positivo: sugerir **archivar** o **renegociar** (nuevo `label` más pequeño, `renegotiatedFrom` apuntando al anterior archivado).

---

## 8. Crisis, invitado y exclusiones

| Contexto | Crear compromiso | Follow-up | Notificaciones |
|----------|------------------|-----------|----------------|
| Usuario autenticado normal | Sí (con reglas §4) | Sí (§7) | Opt-in §9 |
| Chat invitado | **No** | **No** | **No** |
| Crisis / hard-stop activo | **No** | **No** | **No** |
| `crisis_recovered` &lt; 24 h | **No** crear | **No** follow-up | **No** |
| Sesión WAI / cierre tramo pánico | Crear solo si usuario pide explícito en insight | Igual reglas |

---

## 9. Notificaciones (opt-in)

- Toggle en Ajustes (misma área que señales / insight semanal): «Recordarme compromisos pendientes».
- **Máximo 1 push / email resumen por semana** si hay compromisos `pending` sin respuesta.
- Copy invitacional: «Tienes algo que habíamos dejado para retomar cuando te venga bien» — sin «pendiente», «deber» ni «no completaste».
- Deep link: abre **dashboard foco** o chat según preferencia (v1: dashboard).
- Respeta **#41** ventana silenciosa y pausa terapéutica si existe.

---

## 10. Puente tarea / hábito (#52–#53)

Tras confirmación exitosa de tarea u hábito desde chat:

1. Si el borrador encaja con un acuerdo conversacional reciente, mostrar chip: `CTA_SAVE_COMMITMENT` / «También como compromiso de sesión».
2. `POST /api/session-commitments` con `source: chat_action`, `sourceMeta: { taskId \| habitId, interventionId? }`.
3. En foco: indicador discreto si hay vínculo («También en tus hábitos»).

Inverso: al guardar compromiso desde `SessionInsight`, si `interventionId` o heurística detectan conducta repetible, ofrecer «Convertir en hábito» / «Añadir como tarea» usando `proposedProductActions` o navegación con draft.

---

## 11. Campo en respuesta del chat (v1 — propuesta)

### 11.1 Nombre y ubicación

- **Arreglo:** `proposedCommitments` (distinto de `proposedProductActions`).
- **Transporte:** mismo objeto que cierra SSE (`done: true`) y respuesta socket; ignorar si cliente antiguo.

### 11.2 Elemento del arreglo

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string UUID | Sí | Id de esta propuesta en el turno |
| `label` | string 2–240 | Sí | Texto sugerido (editable en confirmación) |
| `rationaleShort` | string | No | Para tarjeta («Por lo que comentaste…») |
| `sourceMeta` | object | No | `interventionId` si aplica |
| `suggestTask` | boolean | No | Si conviene ofrecer materialización |
| `suggestHabit` | boolean | No | Idem |

Límite: **≤ 1** `proposedCommitments` por turno.

### 11.3 UI cliente

- Tarjeta inline o sheet: **Guardar** \| **Editar y guardar** \| **Ahora no**.
- «Ahora no» no persiste; no incrementa contadores de follow-up.

---

## 12. Telemetría

Eventos sugeridos (`metricsService` o `POST /api/metrics/...`):

| Evento | Cuándo |
|--------|--------|
| `commitment_proposed` | Servidor incluye `proposedCommitments` o insight sugiere texto |
| `commitment_created` | `POST` 201 |
| `commitment_create_dismissed` | Usuario rechaza propuesta |
| `commitment_follow_up_shown` | `surface`: `dashboard` \| `chat` \| `push` |
| `commitment_follow_up_answered` | `answer`: yes \| partial \| no \| skipped |
| `commitment_renegotiated` | Nuevo label tras «Aún no» |
| `commitment_linked_task` \| `commitment_linked_habit` | Puente ecosistema |

---

## 13. Copy i18n (claves mínimas)

| Clave | ES (referencia) | Notas |
|-------|-----------------|-------|
| `FOCUS_COMMITMENTS` | Compromisos y foco | |
| `FOCUS_COMMITMENT_FOLLOW_UP` | ¿Pudiste con esto? | Suave; revisar si suena evaluativo |
| `FOCUS_COMMITMENT_OMIT` | Omitir por ahora | **Nueva** |
| `FOCUS_COMMITMENT_RENEGOTIATE` | Ajustar compromiso | **Nueva** |
| `CTA_SAVE_COMMITMENT` | Guardar como compromiso | Existente |
| `CHAT_COMMITMENT_PROPOSE_TITLE` | ¿Lo dejamos para retomar? | **Nueva** |
| `CHAT_COMMITMENT_OPENING` | (solo prompt) | Variantes para apertura en chat |
| `NOTIF_COMMITMENT_WEEKLY` | Tienes algo que habíamos dejado para retomar | Push semanal |

Tono: **tú**, español neutro; EN en `en.js` con misma intención.

---

## 14. Checklist de implementación

### v1.0 — cerrado (validado jul 2026)

- [x] Modelo `SessionCommitment` + CRUD `/api/session-commitments`
- [x] CTA en `SessionInsightScreen` (`source: session_insight`)
- [x] Lista en `GET /api/summary/focus` + chips Sí / En parte / Aún no / **Omitir** en dashboard
- [x] Guardrails clínicos en `label` (+ rechazo de labels genéricos del catálogo)
- [x] Campos `followUpAttempts`, `lastFollowUpAt`, `source: chat_proposed`, `renegotiatedFrom`
- [x] `proposedCommitments` en chat (≤1/turno) + tarjeta de confirmación
- [x] Puente post task/habit → compromiso opcional (`source: chat_action`)
- [x] Puente compromiso → tarea/hábito en insight
- [x] Inyección prompt: compromisos pendientes en apertura chat (§7.2), **unificada** con chips (sin doble snippet)
- [x] Exclusión crisis activa + **post-crisis 24 h** (`crisis_hard_stop` / `crisis_protocol_exit`) en propuesta y follow-up
- [x] Chat invitado sin compromisos (rutas autenticadas)
- [x] Notificación semanal opt-in (máx. 1/7 días)
- [x] Telemetría §12 (mayoría; `commitment_follow_up_shown` en chat)
- [x] i18n claves §13
- [x] Renegociación: `PATCH` con `renegotiate: true` archiva anterior y crea nuevo con `renegotiatedFrom`
- [x] Chip **Omitir** en follow-up de chat
- [x] Tests: crisis, cap 30 min, follow-up, smoke `smoke-commitments-v1.mjs`, paridad v1 follow-up

### v1.1 — siguiente iteración

- [ ] Pantalla dedicada «Mis compromisos» (lista completa, búsqueda)
- [ ] `PATCH /:id` con solo `label` documentado como renegociación in-place (deprecar en favor de `renegotiate`)
- [x] Telemetría `commitment_follow_up_shown` con `surface: dashboard` y `push`
- [ ] Respuesta «En parte» puede mantener `active` (hoy siempre `completed`)
- [ ] Máx. **2** sugerencias de texto en cierre de sesión (hoy 1 `suggestedStep`)
- [ ] Variación de copy en follow-ups estructurados tras varios turnos en protocolo
- [ ] Tests de integración HTTP `/api/session-commitments`
- [ ] Clave i18n dedicada `NOTIF_COMMITMENT_WEEKLY` (hoy pool push)
- [ ] Botón separado «Editar y guardar» en tarjeta chat (`CHAT_COMMITMENT_EDIT_SAVE`)

---

## 15. Criterios de aceptación (QA)

1. Usuario en desahogo **no** recibe propuesta de compromiso sin pedirlo.
2. Ningún compromiso se guarda sin tap explícito de confirmación.
3. Responder en dashboard **no** dispara la misma pregunta al abrir chat el mismo día.
4. Usuario en crisis **no** ve follow-up de compromisos ni propuestas nuevas.
5. «Omitir» archiva sin mensajes de culpa posteriores en 7 días.
6. Tras 2 «Aún no», el sistema ofrece renegociar u omitir — no un tercer recordatorio automático.
7. Compromiso vinculado a hábito muestra indicador en foco; marcar hábito no cierra compromiso solo.
8. Push semanal solo si opt-in; máx. 1 en 7 días.

---

*Última actualización: Julio 2026 (v1.0 cerrado). Revisar `backend/scripts/smoke-commitments-v1.mjs` antes de abrir v1.1.*
