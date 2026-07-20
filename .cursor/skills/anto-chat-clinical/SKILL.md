---
name: anto-chat-clinical
description: >-
  Reglas clínicas, protocolo de crisis, guardrails de contenido y contratos del
  chat con IA en Anto. Usar al modificar chat, prompts, OpenAI, sugerencias
  terapéuticas, acciones de producto (tareas/hábitos), crisis, insights LLM
  o copy del asistente en backend/ o frontend/src/ relacionado con chat.
---

# Anto — chat, IA y seguridad clínica

Anto es un **acompañamiento emocional con IA**, no terapia ni servicio de emergencia. Todo cambio en chat debe respetar estos límites.

Complementa **anto-i18n-theme-review** (copy ES/EN y tono neutro).

## Skills relacionadas

| Si también… | Aplicar |
|-------------|---------|
| Copy visible al usuario | `anto-i18n-theme-review` |
| Endpoints de crisis/chat | `anto-backend-feature` |
| UI del chat (strips, modales) | `anto-ui-design` |
| Evaluar feature o copy de producto | `anto-product-narrative` (North Star, 5 preguntas) |

Índice: `.cursor/skills/README.md`

---

## Posicionamiento obligatorio

- Anto **complementa** ayuda profesional y líneas de crisis; **no sustituye** psicoterapia, psiquiatría ni emergencias.
- En modo crisis, el copy (es/en) debe comunicar este límite.
- Nunca prometer diagnóstico, medicación ni curación.

---

## Guardrails de contenido (`clinicalContentGuardrails.js`)

Texto visible al usuario (respuestas LLM, insights, patrones) debe pasar `sanitizeObservationalText` o equivalente.

**Prohibido** (patrones en `FORBIDDEN_CLINICAL_PATTERNS`):

| Categoría | Ejemplos a evitar |
|-----------|-------------------|
| Diagnóstico | «tienes depresión», «trastorno de ansiedad» |
| Medicación | recomendar o mencionar fármacos |
| Etiquetado | «estás deprimido/a», «tienes un…» |
| Citas largas | comillas con >20 caracteres de cita clínica |
| Ideación explícita en copy generado | manejar vía protocolo crisis, no en insights casuales |

```js
import { failsClinicalGuardrails, sanitizeObservationalText } from '../utils/clinicalContentGuardrails.js';

const safe = sanitizeObservationalText(llmOutput, 200); // null si falla guardrails
```

---

## Protocolo de crisis (`docs/PROTOCOLO_CRISIS_V1.md`)

### Niveles de respuesta

```
Riesgo + señales
├─ WARNING sin batería §2 → Check-in suave #19 (validación + CTAs respiración/grounding)
├─ WARNING/MEDIUM/HIGH + batería B1–B5 → Protocolo #93 (panel recursos, contención)
└─ Léxico explícito B1/B2 + WARNING+ → Camino A hard-stop (plantilla fija, sin LLM)
```

### Check-in suave #19

- Validación breve + CTAs a regulación (respiración, grounding).
- **Prohibido:** alerta a contactos, protocolo #93 completo, panel T1–T5.
- Salida: 2 turnos estables LOW/WARNING sin batería, o escalada.

### Camino A — Hard-stop

- Plantilla fija es/en (`crisisHardStopService`).
- Preguntas de seguridad + recursos por país + límites de la app.
- **Prohibido:** ejercicios terapéuticos, tareas/hábitos, TCC lite, psicoeducación.

### Camino B — LLM blindado

- Guion acotado: validar, 1–2 preguntas seguridad, recordar recursos, acompañar.
- **Prohibido:** mismos extras que camino A; sanitizer post-LLM activo.
- Si el usuario rechaza derivación: validar, no insistir en llamar (máx. 1 recordatorio suave por sesión).

### Bloqueo de extras terapéuticos

`isLlmCrisisTherapeuticExtrasBlocked` (`chatObservationalContext.js`) bloquea en WARNING/MEDIUM/HIGH o léxico explícito:

