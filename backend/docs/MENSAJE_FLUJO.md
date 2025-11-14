# Flujo Completo del Mensaje - Documentación Técnica

Este documento describe el viaje completo que realiza un mensaje desde que se envía hasta que se genera la respuesta, enumerando todas las rutas, filtros, análisis y transformaciones aplicadas.

---

## 📍 RUTA PRINCIPAL

**Endpoint:** `POST /api/chat/messages`  
**Archivo:** `backend/routes/chatRoutes.js` (líneas 148-329)  
**Middleware:** `authenticateToken` (autenticación requerida)

---

## 🔄 FLUJO COMPLETO DEL MENSAJE

### **PASO 1: Validación Inicial**
**Ubicación:** `chatRoutes.js:157-166`

#### Filtros aplicados:
1. **Validación de contenido:**
   - Verifica que `content` existe y no está vacío
   - Trim del contenido

2. **Límite de mensajes:**
   - Verifica que la conversación no exceda `LIMITE_MENSAJES` (50 mensajes)
   - Si excede, retorna error 400

---

### **PASO 2: Creación del Mensaje del Usuario**
**Ubicación:** `chatRoutes.js:170-179`

#### Transformaciones:
- Normalización del contenido (trim)
- Asignación de `role: 'user'`
- Creación de metadata con `status: 'sent'`

---

### **PASO 3: Obtención de Contexto e Historial**
**Ubicación:** `chatRoutes.js:184-195`

#### Filtros aplicados:
1. **Filtro temporal:**
   - Ventana de contexto: `VENTANA_CONTEXTO` (30 minutos)
   - Solo mensajes dentro de esta ventana: `createdAt: { $gte: new Date(Date.now() - VENTANA_CONTEXTO) }`

2. **Filtro de cantidad:**
   - Límite de historial: `HISTORIAL_LIMITE` (10 mensajes)
   - Orden: `sort({ createdAt: -1 })`

3. **Filtro de usuario:**
   - Solo mensajes del usuario autenticado

#### Datos obtenidos en paralelo:
- `conversationHistory`: Historial de mensajes filtrado
- `userProfile`: Perfil del usuario (o creación si no existe)
- `therapeuticRecord`: Registro terapéutico del usuario

---

### **PASO 4: Análisis Paralelo del Mensaje**
**Ubicación:** `chatRoutes.js:197-212`

#### 4.0. Preparación del Historial Emocional (líneas 199-206)
**Optimización:** Se extraen los patrones emocionales del historial de conversación para mejorar el análisis.

**Proceso:**
1. Filtra mensajes del historial que tengan análisis emocional previo
2. Extrae `mainEmotion`, `intensity` y `timestamp` de cada mensaje
3. Toma solo los últimos 3 mensajes para ajuste de tendencia emocional
4. Pasa estos patrones al analizador emocional para ajustar la intensidad según tendencias

#### 4.1. Análisis Emocional
**Servicio:** `emotionalAnalyzer.analyzeEmotion()`  
**Archivo:** `backend/services/emotionalAnalyzer.js`  
**Parámetros:** `content` (string), `previousEmotionalPatterns` (array de patrones previos)

##### Filtros de Emociones (líneas 29-55):
1. **Emoción: `tristeza`**
   - Patrón: `/(?:triste(?:za)?|deprimi(?:do|da)|sin energía|desánimo|desmotiva(?:do|da)|solo|soledad|melancolía|nostalgia)/i`
   - Intensidad base: `7`
   - Categoría: `negative`

2. **Emoción: `ansiedad`**
   - Patrón: `/(?:ansie(?:dad|oso)|nervios|inquiet(?:o|ud)|preocupa(?:do|ción)|angustia|miedo|pánico|estresado)/i`
   - Intensidad base: `6`
   - Categoría: `negative`

3. **Emoción: `enojo`**
   - Patrón: `/(?:enoja(?:do|da)|ira|rabia|molest(?:o|a)|frustrad(?:o|a)|impotencia|indignación|resentimiento)/i`
   - Intensidad base: `8`
   - Categoría: `negative`

4. **Emoción: `alegria`**
   - Patrón: `/(?:feliz|contento|alegr(?:e|ía)|satisfech(?:o|a)|motivad(?:o|a)|entusiasm(?:o|ado)|euforia|júbilo)/i`
   - Intensidad base: `7`
   - Categoría: `positive`

5. **Emoción: `neutral`**
   - Patrón: `/(?:normal|tranquil(?:o|a)|bien|regular|más o menos|asi asi|equilibrado|estable)/i`
   - Intensidad base: `4` (INTENSITY_DEFAULT)
   - Categoría: `neutral`

##### Filtros de Intensidad (líneas 58-60):
1. **Intensificadores:**
   - Patrón: `/(?:muy|mucho|demasiado|extremadamente|totalmente|absolutamente)/i`
   - Ajuste: `+2` a la intensidad base

