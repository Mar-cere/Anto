# Propuestas de mejora: servicios y análisis del chat

Revisión de los servicios, análisis que realiza el chat y propuestas para personalizar y mejorar los existentes, además de posibles nuevos análisis.

---

## Resumen de cambios implementados (Fase 1) ✅

| Mejora | Estado | Archivos modificados |
|--------|--------|----------------------|
| Inyectar **sessionTrends** en prompt (trend worsening, streakNegative ≥ 3) | ✅ | `backend/constants/openai.js` |
| Inyectar **conversationContext** (escalada, rechazo, cambio brusco) | ✅ | `backend/constants/openai.js`, `chatRoutes.js`, `openaiService.js`, `openaiPromptBuilder.js` |
| Unificar **responseStyle** vs **communicationStyle** | ✅ | `UserProfile.js`, `openai.js`, `openaiPromptBuilder.js`, `userProfileService.js`, `userRoutes.js`, `personalizationService.js` |
| Pasar **conversationHistory** a `contextAnalyzer.analizarMensaje` | ✅ | `contextAnalyzer.js` (acepta y usa), `openaiService.js` (fallback pasa history) |

**Documentación creada:** `docs/ESTILOS_COMUNICACION.md`

---

## Resumen de cambios implementados (Fase 2) ✅

| Mejora | Estado | Archivos modificados |
|--------|--------|----------------------|
| Actualizar **emotionalTriggers** en `updateLongTermProfileFromConversation` | ✅ | `userProfileService.js` |
| Usar **timePatterns** y **connectionStats** en bloque MEMORIA | ✅ | `userProfileService.js`, `openaiPromptBuilder.js` |
| Implementar **conversationDepthAnalyzer** básico | ✅ | `conversationDepthAnalyzer.js` (nuevo), `chatRoutes.js`, `openaiService.js`, `openaiPromptBuilder.js` |
| Flujo para registrar **copingStrategies** tras uso de técnicas | ✅ | `userProfileService.js` (`registerCopingStrategy`), `therapeuticTechniquesRoutes.js` |

---

## 1. Estado actual

### Servicios principales del flujo de chat

| Servicio | Función actual | Entrada | Salida |
|----------|----------------|---------|--------|
| **emotionalAnalyzer** | Detecta emoción principal, intensidad, confianza | `content`, `previousEmotionalPatterns` (últimos 3) | `mainEmotion`, `intensity`, `confidence`, `category`, `subtype`, `topic` |
| **contextAnalyzer** | Intención, tema, urgencia, resistencia, recaída, necesidades implícitas, fortalezas, autoeficacia, apoyo social, distorsiones cognitivas | `mensaje`, `conversationHistory` (opcional) | Objeto con todos los análisis; incluye `temasRecurrentes` y `faseConversacion` cuando hay historial |
| **memoryService** | Contexto relevante (patrones, temas, interacciones) | `userId`, `content`, `currentAnalysis` | `patterns`, `currentContext`, `history` |
| **sessionEmotionalMemory** | Buffer de emociones de sesión, tendencias | `userId`, `emotionalAnalysis` | `streakNegative`, `trend`, `dominantEmotion`, etc. |
| **userProfileService** | Perfil, actualización a corto y largo plazo | `userId`, `mensaje`, `analisis` | Perfil actualizado |
| **personalizationService** | Preferencias, estilos, prompts personalizados | `userId` | `style`, `responseLength`, `topics`, `triggers` |

### Análisis conversacional (chatContextAnalysis)

- Escalada emocional
- Rechazo de ayuda
- Cambio brusco de tono
- Frecuencia de mensajes
- Silencio tras mensaje negativo
- Factores de riesgo/protección

### Uso en el prompt

- **MEMORIA**: género, pronombres, última conversación, temas recurrentes, estilo, progreso, estrategias de afrontamiento, emociones predominantes, emotionalTriggers, connectionStats, timePatterns
- **sessionTrends**: ✅ inyectado cuando `trend === 'worsening'` o `streakNegative >= 3` (directriz de contención)
- **conversationContext**: ✅ inyectado cuando hay escalada emocional, rechazo de ayuda o cambio brusco de tono
- **communicationStyle** / **responseStyle**: ✅ unificados (ver `docs/ESTILOS_COMUNICACION.md`)
- **onboardingAnswers**: `whatExpectFromApp`, `whatToImproveOrWorkOn`, `typeOfSpecialist`

