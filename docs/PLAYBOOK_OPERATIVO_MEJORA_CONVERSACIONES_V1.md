# Playbook operativo v1: mejora de conversaciones

Este playbook define que atacar primero, como implementarlo y como medir mejora real en el asistente.

## 1) Objetivo de esta fase (2-3 semanas)

- Subir calidad promedio de conversaciones de `24-29/40` a `32+/40`.
- Reducir errores de confianza (incumplir brevedad y errores factuales).
- Mejorar manejo de alta carga emocional con un protocolo breve y consistente.

## 2) Prioridades de producto

### P1. Cumplimiento de preferencias explicitas

Problema observado:
- El usuario pide respuestas breves y el asistente vuelve a mensajes largos.

Resultado esperado:
- Si el usuario pide brevedad, el estilo se mantiene toda la sesion (salvo excepciones de seguridad).

### P2. Precision factual en preguntas concretas

Problema observado:
- El asistente afirma datos no verificados en consultas de fechas/nombres.

Resultado esperado:
- Menos respuestas categoricas sin certeza.

### P3. Manejo de riesgo emocional

Problema observado:
- En mensajes de alta alerta, falta estructura fija para evaluar riesgo y contener.

Resultado esperado:
- Protocolo uniforme en frases de riesgo y salida segura en cada caso.

### P4. Flujo conversacional (menos interrogatorio)

Problema observado:
- Exceso de repreguntas seguidas.

Resultado esperado:
- Conversaciones con mejor ritmo: validar, sintetizar, accionar.

## 3) Reglas operativas (guardrails)

## Regla A: brevedad persistente

- Trigger: el usuario pide "breve", "corto", "sin tanto texto", etc.
- Accion:
  - Activar `short_mode=true` a nivel sesion.
  - Limite por respuesta: 1-2 frases o 140-180 caracteres.
  - Excepcion: seguridad/riesgo, donde se permite extender para proteger.
- Persistencia:
  - Mantener activa hasta que el usuario pida mas detalle.

## Regla B: factualidad conservadora

- Trigger: preguntas de fecha, nombres, definiciones puntuales.
- Accion:
  - Si no hay alta certeza, declarar duda explicitamente.
  - Evitar listas cerradas sin verificacion.
  - Preferir "te doy opciones aproximadas" antes que afirmar.

## Regla C: protocolo minimo de riesgo

- Trigger: frases como "me quiero morir", "no puedo mas", "hacerme dano".
- Accion (orden fijo):
  1. Confirmar seguridad actual (si/no).
  2. Evaluar plan, medios, inmediatez.
  3. Activar red de apoyo inmediata.
  4. Derivar a emergencia o linea local si hay riesgo.
  5. Cerrar con una accion concreta de los proximos 5-10 minutos.

## Regla D: ritmo conversacional

- Maximo 1 pregunta por turno.
- Cada 2-3 turnos: mini-sintesis sin pregunta.
- Plantilla recomendada:
  - `validacion breve + accion concreta + (pregunta cerrada opcional)`.

## 4) Implementacion tecnica recomendada

## Backend / prompting

- Añadir flags de sesion en contexto:
  - `short_mode`
  - `high_risk_mode`
  - `factual_mode`
- Inyectar directrices de salida en el prompt builder:
  - Limite de longitud por modo.
  - Secuencia obligatoria para riesgo.
  - Regla de incertidumbre factual.

## Persistencia de preferencias

- Guardar preferencia explicitada por el usuario:
  - `responseLengthPreference: short|medium|long`.
- Releerla al iniciar cada respuesta de la misma sesion.

## Validaciones de salida (post-procesado simple)

- Si `short_mode=true` y no es riesgo:
  - recortar o regenerar si excede limite.
- Si `high_risk_mode=true`:
  - exigir campos minimos de seguridad antes de enviar.

## 5) KPIs (seguimiento semanal)

- `% cumplimiento_brevedad`:
  - respuestas dentro de limite cuando `short_mode=true`.
- `% factual_sin_error`:
  - respuestas factuales revisadas sin correccion posterior.
- `% protocolo_riesgo_completo`:
  - casos de riesgo con secuencia minima completa.
- `preguntas_por_respuesta`:
  - objetivo <= 0.6 en conversaciones emocionales intensas.
- `puntaje_rubrica_promedio`:
  - objetivo >= 32/40.

## 6) Cadencia de mejora

### Semana 1 (base)

- Implementar guardrails A, C y D.
- Medir baseline de KPIs con muestras recientes.

### Semana 2 (confiabilidad)

- Implementar guardrail B (factualidad).
- Ajustar mensajes cortos por contexto (emocional, practico, factual).

### Semana 3 (optimizacion)

- Afinar umbrales de longitud y densidad de preguntas.
- Revisar regresiones y ajustar prompt/rules.

## 7) Checklist de revision por cada lote de conversaciones

- Se respeto preferencia de brevedad cuando fue explicita.
- No hubo afirmaciones factuales sin certeza.
- En riesgo emocional hubo evaluacion y cierre seguro.
- El ritmo no fue de interrogatorio continuo.
- Se entrego al menos una accion concreta util por tramo critico.

## 8) Estado actual de implementacion

1. `short_mode` persistente de sesion: implementado.
2. Guardrail factual (no inventar + incertidumbre explicita): implementado.
3. Protocolo estructurado de crisis en post-procesado: implementado.
4. Tests unitarios de regresion para los guardrails: implementados.

## 9) Medicion automatica (nuevo)

Script:
- `backend/scripts/evaluateConversationQuality.js`

Comando:
- `npm run quality:conversations -- /ruta/messages.json`
- `npm run quality:conversations -- /ruta/messages.json --json`

KPIs que reporta:
- Cumplimiento de brevedad despues de pedido explicito.
- Guardrail factual (respuesta con incertidumbre cuando corresponde).
- Cobertura de protocolo de crisis (estructura minima en triggers de riesgo).
- Densidad de preguntas del asistente.
- Promedio de longitud de respuestas.