2. **Atenuadores:**
   - Patrón: `/(?:poco|algo|ligeramente|un poco|apenas)/i`
   - Ajuste: `-2` a la intensidad base

3. **Pistas contextuales:**
   - Patrón: `/(?:me siento|estoy|siento que|creo que)/i`
   - Aumenta confianza en `+0.1`

##### Filtros de Ajuste por Historial (líneas 490-543):
- Ventana de historial: `HISTORY_WINDOW_SIZE` (3 mensajes)
- Extracción de patrones: Se extraen del historial de conversación en `chatRoutes.js` (líneas 199-206)
- Tendencias detectadas:
  - `TREND_INCREASING`: Intensidad `+1` (si la última intensidad > promedio + umbral)
  - `TREND_DECREASING`: Intensidad `-1` (si la última intensidad < promedio - umbral)
  - `TREND_STABLE`: Sin cambio (si está dentro del umbral)
- **Mejora:** El historial se extrae del historial de conversación real, no se recalcula

##### Filtros de Longitud (líneas 169-172):
- Si palabras > `WORD_COUNT_THRESHOLD` (20): Intensidad `+1`

##### Resultado del Análisis Emocional:
```javascript
{
  mainEmotion: string,        // Emoción principal detectada
  intensity: number,          // 1-10
  category: string,           // 'positive' | 'negative' | 'neutral'
  secondary: string[],        // Emociones secundarias
  confidence: number,         // 0-1
  requiresAttention: boolean  // true si category='negative' && intensity>=7
}
```

#### 4.2. Análisis Contextual
**Servicio:** `contextAnalyzer.analizarMensaje()`  
**Archivo:** `backend/services/contextAnalyzer.js`  
**Patrones:** `backend/config/patrones.js`

##### Filtros de Intención (líneas 131-143):
1. **Intención: `CRISIS`**
   - Patrones: `backend/config/patrones.js:13-26`
   - Requiere seguimiento: `true`
   - Confianza: `0.8`

2. **Intención: `AYUDA_EMOCIONAL`**
   - Patrones: `backend/config/patrones.js:31-42`
   - Requiere seguimiento: `true`
   - Confianza: `0.8`

3. **Intención: `CONSULTA_IMPORTANTE`**
   - Patrones: `backend/config/patrones.js:47-59`
   - Requiere seguimiento: `false`
   - Confianza: `0.8`

4. **Intención: `CONVERSACION_GENERAL`**
   - Patrones: `backend/config/patrones.js:64-80`
   - Requiere seguimiento: `false`
   - Confianza: `0.8`

##### Filtros de Tema (líneas 150-162):
1. **Tema: `EMOCIONAL`**
   - Patrones: `backend/config/patrones.js:90-114`
   - Ejemplos: tristeza, depresión, ansiedad, miedo, estrés, etc.

2. **Tema: `RELACIONES`**
   - Patrones: `backend/config/patrones.js:119-140`
   - Ejemplos: pareja, familia, amigos, conflictos, etc.

3. **Tema: `TRABAJO_ESTUDIO`**
   - Patrones: `backend/config/patrones.js:145-166`
   - Ejemplos: trabajo, estudio, proyectos, estrés laboral, etc.

4. **Tema: `SALUD`**
   - Patrones: `backend/config/patrones.js:171-189`
   - Ejemplos: salud, enfermedad, dolor, síntomas, etc.

5. **Tema: `GENERAL`**
   - Patrones: `backend/config/patrones.js:194-214`
   - Ejemplos: vida, futuro, metas, decisiones, etc.

##### Filtros de Urgencia (líneas 169-177):
- Patrones de urgencia: `['urgente', 'emergencia', 'crisis', 'ayuda.*ahora', 'grave']`
- Si coincide: `URGENCIA_ALTA`
- Si no: `URGENCIA_NORMAL`

##### Resultado del Análisis Contextual:
```javascript
{
  intencion: {
    tipo: string,              // 'CRISIS' | 'AYUDA_EMOCIONAL' | 'CONSULTA_IMPORTANTE' | 'CONVERSACION_GENERAL'
    confianza: number,         // 0.8 o 0.5 (default)
    requiereSeguimiento: boolean
  },
  tema: {
    categoria: string,         // 'EMOCIONAL' | 'RELACIONES' | 'TRABAJO_ESTUDIO' | 'SALUD' | 'GENERAL'
    subtema: null,
    confianza: number          // 0.8 o 0.5 (default)
  },
  urgencia: string,            // 'ALTA' | 'NORMAL'
  contexto: {
    faseConversacion: string,  // 'INICIAL'
    temasRecurrentes: [],
    patronesIdentificados: []
  },
  sugerencias: []
}
```

---

### **PASO 5: Guardado del Mensaje del Usuario**
**Ubicación:** `chatRoutes.js:205`

- Guarda el mensaje en la base de datos
- Asigna `_id` al mensaje

---