---

## 2. Gaps y oportunidades

### 2.1 Personalización

- ~~**responseStyle** en UserProfile~~ ✅ Resuelto: añadido a UserProfile, unificado con User, documentado en ESTILOS_COMUNICACION.md.
- ~~**emotionalTriggers**~~ ✅ Resuelto: se actualiza en `updateLongTermProfileFromConversation` y se usa en MEMORIA.
- ~~**copingStrategies**~~ ✅ Resuelto: `registerCopingStrategy` en userProfileService; se llama desde POST `/api/therapeutic-techniques/use`.
- ~~**timePatterns** y **connectionStats**~~ ✅ Resuelto: se actualizan en `updateLongTermProfileFromConversation` y se usan en bloque MEMORIA.
- **progressMetrics**: `emotionalGrowth` con checkpoints existe pero no se alimenta ni se usa.

### 2.2 Análisis

- ~~**contextAnalyzer** no recibe `conversationHistory`~~ ✅ Resuelto: acepta y usa historial para `temasRecurrentes` y `faseConversacion`.
- ~~**sessionTrends** se calcula pero su impacto en el prompt es limitado~~ ✅ Resuelto: se inyecta directriz cuando hay worsening o racha negativa.
- ~~No hay análisis explícito de **preferencia de profundidad**~~ ✅ Resuelto: `conversationDepthAnalyzer` detecta superficial/moderado/profundo y ajusta responseStyle.
- ~~No hay detección de **estilo de escritura**~~ ✅ Resuelto: `writingStyleDetector` (formal/casual/laconic/emotive).

### 2.3 Memoria y contexto

- **memoryService** usa `UserInsight` con `interactions`; puede haber duplicación con `UserProfile.lastInteractions`.
- **selectRelevantHistory** usa scoring por emoción, tema y keywords; podría incorporar `sessionTrends` y `conversationContext`.
- ~~**conversationContext** (escalada, rechazo, etc.) se calcula en chatRoutes pero no se inyecta explícitamente en el prompt~~ ✅ Resuelto: se pasa a openaiService y se inyecta en el prompt cuando es relevante.

### 2.4 Integración

- **actionSuggestionService** y **clinicalScalesService** se llaman tras la respuesta; podrían influir en la siguiente interacción.
- ~~**TherapeuticTechniqueUsage** sin feedback de efectividad~~ ✅ Resuelto: effectivenessFeedbackService desde ResponseFeedback.

---

## 3. Mejoras propuestas

### 3.1 emotionalAnalyzer

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| **Subtipos emocionales** | Usar `emotionalSubtypeDetector` de forma más integrada; pasar subtipo al prompt con más peso | Bajo |
| **Confianza por emoción** | Exponer `confidence` por emoción para que el prompt adapte el tono (más cauteloso si confianza baja) | Bajo |
| **Emociones secundarias** | Incluir 1–2 emociones secundarias cuando haya ambigüedad (ej. tristeza + ansiedad) | Medio |
| **Patrones por usuario** | Aprender qué expresiones usa cada usuario para ciertas emociones y priorizarlas | Alto |

### 3.2 contextAnalyzer

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| ~~**Historial en análisis**~~ | ~~Pasar `conversationHistory` a `analizarMensaje`~~ ✅ Hecho: usa historial para `temasRecurrentes` y `faseConversacion` | Bajo |
| ~~**Nivel de profundidad**~~ | ~~Detectar si el usuario busca exploración profunda o conversación ligera~~ ✅ Hecho: `conversationDepthAnalyzer` | Medio |
| **Coherencia temática** | Detectar cambios de tema bruscos para adaptar transiciones | Bajo |
| **Prioridad de análisis** | Ordenar qué análisis se inyectan en el prompt según relevancia (evitar saturar) | Medio |

### 3.3 memoryService y userProfileService

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| **Unificar fuentes** | Definir una fuente principal de “últimas interacciones” (UserProfile vs UserInsight) y usarla de forma consistente | Medio |
| ~~**Actualizar emotionalTriggers**~~ | ✅ Hecho: en `updateLongTermProfileFromConversation` | Medio |
| ~~**Registrar copingStrategies**~~ | ✅ Hecho: `registerCopingStrategy` llamado desde POST `/use` | Medio |
| ~~**Usar timePatterns en prompt**~~ | ✅ Hecho: bloque MEMORIA incluye timePatterns y connectionStats | Bajo |
| ~~**responseStyle persistente**~~ | ✅ Hecho: añadido a UserProfile, sincronizado con User, documentado | Bajo |

