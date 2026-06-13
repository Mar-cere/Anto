# Release 1.4.3 — Acompañamiento TCC en chat

## Resumen

Cierre de la oleada prometida (~98%): marco TCC lite in-chat, continuidad con protocolos, psicoeducación ampliada, ranking de sugerencias, biblioteca de micro-guías y pulido BA.

## Incluye

- **TCC lite (#201):** 4 pasos en el hilo, strip de progreso, estado en conversación, handoff a registro AT con borrador, resume desde session insight.
- **Continuidad:** franja BA / exposición / AT / ABC; telemetría `shown` en grafo #127.
- **Psicoed (#85):** 9 temas (duelo, burnout); tarjetas con micro-pasos en chat (#78); sello clínico #111 en biblioteca, módulos y chat.
- **Sugerencias (#127):** ranking histórico visible; boost `topicFree` híbrido léxico + embeddings OpenAI (#218 fase 3, requiere `TOPIC_FREE_EMBEDDINGS_ENABLED=true`).
- **Grafo visual (#218):** mapa bipartito tema→intervención (SVG), toggle lista accesible, entrada desde estadísticas de técnicas.
- **BA (#88):** plan semanal, tendencia de ánimo, sync tarea/hábito ↔ slot, refresh al volver a la pantalla.
- **Micro-guías (#90–#99):** 19 guías in-app, API, biblioteca en Técnicas, tarjetas en chat y pantalla `MicroGuide`.
- **Session insight:** duración acotada a ventana activa (fix minutos inflados).
- **Transporte chat:** HTTP/SSE alineado con `chatTurnEnhancementsService` (paridad socket).

## QA en dispositivo (checklist)

1. Chat con distorsión detectada → strip TCC lite y avance de pasos.
2. Cerrar chat y reabrir → strip TCC lite restaurado.
3. Completar marco → CTA «Registrar pensamiento automático» crea borrador.
4. Session insight con patrón → «Explorar en el chat» retoma TCC.
5. Usuario con plan BA / exposición → franja de continuidad en chat.
6. BA: completar tarea vinculada desde Tareas → slot marcado al volver al plan.
7. Mensaje de duelo o agotamiento → sugerencia psicoed grief/burnout.
8. Sugerencias con historial → subtítulo «ordenadas según tu historial».
9. Sugerencia micro-guía (p. ej. ansiedad → STOP) → tarjeta «Micro-guía» → wizard por pasos.
10. Error de red al enviar con resume TCC desde insight → al reintentar, el resume sigue disponible.
11. Técnicas → «Micro-guías» → biblioteca con 19 guías → abrir una guía → sello editorial.
12. BA: volver desde Tareas/Hábitos → plan semanal y registros actualizados sin salir de BA.
13. Estadísticas de técnicas → «Tu mapa de temas e intervenciones» → mapa visual con líneas por fuerza.

## Pendiente post-1.4.3 (~2%)

- Merge a `main` y deploy Render.
- Grafo #218 fase 2: topicFree como nodos, correlación multimodal (#217).
- Backfill masivo de embeddings históricos y vector index (#126 / Atlas).