### **PASO 6: Generación de Respuesta**
**Ubicación:** `chatRoutes.js:209-218`  
**Servicio:** `openaiService.generarRespuesta()`  
**Archivo:** `backend/services/openaiService.js` (líneas 118-285)  
**Constantes:** `backend/constants/openai.js`

#### 6.0. Validación y Normalización del Mensaje (líneas 120-138)
**Filtros aplicados:**
1. **Validación de contenido:**
   - Verifica que `mensaje.content` existe
   - Normaliza con `trim()`
   - Valida que no esté vacío después del trim
   - Valida longitud máxima: 2000 caracteres

2. **Validación de API Key:**
   - Verifica que `OPENAI_API_KEY` esté configurada
   - Verifica que el cliente de OpenAI esté inicializado
   - Lanza error descriptivo si falta

#### 6.1. Análisis Completo (líneas 140-164)
**Optimización:** El análisis se reutiliza del contexto si está disponible (evita duplicación).

**Si el análisis viene en el contexto (desde `chatRoutes.js`):**
- Se reutiliza `analisisEmocional` del contexto
- Se reutiliza `analisisContextual` del contexto
- Se reutiliza `perfilUsuario` del contexto
- Se reutiliza `registroTerapeutico` del contexto

**Si el análisis NO viene en el contexto (fallback):**
- `analisisEmocional`: Análisis emocional usando contenido normalizado
- `analisisContextual`: Análisis contextual con mensaje normalizado
- `perfilUsuario`: Perfil completo del usuario (con `.catch(() => null)` para no bloquear)
- `registroTerapeutico`: Registro terapéutico (con `.catch(() => null)` para no bloquear)

**Nota:** Los errores en `getUserProfile` y `TherapeuticRecord.findOne` no bloquean el flujo principal. El análisis se hace una sola vez en `chatRoutes.js` y se reutiliza aquí para evitar duplicación.

#### 6.2. Obtención de Memoria Contextual (líneas 153-161)
**Servicio:** `memoryService.getRelevantContext()`
- Recupera contexto relevante del historial
- Usa contenido normalizado
- Considera análisis emocional y contextual

#### 6.3. Construcción del Prompt Contextualizado (líneas 163-173)
**Método:** `construirPromptContextualizado()` (líneas 293-327)

##### Filtros aplicados al prompt:
1. **Filtro de momento del día:**
   - `getTimeOfDay()`: Determina período usando `TIME_PERIODS` (mañana, tarde, noche)
   - Constante: `backend/constants/openai.js:TIME_PERIODS`

2. **Filtro de estilo comunicativo:**
   - Obtiene de `contexto.profile?.communicationPreferences`
   - Valor por defecto: `DEFAULT_VALUES.COMMUNICATION_STYLE` (`'neutral'`)
   - Valores posibles: `'neutral'`, `'EMPATICO'`, `'DIRECTO'`, `'EXPLORATORIO'`, `'ESTRUCTURADO'`
   - Constante: `backend/constants/openai.js:DEFAULT_VALUES`

3. **Filtro de fase terapéutica:**
   - Obtiene de `contexto.therapeutic?.currentPhase`
   - Valor por defecto: `DEFAULT_VALUES.PHASE` (`'inicial'`)
   - Constante: `backend/constants/openai.js:DEFAULT_VALUES`

4. **Filtro de temas recurrentes:**
   - Obtiene de `contexto.memory?.recurringThemes`
   - Valor por defecto: `'ninguno'` si no hay temas

5. **Filtro de última interacción:**
   - Obtiene de `contexto.memory?.lastInteraction`
   - Valor por defecto: `'ninguna'` si no hay interacción previa

6. **Filtro de estado emocional:**
   - Obtiene de `contexto.emotional?.mainEmotion`
   - Valor por defecto: `DEFAULT_VALUES.EMOTION` (`'neutral'`)
   - Intensidad por defecto: `DEFAULT_VALUES.INTENSITY` (`5`)

##### Estructura del System Message:
- Contexto actual (momento del día, estado emocional, temas, estilo, fase)
- Directrices (tono, adaptación emocional, consideración de historial)
- Estructura de respuesta (4 pasos definidos)

##### Mensajes de Contexto Adicionales (líneas 334-354):
**Método:** `generarMensajesContexto()`
1. **Última interacción:**
   - Si existe `contexto.memory?.lastInteraction`: Se agrega como mensaje del asistente

2. **Alerta de crisis:**
   - Si `contexto.emotional?.requiresUrgentCare` o `contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.CRISIS`
   - Se agrega mensaje del sistema: "IMPORTANTE: Usuario en posible estado de crisis. Priorizar contención y seguridad."

#### 6.4. Generación con OpenAI (líneas 177-209)

##### Filtros de Parámetros de OpenAI:
1. **Modelo:**
   - `model: OPENAI_MODEL` (`'gpt-4-turbo-preview'`)
   - Constante: `backend/constants/openai.js:OPENAI_MODEL`