### 3.4 sessionEmotionalMemory

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| ~~**Inyectar sessionTrends en prompt**~~ | ✅ Hecho: directriz de contención cuando worsening o streakNegative ≥ 3 | Bajo |
| **Racha positiva** | Añadir `streakPositive` para celebrar mejor cuando el usuario mejora | Bajo |
| **Transición emocional** | Detectar transición negativa→positiva para reforzar el cambio | Bajo |

### 3.5 personalizationService

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| **Estilo inferido** | Inferir `communicationStyle` a partir de mensajes (formal/coloquial/lacónico) si el usuario no lo ha configurado | Medio |
| **Preferencia de longitud** | Inferir si prefiere respuestas cortas o largas según si suele hacer follow-ups breves o preguntas extensas | Medio |
| **Temas sensibles** | Permitir que el usuario marque temas sensibles (`triggerTopics`) para que el asistente sea más cuidadoso | Bajo (ya existe el campo) |

### 3.6 openaiPromptBuilder / buildPersonalizedPrompt

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| ~~**Bloque SESSION_TRENDS**~~ | ✅ Hecho: directriz de contención cuando worsening o streakNegative ≥ 3 | Bajo |
| ~~**Bloque CONVERSATION_CONTEXT**~~ | ✅ Hecho: directriz cuando escalada, rechazo de ayuda o cambio brusco de tono | Bajo |
| **Priorizar onboarding** | Dar más peso a `onboardingAnswers` cuando el usuario es nuevo (< N mensajes) | Bajo |
| **Distorsiones en directrices** | Usar `primaryDistortion` y `distortionIntervention` de forma más visible en las directrices por emoción | Bajo |

---

## 4. Nuevos análisis o servicios sugeridos

### 4.1 conversationDepthAnalyzer ✅ Implementado

- **Objetivo**: Detectar si el usuario busca exploración profunda o conversación ligera.
- **Entrada**: `content`, `conversationHistory`, `emotionalAnalysis`.
- **Salida**: `depthPreference`: 'superficial' | 'moderado' | 'profundo'.
- **Uso**: Ajusta responseStyle (profundo→deep, superficial→brief) en el prompt.

### 4.2 writingStyleDetector (nuevo)

- **Objetivo**: Inferir estilo de escritura (formal, coloquial, lacónico, emotivo).
- **Entrada**: `content`, últimos N mensajes del usuario.
- **Salida**: `style`: 'formal' | 'casual' | 'laconic' | 'emotive'.
- **Uso**: Adaptar tono del asistente para que haga espejo.

### 4.3 engagementTracker ✅ Implementado

- **Objetivo**: Medir engagement (longitud de respuestas del usuario, frecuencia, follow-ups).
- **Entrada**: Historial de mensajes del usuario.
- **Salida**: `engagementLevel`, `preferredResponseLength`, `responseToQuestionRatio`.
- **Uso**: Ajusta responseStyle y responseLength; inferencia de preferencias.

### 4.4 effectivenessFeedbackService ✅ Implementado

- **Objetivo**: Recoger feedback implícito o explícito sobre técnicas y respuestas.
- **Entrada**: ResponseFeedback (helpful/not_helpful/excellent/poor) sobre mensaje con técnica.
- **Salida**: Actualización de `copingStrategies` vía `registerCopingStrategy`.
- **Uso**: Se llama desde POST/PUT en `responseFeedbackRoutes` cuando el mensaje contenía técnica.

---

## 5. Priorización sugerida

### Fase 1 (rápido, alto impacto) ✅ Completada

1. ~~Inyectar **sessionTrends** de forma explícita en el prompt cuando `trend === 'worsening'` o `streakNegative >= 3`.~~ ✅
2. ~~Inyectar **conversationContext** (escalada, rechazo) en el prompt cuando sea relevante.~~ ✅
3. ~~Unificar y documentar uso de **responseStyle** vs **communicationStyle** en UserProfile.~~ ✅ (ver docs/ESTILOS_COMUNICACION.md)
4. ~~Pasar **conversationHistory** a `contextAnalyzer.analizarMensaje` cuando esté disponible.~~ ✅

### Fase 2 (medio plazo) ✅ Completada

