# Contrato v1: soft landing post-crisis (#225)

**Versión:** 1.1  
**Fecha:** Julio 2026  
**Relacionado:** [PROTOCOLO_CRISIS_V1.md](./PROTOCOLO_CRISIS_V1.md) (§4.2), [PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md](./PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md) (**#225**, **#19**, **#93**, **#205**), [CONTRATO_COMPROMISOS_V1.md](./CONTRATO_COMPROMISOS_V1.md) (cooldown post-crisis).

Este documento fija el **contrato de producto** para la ventana de presencia tras salir del protocolo de crisis o un hard-stop: tono, mute de CTAs productivos, strip de regulación, home y alineación del push de seguimiento. No sustituye el protocolo de crisis activo.

---

## 1. Promesa / no-promesa

| Sí | No |
|----|-----|
| Acompañar con tono breve y presente en las **48 h** tras salida o hard-stop | Reabrir el protocolo de crisis ni el panel T1–T5 por defecto |
| Apagar CTAs productivos (tareas, hábitos, compromisos, TCC, psicoed automática) | Empujar “deberes”, rachas o productividad |
| Ofrecer **una vez** técnicas de regulación (respiración / grounding) | Sustituir líneas de emergencia ni alertar contactos |
| Línea calmada en home y push de follow-up con el mismo tono | Segundo canal de nag ni mensajes fantasma en el hilo |
| Ceder ante nueva señal de batería / protocolo activo | Soft landing tras solo check-in suave **#19** (sin protocolo ni hard-stop) |

**Mantra de copy (ES):** «Estoy aquí cuando quieras» — sin culpa, sin evaluación, sin diagnóstico.

---

## 2. Disparador y ventana

| Campo | Valor |
|-------|--------|
| **Disparadores** | Métrica `crisis_protocol_exit` **o** `crisis_hard_stop` |
| **Ventana** | **48 h** desde el timestamp de la métrica más reciente que dispare |
| **Cooldown compromisos / experiencial** | Misma ventana de **48 h** (antes 24 h) |
| **Flag** | `ENABLE_SOFT_LANDING_POST_CRISIS` (default activo salvo `'false'`) |
| **Invitado** | Sin soft landing |

---

## 3. Superficies

### 3.1 Chat (políticas siempre)

Mientras la ventana esté activa y **no** haya protocolo #93 / hard-stop / soft check-in #19 en primer plano:

- Snippet de prompt: respuestas más breves, validación, sin empujar tareas/hábitos/compromisos/TCC/psicoed.
- Mute de `proposedProductActions`, tool `propose_product_action`, TCC lite, psicoed automática, sugerencias de técnicas no de regulación, propuestas/follow-up de compromisos y experiencial.

**Allowlist:** conversación; CTAs de regulación del strip; acceso manual a recursos de crisis si el usuario los abre.

### 3.2 Strip (solo primera apertura)

- Payload `softLanding.strip` en el turno / apertura de chat **una vez** por ventana.
- Contenido: kicker + validación + CTAs Respiración / Grounding + dismiss.
- Prioridad visual: protocolo (`CrisisResourcesStrip`) > soft check-in #19 > soft landing.
- Tras dismiss o “shown”, no volver a emitir strip hasta nueva métrica disparadora (nueva crisis).

### 3.3 Home

- Campo en `GET /api/summary/focus`: `softLanding: { active, endsAt, messageKey } | null`.
- UI: línea/tarjeta calmada; sin CTAs de producto agresivos ni puente mood→productividad ruidoso mientras `active`.

### 3.4 Push (`crisisFollowUp`)

- Sigue siendo **push-only** (no inserta `Message` en el hilo).
- Copy alineado al tono soft landing; primer follow-up alineado a ~48 h (ver constantes del servicio).
- Si hay actividad reciente del usuario, se omite el envío (lógica existente).

---

## 4. Telemetría (best-effort)

| Evento | Cuándo |
|--------|--------|
| `soft_landing_entered` | Primera detección de ventana activa en turno o focus (dedupe razonable) |
| `soft_landing_strip_shown` | Se emite payload de strip |
| `soft_landing_strip_dismissed` | Usuario descarta strip |
| `soft_landing_regulation_tap` | Tap en respiración/grounding desde strip (cliente) |

---

## 5. Criterios de aceptación

1. Tras exit o hard-stop, durante 48 h: sin propuestas de tarea/hábito/compromiso/TCC/psicoed automática.
2. Chat con tono breve/presente; el usuario puede hablar con normalidad.
3. Primera apertura de chat en ventana: strip descartable con regulación; no reaparece.
4. Home muestra línea calmada mientras `active`; desaparece al cumplirse 48 h.
5. Push de follow-up usa el nuevo tono; no hay doble nag inventado.
6. Nueva crisis en la ventana: protocolo gana; soft landing no tapa recursos.
7. Paridad ES/EN en superficies visibles.
8. Flag off: sin strip/home/snippet soft landing; cooldown de compromisos sigue la ventana del util (48 h) o el comportamiento documentado del flag.

---

## 6. Fuera de alcance v1

- Reabrir protocolo automáticamente.
- Alertas a contactos.
- Guía “buscar profesional” (#9).
- Push diario adicional.
- Strip en cada turno.
- Soft landing tras solo #19.

---

## 7. Gobernanza

Revisión **interna** producto/eng para v1 / v1.1. No gate clínica/legal formal pre-merge (a diferencia del protocolo #93).

---

## 8. v1.1 — pulido (cerrado en código)

Residuos de v1.0 que no cambian la promesa de producto. **No** es v2.

| # | Ítem | Criterio de cierre |
|---|------|--------------------|
| A | Telemetría `soft_landing_regulation_tap` | Cliente reporta tap en respiración/grounding del strip (`POST /api/metrics/soft-landing`) |
| B | Mute mood→producto en home | Con `softLanding.active`, el check-in de ánimo no ofrece BA/hábito/tarea; sí regulación o retomar chat |
| C | Dedupe `soft_landing_entered` | Una vez por ancla (`enteredAckAnchorAt`) con update atómico; strip también reclama ack atómico para evitar doble emisión en carrera |
| D | Smoke dispositivo | Checklist opcional en [SMOKE_SOFT_LANDING_POST_CRISIS.md](./SMOKE_SOFT_LANDING_POST_CRISIS.md); no bloquea `Sí*` |

### Checklist v1.1

- [x] A — regulation_tap
- [x] B — mood secondary CTAs
- [x] C — entered dedupe por ancla
- [ ] D — smoke dispositivo (manual / opcional)

---

## 9. Fuera de alcance hasta v2 (explícito)

No planificar como v1.x. Requiere señal de uso o decisión de producto nueva:

- Soft landing también tras solo check-in suave **#19**
- Ventana configurable o distinta por nivel de riesgo
- Insertar mensaje in-chat (no solo push) post-crisis
- Strip recurrente o journey multi-día
- Gate clínica/legal formal

---

*Última actualización: Julio 2026 (v1.1).*