2. **Temperatura (líneas 361-369):**
   - Si `contexto.urgent` o `contexto.contextual?.urgencia === 'ALTA'`: `TEMPERATURES.URGENT` (`0.3`) - más preciso
   - Si `contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.EMOTIONAL_SUPPORT`: `TEMPERATURES.EMPATHETIC` (`0.7`) - más empático
   - Por defecto: `TEMPERATURES.BALANCED` (`0.5`)
   - Constantes: `backend/constants/openai.js:TEMPERATURES`

3. **Max Tokens (líneas 376-384):**
   - Si `contexto.urgent` o `contexto.contextual?.urgencia === 'ALTA'`: `RESPONSE_LENGTHS.LONG` (`400` tokens)
   - Si `contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.GREETING`: `RESPONSE_LENGTHS.SHORT` (`200` tokens)
   - Por defecto: `RESPONSE_LENGTHS.MEDIUM` (`300` tokens)
   - Constantes: `backend/constants/openai.js:RESPONSE_LENGTHS`

4. **Penalizaciones:**
   - `presence_penalty: PENALTIES.DEFAULT` (`0.6`)
   - `frequency_penalty: PENALTIES.DEFAULT` (`0.6`)
   - Constantes: `backend/constants/openai.js:PENALTIES`

5. **Manejo de Errores de API:**
   - Errores 401 (`invalid_api_key`): Logging detallado y error descriptivo
   - Otros errores: Se re-lanzan para manejo superior

#### 6.5. Validación de Respuesta Generada (líneas 211-216)
**Validaciones aplicadas:**
- Verifica que `completion.choices[0]?.message?.content` existe
- Normaliza con `trim()`
- Valida que la respuesta no esté vacía
- Lanza error si no se generó respuesta válida

#### 6.6. Validación y Mejora de Respuesta (líneas 218-226)
**Método:** `validarYMejorarRespuesta()` (líneas 392-410)

##### Filtros de Validación:
1. **Validación inicial (líneas 393-395):**
   - Verifica que la respuesta sea un string válido
   - Si no es válida: Retorna `ERROR_MESSAGES.DEFAULT_FALLBACK`
   - Normaliza con `trim()`

2. **Filtro de respuestas genéricas (líneas 417-420):**
   - Usa `GENERIC_RESPONSE_PATTERNS` de `backend/constants/openai.js`
   - Patrones genéricos detectados:
     - `/^(Entiendo|Comprendo) (como|cómo) te sientes\.?$/i`
     - `/^(Me gustaría|Quisiera) (saber|entender) más/i`
     - `/^¿Podrías contarme más\??$/i`
   - Si es genérica: Se expande la respuesta con `expandirRespuesta()`

3. **Filtro de coherencia emocional (líneas 428-435):**
   - Verifica que la respuesta sea coherente con la emoción detectada
   - Usa `EMOTIONAL_COHERENCE_PATTERNS` de `backend/constants/openai.js`
   - Patrones por emoción:
     - `tristeza`: `/(acompaño|entiendo tu tristeza|momento difícil)/i`
     - `ansiedad`: `/(respira|un paso a la vez|manejar esta ansiedad)/i`
     - `enojo`: `/(frustración|válido sentirse así|entiendo tu molestia)/i`
   - Si no es coherente: Se ajusta la respuesta con `ajustarCoherenciaEmocional()`

4. **Ajuste de coherencia emocional (líneas 443-477):**
   - Usa `EMOTIONAL_COHERENCE_PHRASES` de `backend/constants/openai.js`
   - Frases clave por emoción:
     - `tristeza`: ['comprendo tu tristeza', 'entiendo que te sientas así', 'es normal sentirse triste']
     - `ansiedad`: ['entiendo tu preocupación', 'es normal sentirse ansioso', 'respiremos juntos']
     - `enojo`: ['entiendo tu frustración', 'es válido sentirse enojado', 'hablemos de lo que te molesta']
     - `alegría`: ['me alegro por ti', 'es genial escuchar eso', 'comparto tu alegría']
     - `neutral`: ['entiendo', 'te escucho', 'cuéntame más']
   - Ajuste de tono según intensidad:
     - Si `intensity >= THRESHOLDS.INTENSITY_HIGH` (7): Tono más empático con `ajustarTonoAlta()`
     - Si `intensity <= THRESHOLDS.INTENSITY_LOW` (3): Tono más exploratorio con `ajustarTonoBaja()`

---

### **PASO 7: Creación y Guardado del Mensaje del Asistente (dentro de openaiService)**
**Ubicación:** `openaiService.js:228-245`  
**Nota:** Este paso se ejecuta dentro de `generarRespuesta()` antes de retornar

#### Metadata guardada:
- `status: 'sent'`
- `type: 'text'`
- `context.emotional`: Análisis emocional completo
- `context.contextual`: Análisis contextual completo
- `timestamp`: Fecha y hora de creación

