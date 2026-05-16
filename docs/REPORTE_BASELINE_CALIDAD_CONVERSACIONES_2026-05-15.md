# Reporte baseline de calidad conversacional (2026-05-15)

Este baseline consolida 5 exports de conversaciones evaluados con:

- `npm run quality:conversations -- /ruta/archivo.json --json`

Archivos evaluados:

- `/Users/marceloull/Documents/primero.json`
- `/Users/marceloull/Documents/segundo.json`
- `/Users/marceloull/Documents/tercero.json`
- `/Users/marceloull/Documents/cuarto.json`
- `/Users/marceloull/Documents/test.messages.json`

## Resumen global (baseline)

- Conversaciones: `5`
- Mensajes totales: `169`
- Mensajes del asistente: `87`
- Promedio de longitud del asistente: `174.2` caracteres
- Densidad de preguntas del asistente: `66.8%`
- Cumplimiento de brevedad post-pedido: `36.7%` (49 turnos aplicables)
- Guardrail factual: `0.0%` (11 consultas factuales detectadas)
- Protocolo de crisis: `n/a` (sin triggers explícitos en la muestra)

## Detalle por archivo

- `primero.json`: asst=9, avg_chars=168.4, preguntas=77.8%, brevedad=n/a, factual=n/a, crisis=n/a
- `segundo.json`: asst=4, avg_chars=167.0, preguntas=50.0%, brevedad=n/a, factual=n/a, crisis=n/a
- `tercero.json`: asst=11, avg_chars=153.1, preguntas=90.9%, brevedad=n/a, factual=n/a, crisis=n/a
- `cuarto.json`: asst=12, avg_chars=153.8, preguntas=91.7%, brevedad=n/a, factual=n/a, crisis=n/a
- `test.messages.json`: asst=51, avg_chars=185.2, preguntas=54.9%, brevedad=36.7%, factual=0.0%, crisis=n/a

## Lectura rápida

- Fortaleza:
  - La base ya permite medir consistencia entre lotes y detectar regresiones rápido.
- Debilidades prioritarias (baseline):
  - Cumplimiento de brevedad bajo cuando el usuario la pide.
  - Guardrail factual aún no visible en esta muestra histórica.
  - Densidad de preguntas alta en varias sesiones.

## Objetivo para próximo corte (semanal)

- Brevedad post-pedido: `>= 75%`
- Guardrail factual: `>= 60%` en consultas factuales detectadas
- Densidad de preguntas: `<= 60%` promedio global
- Protocolo de crisis: `>= 90%` cuando haya triggers explícitos

## Plantilla de seguimiento semanal

Duplicar esta sección para cada semana:

- Semana: `YYYY-MM-DD`
- Muestra: `N conversaciones / M mensajes`
- KPIs:
  - Brevedad: `x%`
  - Factual: `x%`
  - Crisis: `x%`
  - Densidad preguntas: `x%`
  - Avg chars asistente: `x`
- Variación vs baseline:
  - Brevedad: `+/- x pp`
  - Factual: `+/- x pp`
  - Crisis: `+/- x pp`
  - Preguntas: `+/- x pp`
  - Longitud: `+/- x chars`
- Decisiones:
  - 1) ...
  - 2) ...
  - 3) ...
