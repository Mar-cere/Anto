# Smoke — memoria del proceso / patrones experienciales

**Manual:** marcar en dispositivo o staging tras deploy.

## Follow-up diferido (#211)

1. [ ] Consent on en Privacidad e IA → Memoria del proceso
2. [ ] Chat sesión A: «las mañanas son lo más difícil» (≥3 turnos sustantivos)
3. [ ] Salir del chat (schedule continuity) → worker crea patrón (o seed manual via API)
4. [ ] Forzar `followUpAt` pasado en DB si hace falta
5. [ ] Sesión B / primer mensaje neutro → Anto retoma con contraste suave **y chips en el mismo turno**
6. [ ] Chips: Sí un poco / Igual / Omitir → status correcto; no reaparece
7. [ ] Home: CTA «proceso para retomar» → abre chat con `resumeExperientialFollowUp` y pregunta
8. [ ] Archivar en UI → silencio
9. [ ] Consent off / crisis / compromiso due: sin follow-up experiencial
10. [ ] ES y EN en chips, CTA home y pantalla

## Recall entre conversaciones (promesa B)

1. [ ] Consent on
2. [ ] Sesión A: ≥3 turnos sustantivos sobre mañanas (u otro tema)
3. [ ] **Borrar** conversación (o salir) → worker crea patrón (esperar ~1–10 min / verificar DB)
4. [ ] Chat nuevo: «¿recuerdas algo de mis mañanas?» → Anto ancla el patrón con suavidad
5. [ ] Chat nuevo: mensaje temático **sin** «recuerdas» (p. ej. «hoy me costó mucho arrancar al despertar») → también puede anclar
6. [ ] Consent off → no inventa memoria de proceso entre hilos
7. [ ] Crisis / compromiso due → sin recall experiencial

## Personal Pattern RAG (#203)

**Env staging (tras merge; default en repo sigue off):**

1. [ ] `OPENAI_API_KEY` OK; non-prod: `TOPIC_FREE_EMBEDDINGS_ENABLED=true` si aplica
2. [ ] `PERSONAL_PATTERN_RAG_ENABLED=true` (preferible `ATLAS_VECTOR_SEARCH_ENABLED=true`)
3. [ ] Health: `chatFeatures.personalPatternRag: true`
4. [ ] Consent **off** → no nuevos `memory_index` / sin snippet RAG
5. [ ] Consent **on**, conv A tema X (LOW), conv B mensaje afín → snippet «Continuidad observacional…» (sin recall/#211 en ese turno)
6. [ ] Mismo turno con recall temático o follow-up #211 → **solo** recall/follow-up, no ambos con RAG
7. [ ] Crisis HIGH → sin RAG
8. [ ] Clear conv A → sin `memory_index` de A; otras convs OK

Automatizado: `cd backend && npm run validate:experiential-patterns`  
Unit RAG: `tests/unit/services/personalPatternRagService.test.js`