---

### **PASO 8: Actualización de Registros en Paralelo (dentro de openaiService)**
**Ubicación:** `openaiService.js:247-270`  
**Nota:** Este paso se ejecuta dentro de `generarRespuesta()` antes de retornar

#### Actualizaciones:
1. **Therapeutic Record:**
   - `actualizarRegistros()`: Guarda sesión con emoción, contenido y análisis
   - Actualiza `currentStatus.emotion`
   - Manejo de errores sin bloquear el flujo

2. **Progress Tracker:**
   - `progressTracker.trackProgress()`
   - Rastrea progreso del usuario

3. **Goal Tracker:**
   - `goalTracker.updateProgress()`
   - Actualiza progreso de objetivos

4. **Conversation:**
   - Actualiza `lastMessage` con el ID del mensaje del asistente

---

### **PASO 9: Validación de Coherencia Emocional Final (en chatRoutes)**
**Ubicación:** `chatRoutes.js:220-223`

#### Filtro aplicado:
- Verifica coherencia emocional con `openaiService.esCoherenteConEmocion()`
- Si no es coherente: Ajusta con `openaiService.ajustarCoherenciaEmocional()`
- **Nota:** Esta validación es redundante ya que se hace dentro de `generarRespuesta()`, pero se mantiene como validación adicional

---

### **PASO 10: Creación y Guardado del Mensaje del Asistente (en chatRoutes)**
**Ubicación:** `chatRoutes.js:225-241`

#### Metadata guardada:
- `status: 'sent'`
- `context.emotional`: Análisis emocional completo
- `context.contextual`: Análisis contextual completo
- `context.response`: Contexto de la respuesta (JSON stringificado)

**Nota:** Este paso es redundante ya que `generarRespuesta()` ya crea y guarda el mensaje. Se mantiene por compatibilidad.

---

### **PASO 11: Actualización de Registros en Paralelo (en chatRoutes)**
**Ubicación:** `chatRoutes.js:243-262`

#### Actualizaciones:
1. **Progress Tracker:**
   - `progressTracker.trackProgress()`
   - Rastrea progreso del usuario

2. **User Profile Service:**
   - `userProfileService.actualizarPerfil()`
   - Actualiza perfil con nuevos patrones detectados

3. **Conversation:**
   - Actualiza `lastMessage` con el ID del mensaje del asistente

**Nota:** Estas actualizaciones son redundantes ya que `generarRespuesta()` ya las realiza. Se mantienen por compatibilidad y como respaldo.

---

## 📊 RESUMEN DE FILTROS POR CATEGORÍA

### **FILTROS DE EMOCIÓN:**
1. ✅ Patrón: `tristeza` (intensidad base: 7, categoría: negative)
2. ✅ Patrón: `ansiedad` (intensidad base: 6, categoría: negative)
3. ✅ Patrón: `enojo` (intensidad base: 8, categoría: negative)
4. ✅ Patrón: `alegria` (intensidad base: 7, categoría: positive)
5. ✅ Patrón: `neutral` (intensidad base: 4, categoría: neutral)
6. ✅ Intensificadores: `muy`, `mucho`, `demasiado`, etc. (+2)
7. ✅ Atenuadores: `poco`, `algo`, `ligeramente`, etc. (-2)
8. ✅ Ajuste por longitud: Si >20 palabras (+1)
9. ✅ Ajuste por tendencia histórica: `increasing` (+1), `decreasing` (-1)
10. ✅ Requiere atención: Si `negative` && `intensity >= 7`

### **FILTROS DE INTENCIÓN:**
1. ✅ `CRISIS` (13 patrones, requiere seguimiento)
2. ✅ `AYUDA_EMOCIONAL` (11 patrones, requiere seguimiento)
3. ✅ `CONSULTA_IMPORTANTE` (11 patrones)
4. ✅ `CONVERSACION_GENERAL` (16 patrones)

### **FILTROS DE TEMA:**
1. ✅ `EMOCIONAL` (24 patrones)
2. ✅ `RELACIONES` (20 patrones)
3. ✅ `TRABAJO_ESTUDIO` (20 patrones)
4. ✅ `SALUD` (18 patrones)
5. ✅ `GENERAL` (19 patrones)

### **FILTROS DE URGENCIA:**
1. ✅ Patrones: `urgente`, `emergencia`, `crisis`, `ayuda.*ahora`, `grave`
2. ✅ Resultado: `ALTA` o `NORMAL`

### **FILTROS DE RESPUESTA:**
1. ✅ Temperatura: `TEMPERATURES.URGENT` (`0.3` - urgente), `TEMPERATURES.EMPATHETIC` (`0.7` - emocional), `TEMPERATURES.BALANCED` (`0.5` - default)
   - Constantes: `backend/constants/openai.js:TEMPERATURES`
