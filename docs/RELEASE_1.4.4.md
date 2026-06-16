# Release 1.4.4 — Bloque A: hábitos, patrones y continuidad

## Visión (cerrada)

Anto **no** es una app de fitness. La promesa es mostrar **cómo tu estándar actual de hábitos** (sueño, pantalla, actividad) **se relaciona con las sesiones que llevamos trabajando** en chat, y sugerir **cambios conductuales pequeños** — siempre como correlaciones observacionales, nunca como diagnóstico ni sustituto de terapia.

**Pilares del Bloque A (todo junto en 1.4.4):**

1. **Salud digital nativa (#216)** — HealthKit (iOS) + Health Connect (Android)
2. **Informes con narrativa LLM avanzada (#208 / #217)** — semanal y mensual
3. **Operación completa del grafo semántico** — backfill embeddings + Atlas en prod
4. **Ciclo ABC macro (#212)** — lo más completo posible; recortar si algo roza clínico

---

## 1. Salud digital (#216)

### Promesa de producto

> «Conectar salud digital» te ayuda a ver **cómo tus hábitos del teléfono se relacionan con tu proceso en Anto** — no para presumir avances físicos, sino para entender patrones y probar pequeños cambios de conducta.

### Datos (lo que tengamos y sea útil)

| Señal | Prioridad | Notas |
|-------|-----------|--------|
| Sueño | Alta | Duración; hora dormir/despertar si la API lo expone |
| Tiempo en pantalla | Alta | Total; ratio social si existe en la plataforma |
| Actividad física | Alta | Pasos y/o **minutos activos** según disponibilidad |

No se requiere pantalla dedicada: **card compacta** en informe y/o ajustes que indique «tenemos datos» o «sin datos aún».

### Consentimiento y permisos

- **Solo bajo intención explícita** — toggle «Conectar salud digital».
- CTA con copy que explique **por qué conectar puede ayudar** (1–2 frases).
- Aclarar:
  - Anto **no recopila** datos propios del sensor; **lee resúmenes** que el teléfono ya agregó.
  - Los informes e insights **se adaptan** a la decisión del usuario.
  - Las señales son **importantes pero no determinantes** del acompañamiento.
- Sin onboarding intrusivo ni permiso al instalar.

### Almacenamiento

- Solo **agregados por día** (`dayKey`, pasos, sueño, pantalla, minutos activos, fuente).
- Sin texto de chat mezclado; sin series crudas de sensores.
- Backend ya rechaza spoof de fuente health desde cliente.

### UX sin datos

- Tras conectar: si vacío → **«Sin datos aún»** (toggle sigue on).
- Reintento manual; si persiste vacío con permisos concedidos → tratar como **error de app** (mensaje + soporte/reintentar).

### Uso en producto

| Superficie | Comportamiento |
|------------|----------------|
| **Informe semanal/mensual** | Correlaciones fenotipo ↔ chat/BA/ritmo de sesiones |
| **Chat** | Mencionar salud **solo** con patrón claro o dato que «llama la atención»; sin insistir en conectar |

### Plataformas

- **iOS + Android en el mismo release** (sin fase iOS-only).

---

## 2. Informes con narrativa LLM (#208)

### Nivel

- **Lo más avanzado posible** sin riesgo clínico.
- Pipeline: motor #217 calcula correlaciones → **LLM genera JSON estructurado** → backend valida, recorta y persiste.

### Esquema JSON objetivo (validado en servidor)

```json
{
  "headline": "string",
  "insights": [
    { "type": "string", "label": "string", "detail": "string" }
  ],
  "conductSuggestion": "string | null",
  "disclaimers": ["string"]
}
```

### Guardrails (obligatorios)

- **Prohibido:** diagnósticos, conclusiones clínicas, recomendaciones médicas o de medicación.
- **Prohibido:** citar mensajes literales del chat (puede volverse crudo).
- **Siempre incluir:** esto no es diagnóstico ni terapeuta; no sustituye atención clínica; buscar apoyo profesional si lo necesitas.
- Tono: correlaciones observacionales, lenguaje de bienestar, no causalidad fuerte («podría», «coincidió», «conviene notar»).

### Ventanas temporales

| Periodo | Ventana salud + señales |
|---------|-------------------------|
| Semanal | Últimos 7 días (evaluar 14 si muestra insuficiente) |
| Mensual | Mes calendario (`monthKey`) |

### Flags env sugeridos

- `WEEKLY_INSIGHT_LLM_ENABLED=true`
- `MONTHLY_INSIGHT_LLM_ENABLED=true` (o reutilizar el mismo flag)
- Modelo opcional: `WEEKLY_INSIGHT_LLM_MODEL`

---

## 3. Grafo semántico en producción (completo)

**Requisito de lanzamiento:** no publicar 1.4.4 sin esto operativo en Render.

### Checklist ops

1. `TOPIC_FREE_EMBEDDINGS_ENABLED=true`
2. Backfill: `npm run backfill:topic-free-embeddings -- --limit=1000` (o más según volumen)
3. Índice Atlas: `npm run print:atlas-topic-free-index` → crear en Atlas Search
4. Render: `ATLAS_VECTOR_SEARCH_ENABLED=true`, `ATLAS_TOPIC_FREE_VECTOR_INDEX=topic_free_embedding_index`
5. Smoke: ranking en chat muestra afinidad semántica; grafo con conceptos agrupados

Sin Atlas el release **no** cumple criterio de «completo» (fallback scan solo para dev/staging).

---

## 4. Ciclo ABC macro (#212)

### Enfoque

- **Máxima completitud posible** en 1.4.4; recortar en QA si algo roza clínico.
- **Incluir:** agregación de registros ABC → patrones recurrentes Situación → Pensamiento → Emoción → Conducta/consecuencia.
- **Excluir por ahora (riesgo #210):** etiquetado de creencias nucleares, mapas de esquemas, interpretación profunda.

### Superficies candidatas (implementar y priorizar en QA)

1. Bloque en **Resumen** o **Estadísticas** — timeline de ciclos
2. Tarjeta en **informe semanal** cuando haya patrón ABC fuerte
3. Enlace desde **continuidad chat** si hay ABC reciente

### Criterio de recorte post-QA

Si una visualización suena a «diagnóstico de patrón de personalidad» o «esquema», se degrada a lista factual sin narrativa interpretativa.

---

## Fuera de alcance 1.4.4 (Bloque A)

- RAG memoria larga (#203)
- Esquemas / creencias nucleares (#210)
- Hard-stop crisis rediseñado (#205)
- Roleplay (#206)
- Pantalla completa de «salud» / dashboard fitness
- Métricas de éxito con umbrales fijos (medir en analytics sin bloquear release)

---

## Criterios de aceptación (smoke)

### Salud digital

- [ ] Toggle «Conectar salud digital» solo tras tap explícito + copy de beneficio
- [ ] iOS: permiso HealthKit → sync al menos un snapshot diario
- [ ] Android: Health Connect → idem
- [ ] Card «tenemos datos» / «sin datos aún» / error si permiso ok y vacío persistente
- [ ] Informe semanal con insight de sueño/pantalla/actividad (cohorte con datos)
- [ ] Chat menciona hábitos solo con patrón claro (no spam)

### Informe LLM

- [ ] JSON validado; sin diagnósticos ni citas literales de chat
- [ ] Disclaimers clínicos siempre presentes
- [ ] Semanal y mensual generan narrativa cuando hay señales suficientes

### Grafo / Atlas

- [ ] Backfill ejecutado en prod
- [ ] Índice Atlas activo; `ATLAS_VECTOR_SEARCH_ENABLED=true`
- [ ] Sugerencias chat + grafo usan ranking semántico (no solo scan)

### ABC macro

- [x] API `GET /api/abc-records/macro-patterns`
- [x] Tarjeta en Resumen, Estadísticas de técnicas e informe semanal/mensual
- [x] Continuidad chat con ABC reciente (solo si el mensaje comparte tema)
- [ ] Sin copy que suene a diagnóstico clínico (validar en QA dispositivo)

---

## Orden de implementación sugerido

1. **Ops:** Atlas + backfill (desbloquea resto en prod)
2. **#216:** puente nativo iOS/Android + card + sync + informe
3. **#208:** capa LLM JSON + guardrails en `weeklyPatternInsightService`
4. **Chat:** gating para menciones de fenotipo (patrón claro)
5. **#212:** agregación ABC + UI (timeline → recortar si hace falta)
6. **QA dispositivo** iOS + Android + copy legal App Store / Play (Health)

---

## Copy tienda (borrador — promocional)

**Corta:**  
«Anto 1.4.4 conecta tus hábitos de sueño, pantalla y actividad con tu proceso en el chat, y te muestra patrones observacionales — con sugerencias conductuales pequeñas, siempre bajo tu consentimiento y sin sustituir terapia profesional.»

**Keywords:** hábitos, sueño, bienestar, patrones, chat terapéutico, TCC, correlaciones, salud digital opt-in.

---

## Pendiente decisión en implementación (no bloquea visión)

- Umbral exacto «patrón claro» para mencionar salud en chat (definir en código + tests)
- Detalle final UI ABC macro (timeline vs solo tarjeta en informe)
- Modelo LLM y coste tope por informe

---

## Blindaje preproducción (1.4.4)

### Backend

| Área | Medida |
|------|--------|
| LLM informes | `validateLlmInsightPayload` exige ≥1 insight; guardrails clínicos compartidos (`clinicalContentGuardrails.js`); fallback heurístico si falla LLM/JSON |
| ABC macro | Rate limit 30/15min; ventana máx. 366 días; API solo `toClientAbcPatterns` (sin beliefSamples); muestras filtradas clínicamente |
| Chat fenotipo | Solo con consentimiento `digitalHealth`; timeout 2,5s; umbrales fuertes; bloqueado en riesgo MEDIUM/HIGH/WARNING |
| Chat ABC reciente | Solo si mensaje comparte tema (≥4 chars); bloqueado en HIGH; sin citar creencias |
| Salud iOS | `getNativeHealthAvailability` no pide permisos (solo `isAvailable`); permisos solo en sync |
| Fenotipo sync | Cliente no puede marcar `healthkit`/`health_connect`; `activeMinutes` acotado 0–1440 |
| API informes | Expone `conductSuggestion`, `disclaimers`, `llmEnriched` en weekly/monthly |
| Features | `weeklyInsightLlm` documentado en `features.js` |

### Frontend

| Área | Medida |
|------|--------|
| Puente nativo | `react-native-health` + `expo-health-connect` instalados; plugins en `app.json`; rebuild dev client obligatorio |
| Card salud | No llama informe semanal extra; usa `sourceSummary` del padre |
| Informe | Muestra sugerencia conductual y disclaimers LLM; deduplica insight ABC vs tarjeta |

### Flags Render (prod)

```
WEEKLY_INSIGHT_LLM_ENABLED=true
OPENAI_API_KEY=...
ATLAS_VECTOR_SEARCH_ENABLED=true
ATLAS_TOPIC_FREE_VECTOR_INDEX=topic_free_embedding_index
TOPIC_FREE_EMBEDDINGS_ENABLED=true
```

### Smoke post-deploy

- [ ] Informe semanal sin LLM flag → heurístico OK
- [ ] Con LLM → disclaimers presentes, sin diagnósticos
- [ ] ABC macro sin datos → `patterns: []`
- [ ] Chat sin consentimiento salud → sin snippet fenotipo
- [ ] Builds iOS 35 / Android 21