- Sugerencias de técnicas (`suggestions`)
- TCC lite, compromisos de seguimiento
- Cualquier extra terapéutico no esencial

Verificar que cambios nuevos en `chatTurnEnhancementsService` respeten `crisisBlocked`.

---

## Acciones de producto desde chat (`docs/CONTRATO_CHAT_ACCIONES_V1.md`)

### Principio central

**El modelo propone; el servidor valida; el usuario confirma.**

```
A — Propuesta (proposedProductActions en SSE done / respuesta JSON)
B — Confirmación en UI (modal con borrador editable)
C — Persistencia (POST /api/tasks o /api/habits con body final)
```

### Reglas

| Regla | Detalle |
|-------|---------|
| Sin auto-crear | Nunca `POST` tarea/hábito en el handler que genera la respuesta del chat |
| Confirmación obligatoria | Siempre paso B antes de persistir |
| Validación servidor | Joi + allowlist; re-validar tras enriquecimiento LLM |
| Límite por turno | ≤ 2 acciones productivas |
| Tope por conversación | `conversationProductProposalCapService` (cap + cooldown) |
| Idempotencia | `clientRequestId` opcional en paso C |
| Chat invitado | Sin propuestas productivas |
| Crisis / alto riesgo | Suprimir propuestas (mismo espíritu que bloqueo de extras) |

### Campo de transporte

`proposedProductActions[]` con `type` (`propose_task` | `propose_habit`), `id` (UUID), `draft` (alineado a schemas de task/habit).

---

## Estilos de comunicación (`docs/ESTILOS_COMUNICACION.md`)

| Campo | Fuente | Afecta |
|-------|--------|--------|
| `communicationStyle` | `UserProfile.preferences` | Tono, validación, reflexión (`buildPersonalizedPrompt`) |
| `responseStyle` | UserProfile > User.preferences | Longitud, estructura, maxWords |

Valores `communicationStyle`: `neutral`, `empatico`, `directo`, `exploratorio`, `estructurado` (+ alias `formal`→estructurado, `casual`→neutral).

Valores `responseStyle`: `brief`, `balanced`, `deep`, `empatico`, `profesional`, `directo`, `calido`, `estructurado`.

No mezclar los dos campos; cada uno tiene responsabilidad distinta.

Copy visible (tono neutro, ES/EN): skill **anto-i18n-theme-review**.

---

## Jerarquía canónica del system prompt

Al modificar prompts del chat, respetar este orden (si hay conflicto, gana el de arriba):

1. **Seguridad / crisis**
2. **Fidelidad al mensaje** (polaridad literal; no hipótesis categóricas no dichas)
3. **Ritmo conversacional** (diálogos; máx. 1 pregunta/turno; ejercicios = plus, no must)
4. **Preferencias explícitas** del usuario (brevedad/tono), salvo override de crisis
5. **Estilo / variación / herramientas opcionales**

Ensamblado: `buildContextualizedPrompt` en `backend/services/openai/openaiPromptBuilder.js`  
(snippets: `canonicalPromptHierarchySnippet`, `messageComprehensionSnippet`, grounding, paráfrasis).

Fuera de crisis, **no asumir** gana sobre paráfrasis empática creativa.

## Checklist al modificar chat

```
Chat / clínico:
- [ ] Sin diagnóstico, medicación ni etiquetado clínico en copy generado
- [ ] Outputs LLM pasan sanitizeObservationalText o guardrails equivalentes
- [ ] Crisis: respetar caminos A/B/#19; bloquear extras terapéuticos
- [ ] Product actions: proponer → confirmar → POST; nunca auto-persistir
- [ ] Guest chat: sin acciones productivas
- [ ] Copy ES/EN y tono neutro (skill anto-i18n-theme-review)
- [ ] Prompts: respetar jerarquía canónica; fidelidad > paráfrasis creativa
- [ ] Tests del dominio ejecutados (ver abajo), incl. test:prompt-golden si tocas prompts
```