2. ✅ Max Tokens: `RESPONSE_LENGTHS.LONG` (`400` - urgente), `RESPONSE_LENGTHS.SHORT` (`200` - saludo), `RESPONSE_LENGTHS.MEDIUM` (`300` - default)
   - Constantes: `backend/constants/openai.js:RESPONSE_LENGTHS`
3. ✅ Presence Penalty: `PENALTIES.DEFAULT` (`0.6`)
4. ✅ Frequency Penalty: `PENALTIES.DEFAULT` (`0.6`)
   - Constantes: `backend/constants/openai.js:PENALTIES`
5. ✅ Validación de respuestas genéricas: `GENERIC_RESPONSE_PATTERNS` (3 patrones)
   - Constantes: `backend/constants/openai.js:GENERIC_RESPONSE_PATTERNS`
6. ✅ Validación de coherencia emocional: `EMOTIONAL_COHERENCE_PATTERNS` (3 emociones con patrones)
   - Constantes: `backend/constants/openai.js:EMOTIONAL_COHERENCE_PATTERNS`
7. ✅ Ajuste de coherencia emocional: `EMOTIONAL_COHERENCE_PHRASES` (5 emociones con frases clave)
   - Constantes: `backend/constants/openai.js:EMOTIONAL_COHERENCE_PHRASES`
8. ✅ Umbrales de intensidad: `THRESHOLDS.INTENSITY_HIGH` (`7`), `THRESHOLDS.INTENSITY_LOW` (`3`)
   - Constantes: `backend/constants/openai.js:THRESHOLDS`

### **FILTROS DE CONTEXTO:**
1. ✅ Ventana temporal: 30 minutos
2. ✅ Límite de historial: 10 mensajes
3. ✅ Filtro de usuario: Solo mensajes del usuario autenticado
4. ✅ Límite de mensajes por conversación: 50 mensajes

### **FILTROS DE PERSONALIZACIÓN:**
1. ✅ Estilo comunicativo: `DEFAULT_VALUES.COMMUNICATION_STYLE` (`neutral` por defecto), `EMPATICO`, `DIRECTO`, `EXPLORATORIO`, `ESTRUCTURADO`
   - Constantes: `backend/constants/openai.js:DEFAULT_VALUES`
2. ✅ Momento del día: Usa `TIME_PERIODS` para determinar período (`mañana`, `tarde`, `noche`)
   - Constantes: `backend/constants/openai.js:TIME_PERIODS`
   - Saludos: `GREETING_VARIATIONS` por período del día
   - Constantes: `backend/constants/openai.js:GREETING_VARIATIONS`
3. ✅ Fase terapéutica: `DEFAULT_VALUES.PHASE` (`inicial` por defecto)
   - Constantes: `backend/constants/openai.js:DEFAULT_VALUES`
4. ✅ Temas recurrentes: Del historial
5. ✅ Última interacción: Del historial

### **FILTROS DE PATRONES COGNITIVOS:**
**Servicio:** `userProfileService.analizarPatronesCognitivos()`  
**Archivo:** `backend/services/userProfileService.js` (líneas 601-636)

1. ✅ **Patrón: `distorsiones`**
   - Patrón: `/(?:siempre|nunca|todo|nada|debería|tengo que)/i`
   - Detecta: Pensamiento todo-o-nada, generalización excesiva, deberías

2. ✅ **Patrón: `autocritica`**
   - Patrón: `/(?:mi culpa|soy un|no sirvo|no puedo)/i`
   - Detecta: Autocrítica negativa, culpa excesiva

3. ✅ **Patrón: `catastrofizacion`**
   - Patrón: `/(?:terrible|horrible|desastre|lo peor)/i`
   - Detecta: Pensamiento catastrófico, exageración negativa

4. ✅ **Patrón: `generalizacion`**
   - Patrón: `/(?:todos|nadie|siempre|jamás|típico)/i`
   - Detecta: Generalizaciones excesivas

### **FILTROS DE ESTRATEGIAS DE AFRONTAMIENTO:**
**Servicio:** `userProfileService.identificarEstrategiasAfrontamiento()`  
**Archivo:** `backend/services/userProfileService.js` (líneas 624-642)

1. ✅ **Estrategia: `activas`**
   - Patrón: `/(?:intenté|busqué|decidí|resolví|afronté)/i`
   - Detecta: Estrategias de afrontamiento activas

2. ✅ **Estrategia: `evitativas`**
   - Patrón: `/(?:evité|preferí no|mejor no|dejé de)/i`
   - Detecta: Estrategias de evitación

3. ✅ **Estrategia: `apoyo`**
   - Patrón: `/(?:pedí ayuda|hablé con|busqué apoyo|consulté)/i`
   - Detecta: Búsqueda de apoyo social

4. ✅ **Estrategia: `reflexivas`**
   - Patrón: `/(?:pensé en|analicé|consideré|reflexioné)/i`
   - Detecta: Estrategias reflexivas

