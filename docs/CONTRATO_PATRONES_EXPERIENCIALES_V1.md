# Contrato v1: patrones experienciales / memoria del proceso (#203 / #211)

**Versión:** 1.1  
**Fecha:** Julio 2026  
**Relacionado:** [PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md](./PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md) (#203, #211, #1), [CONTRATO_COMPROMISOS_V1.md](./CONTRATO_COMPROMISOS_V1.md) (#202), [PROTOCOLO_CRISIS_V1.md](./PROTOCOLO_CRISIS_V1.md).

## 1. Promesa

| Sí | No |
|----|-----|
| Recordar observaciones subjetivas con ancla temporal («las mañanas eran difíciles») | Diagnosticar ni etiquetar esquemas clínicos |
| Retomar con contraste suave («¿sientes que ha cambiado?») | Insistir, culpar o evaluar |
| Anclar entre conversaciones si el mensaje solapa un patrón activo o pregunta por un recuerdo (con consent) | Inventar detalles fuera de patrones guardados |
| Consentimiento opt-in + archivar | Extraer o preguntar sin consentimiento |
| Coexistir con compromisos (#202) | Sustituir compromisos ni UserFact biográficos |

## 2. API

Base: `/api/experiential-patterns` (JWT).

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/consent` | `{ enabled, enabledAt }` |
| PATCH | `/consent` | `{ enabled: boolean }` |
| GET | `/` | Lista; `?activeOnly=true&limit=20` |
| POST | `/` | Crear manual (userConfirmed) |
| PATCH | `/:id` | `followUpStatus`, `archive`, `statement`… |
| DELETE | `/:id` | Soft-archive |

Flags: `EXPERIENTIAL_PATTERNS_ENABLED`, `EXPERIENTIAL_FOLLOWUP_ENABLED`, `EXPERIENTIAL_EXTRACT_ENABLED`.

## 3. Estados de follow-up

`pending` → (asked) → `changed` | `unchanged` | `skipped` | `archived`

- `changed` / `acknowledged`: reprograma ~60d, vuelve a `pending`.
- `unchanged`: reintento +21d (máx 2 attempts); luego archive.
- `skipped`: no volver a preguntar.
- `archived`: `isActive=false`.

## 4. Gates de chat

Prioridad: crisis → compromiso #202 due → patrón experiencial due (#211) → **recall temático (promesa B)** → RAG #203 (opt-in por env).

| Camino | Cuándo | Chips |
|--------|--------|-------|
| Follow-up due (#211) | `followUpAt` vencido, primer turno (o CTA Home) | Sí |
| Recall temático | Consent + patrones activos + solapamiento temático **o** pregunta por recuerdo | No (solo snippet) |
| RAG personal (#203) | Flag + embeddings + **mismo consent** + hits semánticos; **muteo** si hay #202 / #211 / recall | No |

Bloqueo: `isChatObservationalContextBlocked`, cooldown post-crisis (mismo util que #202). Sin consent → sin inject, extract ni index/retrieve RAG.

## 5. Extracción

Al cierre de sesión (job diferido, espejo last-session-summary): 0–2 patrones, confidence ≥ 0.75, dedupe `normalizedKey` 90d, cap 20 activos/usuario.

**Borrar conversación:** antes de `Message.deleteMany`, se agenda extract con `transcriptSnapshot` (delay corto). El worker usa el snapshot y no depende de mensajes ya borrados. `resetConversationSessionState` no cancela jobs que tengan snapshot.