---

## Tests recomendados

| Área | Comando |
|------|---------|
| Crisis completo | `cd backend && npm run test:crisis-protocol-suite` |
| Chat i18n / WAI | `cd backend && npm run test:session-wai-suite` |
| Prompts golden | `cd backend && npm run test:prompt-golden` |
| Guardrails clínicos | `tests/unit/utils/clinicalContentGuardrails.test.js` |
| Tono / voseo | `tests/unit/utils/copyToneGuards.test.js` |
| Product actions | tests en `chatProductAction*`, `actionSuggestionService` |
| Crisis blocked extras | `tests/unit/utils/chatObservationalContext.test.js` |
| Chat routes i18n | incluido en `npm run test:i18n` |

Ejecutar la suite más específica al área tocada; no solo `test:unit` genérico.

---

## Archivos clave

| Qué | Dónde |
|-----|-------|
| Protocolo crisis (doc) | `docs/PROTOCOLO_CRISIS_V1.md` |
| Contrato acciones chat | `docs/CONTRATO_CHAT_ACCIONES_V1.md` |
| Estilos comunicación | `docs/ESTILOS_COMUNICACION.md` |
| Playbook conversaciones | `docs/PLAYBOOK_OPERATIVO_MEJORA_CONVERSACIONES_V1.md` |
| Jerarquía canónica prompt | `backend/services/chat/canonicalPromptHierarchySnippet.js` |
| Comprensión / polaridad | `backend/services/chat/messageComprehensionSnippet.js` |
| Mapa herramientas app | `backend/services/chat/appToolkitMapSnippet.js` |
| Policy anti-cargante tareas/hábitos | `backend/services/chat/productActionProposalPolicySnippet.js` |
| Tool tareas/hábitos | `backend/services/chat/productActionTool.js` |
| Bridge técnicas / gratitud (prompt) | `backend/services/chat/techniqueSuggestionPromptSnippet.js` |
| Soft check-in #19 prompt | `backend/services/chat/softCrisisCheckInPromptSnippet.js` |
| Retención primeros turnos | `backend/services/chat/earlyConversationRetentionSnippet.js` |
| Continuidad emocional de hilo | `backend/services/chat/emotionalThreadContinuity.js` |
| Fidelidad observacional (satélites) | `backend/services/chat/observationalFidelitySnippet.js` |
| Guardrails contenido | `backend/utils/clinicalContentGuardrails.js` |
| Tono español | `backend/utils/copyToneGuards.mjs` |
| Crisis turn extras | `backend/services/crisisTurnClientExtrasService.js` |
| Hard-stop | `backend/services/crisisHardStopService.js` |
| Soft check-in #19 | `backend/services/softCrisisCheckInService.js` |
| Bloqueo extras crisis | `backend/utils/chatObservationalContext.js` |
| Turn enhancements | `backend/services/chatTurnEnhancementsService.js` |
| Cap propuestas | `backend/services/conversationProductProposalCapService.js` |
| Rutas chat | `backend/routes/chatRoutes.js` |
| Guest chat | `backend/routes/guestChatRoutes.js` |
| Frontend crisis strip | `frontend/src/components/chat/` (CrisisResourcesStrip) |

---

## Árbol de decisión

```
¿El cambio afecta texto que ve el usuario?
├─ Sí → guardrails clínicos + tono neutro + i18n
└─ No → continuar

¿Afecta respuesta en crisis o riesgo elevado?
├─ Sí → leer PROTOCOLO_CRISIS_V1; verificar bloqueo de extras
└─ No → continuar

¿Afecta tareas/hábitos desde chat?
├─ Sí → CONTRATO_CHAT_ACCIONES_V1; confirmación obligatoria
└─ No → continuar

¿Afecta prompts o longitud de respuesta?
└─ Sí → ESTILOS_COMUNICACION; test:prompt-golden
```