### **FILTROS DE MEMORIA Y CONTEXTO:**
**Servicio:** `memoryService.getRelevantContext()`  
**Archivo:** `backend/services/memoryService.js`

1. ✅ **Filtro de interacciones recientes:**
   - Límite: `INTERACTIONS_LIMIT` (50 interacciones)
   - Orden: Por fecha descendente

2. ✅ **Filtro de períodos de interacción:**
   - `MORNING`: 5-11
   - `AFTERNOON`: 12-17
   - `EVENING`: 18-21
   - `NIGHT`: 22-4

3. ✅ **Filtro de intensidad emocional:**
   - `INTENSITY_HIGH_THRESHOLD`: 7
   - `INTENSITY_LOW_THRESHOLD`: 4

4. ✅ **Análisis de patrones temporales:**
   - Patrones por hora del día
   - Frecuencia de interacción por período

5. ✅ **Análisis de patrones temáticos:**
   - Temas más frecuentes
   - Frecuencia de cada tema

6. ✅ **Análisis de patrones emocionales:**
   - Emociones más frecuentes
   - Intensidad promedio
   - Tendencias emocionales

---

## 🔍 SERVICIOS INVOLUCRADOS

1. **emotionalAnalyzer** (`backend/services/emotionalAnalyzer.js`)
   - Análisis emocional con 5 emociones principales
   - Cálculo de intensidad y confianza
   - Detección de emociones secundarias

2. **contextAnalyzer** (`backend/services/contextAnalyzer.js`)
   - Análisis de intención (4 tipos)
   - Análisis de tema (5 categorías)
   - Evaluación de urgencia

3. **openaiService** (`backend/services/openaiService.js`)
   - Generación de respuesta con GPT-4
   - Construcción de prompt contextualizado
   - Validación y mejora de respuesta
   - **Constantes:** `backend/constants/openai.js`
     - Modelo, longitudes de respuesta, temperaturas, penalties
     - Valores por defecto, umbrales, períodos del día
     - Patrones de validación, coherencia emocional, mensajes de error

4. **memoryService** (`backend/services/memoryService.js`)
   - Recuperación de contexto relevante
   - Gestión de memoria contextual

5. **personalizationService** (`backend/services/personalizationService.js`)
   - Gestión de perfil de usuario
   - Preferencias de comunicación
   - Patrones detectados

6. **progressTracker** (`backend/services/progressTracker.js`)
   - Seguimiento de progreso del usuario
   - Estadísticas de interacción

7. **userProfileService** (`backend/services/userProfileService.js`)
   - Actualización de perfil
   - Detección de patrones

---

## 📝 NOTAS IMPORTANTES

- Todos los análisis se realizan en paralelo cuando es posible para optimizar rendimiento
- Los filtros se aplican en cascada: primero validación, luego análisis, luego generación
- La respuesta final pasa por múltiples validaciones antes de ser guardada
- Los errores en pasos secundarios no bloquean el flujo principal (usando `.catch(() => null)`)
- El historial se filtra por ventana temporal y cantidad máxima
- **Constantes centralizadas:** Todas las constantes de configuración están en `backend/constants/openai.js` para facilitar mantenimiento y ajustes
- **Mensajes de error:** Los mensajes de error están centralizados en `ERROR_MESSAGES` para consistencia
- **Intenciones de mensaje:** Las intenciones están definidas en `MESSAGE_INTENTS` para evitar errores tipográficos
- **Normalización de contenido:** Todo el contenido se normaliza con `trim()` antes de procesar
- **Validación robusta:** Validación de tipo, longitud y existencia en todos los métodos críticos
- **Manejo de errores mejorado:** Logging detallado con contexto (userId, conversationId) para debugging
- **Optimización de análisis:** El análisis emocional y contextual se hace una sola vez en `chatRoutes.js` y se reutiliza en `openaiService.generarRespuesta()` para evitar duplicación
- **Mejora del análisis emocional:** Se extraen patrones emocionales del historial de conversación real para ajustar la intensidad según tendencias detectadas
- **Duplicación de lógica:** Existe duplicación entre `openaiService.generarRespuesta()` (que crea y guarda el mensaje) y `chatRoutes.js` (que también lo hace). Esto se mantiene por compatibilidad pero debería consolidarse en el futuro.

---

## 🔄 PRÓXIMOS PASOS PARA REVISIÓN

### **FILTROS DE EMOCIÓN:**
1. ✅ Revisar patrones de emoción en `emotionalAnalyzer.js` (líneas 29-55)
   - 5 emociones principales: tristeza, ansiedad, enojo, alegria, neutral
2. ✅ Revisar filtros de intensidad en `emotionalAnalyzer.js` (líneas 58-60, 154-175)
   - Intensificadores, atenuadores, ajuste por longitud, ajuste por tendencia
3. ✅ Revisar ajuste por historial en `emotionalAnalyzer.js` (líneas 101-109, 253-306)
   - Ventana de historial, tendencias emocionales

