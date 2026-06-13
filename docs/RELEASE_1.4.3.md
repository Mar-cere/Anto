# Release 1.4.3 — Acompañamiento TCC en chat

## Resumen

Oleada 1.4.3 **completa en `main`**: marco TCC lite inline, continuidad, psicoeducación, ranking semántico topicFree, grafo visual fase 2 y micro-guías timeline.

## Incluye

- **TCC lite (#201):** 4 pasos en el hilo, progreso inline en burbuja, handoff AT al completar, resume desde session insight.
- **Continuidad:** franja BA / exposición / AT / ABC; telemetría `shown` en grafo #127.
- **Psicoed (#85):** 9 temas (duelo, burnout); tarjetas chat (#78); sello clínico #111.
- **Sugerencias (#127):** ranking histórico + boost topicFree híbrido (léxico + embeddings OpenAI).
- **Embeddings topicFree:** activos en prod/Render por defecto si hay `OPENAI_API_KEY` (opt-out: `TOPIC_FREE_EMBEDDINGS_ENABLED=false`). Backfill: `npm run backfill:topic-free-embeddings`.
- **Grafo visual (#218 fase 1+2+3):** tema→intervención + nodos topicFree + **conceptos semánticos agrupados**, correlaciones multimodales MVP (#217), búsqueda vectorial Atlas (#126) con fallback scan.
- **BA (#88):** plan semanal, ánimo, sync tarea/hábito, refresh al volver.
- **Micro-guías (#90–#99):** 19 guías, biblioteca, pantalla timeline única.
- **Session insight:** duración ventana activa (fix minutos inflados).
- **Transporte chat:** HTTP/SSE alineado con `chatTurnEnhancementsService`.
- **Motor multimodal (#217):** telemetría tecleo (#215), fenotipado digital (#216), informe semanal (#208) con UI revelación (#213), consentimiento granular en `/api/signals`.

## QA en dispositivo (checklist)

1. Chat con distorsión → pie de progreso TCC **inline** en burbuja de Anto.
2. Cerrar chat y reabrir → último mensaje con `metadata.tccLite` muestra el paso correcto.
3. Completar marco → franja compacta «¿Lo registramos en el pensamiento automático?».
4. Session insight → «Explorar en el chat» retoma TCC.
5. Usuario con BA / exposición → franja continuidad en chat.
6. BA: tarea vinculada completada → slot marcado al volver.
7. Duelo o agotamiento → psicoed grief/burnout.
8. Sugerencias con historial → «ordenadas según tu historial».
9. Micro-guía en chat → biblioteca → pantalla **timeline** (no wizard).
10. Error de red con resume TCC → reintento conserva payload.
11. Biblioteca 19 micro-guías + sello editorial.
12. BA: volver desde Tareas/Hábitos → plan actualizado.
13. Estadísticas → mapa visual; si hay mensajes en chat, **nodos concepto** (ideas agrupadas) o topicFree, y tarjeta «Patrones observados».
14. Resumen semanal → «Ver patrones de la semana» → pantalla **WeeklyInsight** (#213).
15. Activar consentimiento tecleo → escribir en chat → métricas agregadas (sin texto extra).
16. Activar salud digital → sync stub/API listo para HealthKit nativo (dev client).

## Señales multimodales (#215–#217 / #208 / #213)

- API: `GET/PATCH /api/signals/consent`, `POST /api/signals/typing-telemetry`, `POST /api/signals/digital-phenotype/sync`, `GET /api/signals/weekly-insight`
- Worker: `ENABLE_WEEKLY_PATTERN_INSIGHT` (default on) — tick `WEEKLY_PATTERN_INSIGHT_TICK_MS` (120s)
- HealthKit / Health Connect: puente frontend `digitalHealthBridge.js` (requiere módulo nativo en dev client)

## Atlas vector search (#126)

1. Backfill embeddings: `npm run backfill:topic-free-embeddings -- --limit=1000`
2. Imprimir definición índice: `npm run print:atlas-topic-free-index`
3. Crear índice en Atlas Search (JSON Editor) sobre colección `chatinterventionevents`
4. En Render: `ATLAS_VECTOR_SEARCH_ENABLED=true` (+ opcional `ATLAS_TOPIC_FREE_VECTOR_INDEX=topic_free_embedding_index`)

Sin Atlas, el ranking y el grafo usan **modo scan** (cosine local).

## Pendiente post-1.4.3

- Deploy Render + build tiendas 1.4.3.
- Backfill inicial en prod: `TOPIC_FREE_EMBEDDINGS_ENABLED=true npm run backfill:topic-free-embeddings -- --limit=1000`.
- Integración nativa HealthKit (#216) en dev client iOS + Health Connect Android.
- #203 RAG patrones, #210 esquemas, narrativa LLM en informe #208 (opcional).