5. ~~Actualizar **emotionalTriggers** en `updateLongTermProfileFromConversation`.~~ ✅
6. ~~Usar **timePatterns** y **connectionStats** en el bloque MEMORIA.~~ ✅
7. ~~Implementar **conversationDepthAnalyzer** básico.~~ ✅
8. ~~Añadir flujo para registrar **copingStrategies** tras uso de técnicas.~~ ✅

### Fase 3 (largo plazo) ✅ Completada

9. ~~**writingStyleDetector** para adaptar tono.~~ ✅
10. ~~**effectivenessFeedbackService** para técnicas.~~ ✅
11. ~~**engagementTracker** para longitud preferida.~~ ✅
12. ~~Inferir preferencias de personalización a partir del comportamiento.~~ ✅

---

## 6. Archivos clave (modificados y pendientes)

### Modificados en Fase 1

| Archivo | Cambios realizados |
|---------|---------------------|
| `backend/constants/openai.js` | Directrices sessionTrends y conversationContext; mapeo communicationStyle; getCommunicationStyleGuidelines con aliases |
| `backend/services/openai/openaiPromptBuilder.js` | Lectura unificada de `preferences.communicationStyle` y `preferences.responseStyle`; pasar `conversationContext` |
| `backend/services/contextAnalyzer.js` | `analizarMensaje(mensaje, conversationHistory)`; `extraerTemasDelHistorial()`; `temasRecurrentes` y `faseConversacion` |
| `backend/services/openaiService.js` | Pasar `conversationContext` y `conversationHistory` (en fallback) |
| `backend/services/userProfileService.js` | `responseStyle` en estructuras default y `getPersonalizedPrompt` |
| `backend/routes/chatRoutes.js` | Pasar `conversationContext` a generarRespuesta; sincronizar `responseStyle` User→UserProfile en PUT /me |
| `backend/models/UserProfile.js` | `responseStyle` en preferences; `communicationStyle` expandido |
| `backend/services/personalizationService.js` | `responseStyle` en retorno de `getPersonalizedPrompt` |
| `backend/routes/userRoutes.js` | Sincronizar `responseStyle` a UserProfile al actualizar User |

### Modificados en Fase 2

| Archivo | Cambios realizados |
|---------|---------------------|
| `backend/services/userProfileService.js` | `emotionalTriggers`, `connectionStats`, `timePatterns` en updateLongTermProfileFromConversation; `registerCopingStrategy` |
| `backend/services/openai/openaiPromptBuilder.js` | Bloque MEMORIA: emotionalTriggers, connectionStats, timePatterns; depthPreference→responseStyle |
| `backend/services/conversationDepthAnalyzer.js` | Nuevo: `analyzeDepth()` → depthPreference |
| `backend/routes/chatRoutes.js` | Llamada a conversationDepthAnalyzer; pasa depthPreference a generarRespuesta |
| `backend/services/openaiService.js` | Pasa depthPreference a buildContextualizedPrompt |
| `backend/routes/therapeuticTechniquesRoutes.js` | Llama `registerCopingStrategy` tras usage.save() |

### Modificados en Fase 3

| Archivo | Cambios realizados |
|---------|---------------------|
| `backend/services/writingStyleDetector.js` | Nuevo: `detectWritingStyle()` → formal/casual/laconic/emotive |
| `backend/services/engagementTracker.js` | Nuevo: `analyzeEngagement()` → engagementLevel, preferredResponseLength |
| `backend/services/effectivenessFeedbackService.js` | Nuevo: `processFeedback()` actualiza copingStrategies desde ResponseFeedback |
| `backend/services/userProfileService.js` | `inferPreferencesFromBehavior()` para inferir communicationStyle, responseLength |
| `backend/routes/chatRoutes.js` | writingStyle, engagement; therapeutic en metadata; inferencia de preferencias |
| `backend/routes/responseFeedbackRoutes.js` | Llama effectivenessFeedbackService al crear/actualizar feedback |
| `backend/services/openai/openaiPromptBuilder.js` | Usa inferredWritingStyle, preferredResponseLength en prompt |

---

## 7. Métricas de éxito

- Reducción de respuestas genéricas o desalineadas con el estado emocional.
- Mayor uso de técnicas sugeridas cuando son relevantes.
- Mejor retención y engagement (más mensajes por sesión, más sesiones).
- Feedback cualitativo: usuarios que perciben que “Anto los conoce mejor”.