### **FILTROS DE INTENCIÓN Y TEMA:**
4. ✅ Revisar patrones de intención en `patrones.js` (líneas 9-81)
   - 4 intenciones: CRISIS, AYUDA_EMOCIONAL, CONSULTA_IMPORTANTE, CONVERSACION_GENERAL
5. ✅ Revisar patrones de tema en `patrones.js` (líneas 86-215)
   - 5 temas: EMOCIONAL, RELACIONES, TRABAJO_ESTUDIO, SALUD, GENERAL
6. ✅ Revisar filtros de urgencia en `contextAnalyzer.js` (líneas 169-177)
   - Patrones de urgencia, evaluación de urgencia

### **FILTROS DE RESPUESTA:**
7. ✅ Revisar validación de mensaje en `openaiService.js` (líneas 120-138)
   - Normalización con `trim()`
   - Validación de contenido vacío
   - Validación de longitud máxima (2000 caracteres)
   - Validación de API key
8. ✅ Revisar filtros de temperatura en `openaiService.js` (líneas 361-369)
   - Usa `TEMPERATURES.URGENT` (0.3), `TEMPERATURES.EMPATHETIC` (0.7), `TEMPERATURES.BALANCED` (0.5)
   - Considera `contexto.contextual?.urgencia` y `contexto.contextual?.intencion?.tipo`
   - Constantes: `backend/constants/openai.js:TEMPERATURES`
9. ✅ Revisar filtros de longitud en `openaiService.js` (líneas 376-384)
   - Usa `RESPONSE_LENGTHS.LONG` (400), `RESPONSE_LENGTHS.SHORT` (200), `RESPONSE_LENGTHS.MEDIUM` (300)
   - Considera `contexto.contextual?.urgencia` y `contexto.contextual?.intencion?.tipo`
   - Constantes: `backend/constants/openai.js:RESPONSE_LENGTHS`
10. ✅ Revisar validación de respuesta generada en `openaiService.js` (líneas 211-216)
    - Verifica que la respuesta no esté vacía
    - Normaliza con `trim()`
    - Manejo de errores si no se genera respuesta
11. ✅ Revisar validación de respuestas genéricas en `openaiService.js` (líneas 417-420)
    - Usa `GENERIC_RESPONSE_PATTERNS` (3 patrones)
    - Validación de tipo antes de procesar
    - Constantes: `backend/constants/openai.js:GENERIC_RESPONSE_PATTERNS`
12. ✅ Revisar coherencia emocional en `openaiService.js` (líneas 428-435)
    - Usa `EMOTIONAL_COHERENCE_PATTERNS` para validación
    - Validación de null/undefined
    - Constantes: `backend/constants/openai.js:EMOTIONAL_COHERENCE_PATTERNS`
13. ✅ Revisar ajustes de coherencia emocional en `openaiService.js` (líneas 443-477)
    - Usa `EMOTIONAL_COHERENCE_PHRASES` (5 emociones con frases clave)
    - Usa `THRESHOLDS.INTENSITY_HIGH` (7) y `THRESHOLDS.INTENSITY_LOW` (3) para ajuste de tono
    - Manejo de errores con fallback
    - Constantes: `backend/constants/openai.js:EMOTIONAL_COHERENCE_PHRASES`, `THRESHOLDS`

### **FILTROS DE PATRONES COGNITIVOS:**
14. ✅ Revisar patrones cognitivos en `userProfileService.js` (líneas 601-636)
    - 4 patrones: distorsiones, autocritica, catastrofizacion, generalizacion
15. ✅ Revisar estrategias de afrontamiento en `userProfileService.js` (líneas 624-642)
    - 4 estrategias: activas, evitativas, apoyo, reflexivas

### **FILTROS DE MEMORIA Y CONTEXTO:**
16. ✅ Revisar filtros de memoria en `memoryService.js` (líneas 83-100)
    - Interacciones recientes, períodos de interacción
17. ✅ Revisar análisis de patrones en `memoryService.js` (líneas 219-264)
    - Patrones temporales, temáticos, emocionales
18. ✅ Revisar detección de patrones emocionales en `memoryService.js` (líneas 407-449)
    - Intensidad, fluctuación, emociones dominantes
19. ✅ Revisar análisis cognitivo en `memoryService.js` (líneas 456-474)
    - Patrones cognitivos por categoría

### **FILTROS DE PERSONALIZACIÓN:**
20. ✅ Revisar estilos de comunicación en `personalizationService.js` (líneas 28-53)
    - 4 estilos: EMPATICO, DIRECTO, EXPLORATORIO, ESTRUCTURADO
21. ✅ Revisar análisis de patrones en `personalizationService.js` (líneas 277-291)
    - Patrones emocionales, temporales, temáticos
22. ✅ Revisar determinación de estilo en `personalizationService.js` (líneas 383-404)
    - Lógica de determinación de estilo comunicativo

