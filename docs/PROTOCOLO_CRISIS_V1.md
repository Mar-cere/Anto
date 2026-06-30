# Protocolo de crisis v1

**Versión:** 1.0 (aprobado clínica/legal 30 jun 2026)  
**Fecha:** 30 jun 2026  
**Relacionado:** [PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md](./PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md) (**#93**, **#9**, **#10**, **#205**), implementación en `crisisHardStopService`, `crisisBackgroundActionsService`, `CrisisResourcesStrip`.

Este documento fija el **contrato de producto y clínico-operativo** para el modo crisis en Anto. **Revisión clínica/legal aprobada (30 jun 2026).** Filas **#93**, **#10** y **#205** en matriz: **Sí***; pendiente único de cierre producto: **smoke dispositivo físico**.

---

## 1. Marco de producto

### 1.1 Promesa en crisis

Anto ofrece, en este orden de prioridad:

1. **Contención inmediata** — validación y presencia sin sobre-intervenir.
2. **Recursos** — líneas de ayuda y contactos configurados, visibles sin presión.
3. **Acompañamiento** — hilo acotado hasta salida del protocolo (no terapia abierta).
4. **Alerta a terceros** — solo según reglas de §5 (híbrido); nunca incluye el texto del chat.

### 1.2 Posicionamiento

Anto es **complemento** de la ayuda profesional y de las líneas de crisis. **No sustituye** psicoterapia, psiquiatría ni servicios de emergencia.

Copy obligatorio en modo crisis (es/en): el asistente y el panel deben comunicar este límite.

### 1.3 Activación del modo protocolo

El modo protocolo **#93** se activa cuando:

- El **riesgo** es **WARNING** o superior **y** hay al menos una señal de la **batería v1** (§2), **o**
- El riesgo es **MEDIUM** / **HIGH** con evidencia acumulada según `buildCrisisActionDecision`.

El **malestar elevado sin señales de batería** queda **fuera** de este protocolo (futuro **#19** check-in crisis suave).

### 1.4 Éxito del protocolo

El protocolo se considera **cumplido** cuando se registra salida (§4) tras:

- **Contención** sostenida sin escalada de riesgo, **y**
- **Oferta de recursos** mostrada al menos una vez (panel o mensaje), **y**
- Criterio de salida §4 satisfecho.

Métrica analítica: evento `crisis_protocol_exit` (§4.3).

---

## 2. Batería de indicadores v1

Lista explícita de señales que activan o mantienen el modo protocolo. **Adicción en crisis** usa el **mismo flujo** que ideación/autolesión; cambian copy y recursos sugeridos, no la arquitectura.

| ID | Categoría | Ejemplos (no exhaustivo) | Routing típico |
|----|-----------|--------------------------|----------------|
| B1 | Ideación / suicidio explícito | «quiero morirme», «no quiero seguir viviendo» | Camino A si léxico + WARNING+; si no, B |
| B2 | Autolesión explícita | «me corté», «me haría daño» | Igual que B1 |
| B3 | Plan o intención | plan concreto, medios, despedidas | B o A según riesgo y léxico |
| B4 | Adicción en crisis | sobredosis, miedo a recaer inminente, «no puedo parar» | Mismo protocolo; recursos de sustancias si aplica |
| B5 | Deterioro acumulado | aislamiento + empeoramiento + historial reciente | Camino B; alerta terceros solo §5 |
| — | Malestar sin batería | ansiedad/tristeza sin señales anteriores | **Fuera** de #93 |

**Señales técnicas** (ya en código, alineadas a esta batería): `advanced_planning`, `farewell_signals`, `obsessive_distress`, `isolation`, `communication_disengagement`, `trend_deterioration`, `recent_crisis_history`, léxico explícito (`hasExplicitSuicidalOrSelfHarmLexicon`).

---

## 3. Flujo conversacional

### 3.1 Camino A — Hard-stop (sin LLM)

**Condición:** `shouldHardStopCrisisLlm` — léxico explícito B1/B2 + riesgo WARNING, MEDIUM o HIGH (`ENABLE_CRISIS_HARD_STOP`).

**Contenido (plantilla fija, es/en):**

1. Preguntas de seguridad inmediata (¿estás a salvo?, ¿hay alguien cerca?).
2. Recursos humanos por país (`formatCrisisEmergencyResources`).
3. Límites de la app (no llama ni envía mensajes por el usuario).
4. Cierre de contención («puedes responder aquí cuando puedas»).

**Prohibido en camino A:** ejercicios terapéuticos, tareas/hábitos, TCC lite, psicoed.

### 3.2 Camino B — LLM blindado

**Condición:** modo protocolo sin hard-stop, o riesgo MEDIUM/HIGH con contexto crisis.

**Guion acotado (system / constraints):**

1. Validar emoción y urgencia.
2. Una o dos preguntas de seguridad si no están respondidas.
3. Recordar recursos y panel (`CrisisResourcesStrip`).
4. Acompañar sin consejos genéricos ni técnicas.
5. Si el usuario **rechaza derivación** (§3.3), no insistir en llamar.

**Prohibido en camino B:** mismos extras que camino A; sanitizer post-LLM activo.

### 3.3 Rama — Rechazo de derivación

Si el usuario indica que no quiere llamar, ir a urgencias o avisar a nadie:

```
→ Validar: «Entiendo, no tienes que hacerlo ahora.»
→ Mantener contención y dejar panel/recursos disponibles (no invasivo).
→ No repetir CTA de llamada en cada turno (máximo 1 recordatorio suave por sesión de protocolo).
→ Continuar hasta criterio de salida §4.
```

### 3.4 Panel de recursos en chat

Componente: `CrisisResourcesStrip` + `GET /api/health/crisis-resources`.

Debe mostrar **siempre visible** en modo protocolo (§6 — transparencia #10):

- Bloque **«Por qué ves esto»** (copy fijo §6).
- Líneas marcables por país.
- Acceso a contactos de emergencia en Perfil.
- **No** incluir enlaces «buscar profesional» — **#9 pospuesto** (fuera de planes inmediatos).

---

## 4. Salida del protocolo

### 4.1 Criterios (cualquiera de los dos)

| ID | Criterio | Definición |
|----|----------|------------|
| S1 | Medidores estables | `riskLevel` en **LOW** o **WARNING** bajo durante **2 turnos consecutivos** del usuario **sin** nueva señal de batería §2 |
| S2 | Confirmación explícita | Usuario indica bienestar: «estoy bien», «ya estoy a salvo», «me siento mejor», equivalentes es/en |

### 4.2 Comportamiento tras salida

- Transición gradual a modo conversación normal (sin técnicas automáticas en el mismo turno).
- Opcional: estado de sesión `crisis_recovered` para exclusiones (WAI, etc.).
- No reabrir protocolo en el mismo hilo salvo nueva señal de batería.

### 4.3 Evento analítico

Registrar `crisis_protocol_exit` con:

| Campo | Valores |
|-------|---------|
| `reason` | `meters_stable_2_turns` \| `user_explicit_ok` \| `both` |
| `riskLevelAtExit` | LOW, WARNING, … |
| `hadContactAlert` | boolean |
| `protocolVersion` | `1.0` |

---

## 5. Alerta a terceros (opción C — híbrido)

### 5.1 Principios

- El contacto recibe **solo** aviso breve (nombre del usuario + nivel de riesgo); **nunca** el contenido del chat.
- El usuario es informado **después** del envío, con copy calmado (§6.4).
- Cooldown entre alertas: **60 min** por usuario (actual).

### 5.2 Reglas de envío

| Nivel | Evidencia | Alerta a contactos |
|-------|-----------|-------------------|
| **HIGH** | Batería explícita (B1–B4) o pico con confianza ≥ 0,9 + evidencia fuerte | **Automática** si hay contactos `enabled` |
| **MEDIUM** | Evidencia acumulada (B5, señales moderadas) | **Preguntar** en el hilo: «¿Quieres que avise a [nombre]? No compartiré lo que escribiste.» |
| **WARNING** | Cualquiera | **No** alerta a terceros; push/recursos sí |

Implementación actual de referencia: `buildCrisisActionDecision` + `emergencyAlertService.sendEmergencyAlerts`. El comportamiento MEDIUM **preguntado** puede requerir ajuste de código respecto al auto actual en MEDIUM+0,95 — ver checklist §8.

### 5.3 UX post-envío (automático o confirmado)

Mostrar en chat (tarjeta, no modal bloqueante previo):

> Si tenías contactos de emergencia activos, les enviamos un aviso breve de que podrías necesitar apoyo. **No incluye el texto de esta conversación.** Puedes revisar tus contactos en Perfil.

Push al usuario: alineado a `emergency:alert:sent` / copy pools existentes.

---

## 6. Transparencia (#10) — copy siempre visible

En el panel de crisis y, resumido, en el primer mensaje del protocolo:

| # | Bloque | ES (plantilla) |
|---|--------|----------------|
| T1 | Por qué | «Detectamos señales de riesgo elevado en lo que compartiste.» |
| T2 | Qué hace Anto | «Priorizamos contención y recursos humanos en lugar de ejercicios.» |
| T3 | Límite | «Anto complementa, no sustituye, ayuda profesional o una línea de crisis.» |
| T4 | Acompañamiento | «Seguiremos aquí hasta que indiques que te sientes mejor o las señales se estabilicen.» |
| T5 | Contactos | §5.3 (solo si hubo alerta) |

Traducción EN obligatoria antes de cierre **#151** / **#153**.

---

## 7. Fuera de alcance v1

| Tema | Propuesta | Motivo |
|------|-----------|--------|
| Buscar psicólogo / guía profesional | **#9** | Pospuesto; no mostrar en UI |
| Check-in crisis suave | **#19** | Malestar sin batería |
| Explicación técnica del clasificador | — | Solo copy humano §6 |
| Integración salud / telepsicología | — | Futuro |

**#9 en v1 crisis:** líneas por país + contactos de emergencia + panel crisis (sin guía profesional; ampliación **#9** pospuesta).

---

## 8. Checklist de cierre (matriz)

Marcar **#93** / **#205** (producto) / **#10** según fila.

**Estado (30 jun 2026):** implementación v1 en `main` (PR #4 + #5); revisión clínica/legal aprobada; filas matriz **Sí***. **Pendiente cierre:** smoke dispositivo físico.

### #93 — Protocolo ideación

- [x] Revisión clínica del documento y batería §2 (30 jun 2026)
- [x] Revisión legal (alertas, copy, menores si aplica) (30 jun 2026)
- [x] Plantillas camino A es/en alineadas a §3.1 (`crisisHardStopService`)
- [x] Constraints camino B y rama rechazo §3.3 en prompt (`crisis.js`)
- [x] Tests unitarios: `crisisHardStopService`, `crisisProtocolService`, decisión MEDIUM
- [ ] Smoke dispositivo físico (flujo crisis end-to-end)
- [ ] Tests integración: `crisisDetectionFlow` (CI con API keys; no bloquea Sí*)

### #205 — Guardrails

- [x] Camino A/B según §3
- [x] Salida §4 + evento `crisis_protocol_exit`
- [x] MEDIUM alerta **preguntada** (§5.2) con validación de oferta y dismiss
- [x] Post-envío §5.3 en UI (`CrisisResourcesStrip` + WebSocket)
- [ ] Smoke dispositivo físico (camino A/B + alertas híbridas)

### #10 — Transparencia

- [x] Bloques T1–T5 siempre visibles en `CrisisResourcesStrip`
- [x] Misma semántica en push de crisis relevantes (copy §5.3 / `emergency:alert:sent`)
- [ ] Smoke dispositivo físico (panel crisis + transparencia T1–T5)

### #9 — Derivación

- [x] **Pospuesto** (30 jun 2026): fuera de planes inmediatos; sin guía «buscar profesional» ni dashboard en roadmap
- [x] v1 crisis: líneas por país + contactos + copy complemento (§1.2)

---

## 9. Gobernanza

| Rol | Responsabilidad |
|-----|-----------------|
| Clínico asesor | Valida batería, guion, límites |
| Legal | Valida alertas a terceros y copy |
| Producto | Prioriza checklist §8 |
| Ingeniería | Implementa gaps §5.2 MEDIUM preguntado, §4.3, §6 UI |

**Revisión periódica:** trimestral o tras incidente, cambio regulatorio o nuevo país.

**Versionado:** incrementar `protocolVersion` en eventos y changelog al pie de este doc.

---

*Última actualización: 30 jun 2026 — revisión clínica/legal aprobada; matriz **#93**, **#10**, **#205** → **Sí***; pendiente smoke dispositivo físico.*
