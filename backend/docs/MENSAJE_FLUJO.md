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

##### NUEVO: Detección de Subtipos Emocionales (v2.0)
**Servicio:** `emotionalSubtypeDetector.detectSubtype()`  
**Archivo:** `backend/services/emotionalSubtypeDetector.js`

**Subtipos detectados por emoción:**
- **Tristeza:** duelo, soledad, fracaso, desesperanza, vacío, rechazo
- **Ansiedad:** social, anticipatoria, rendimiento, salud, separación, generalizada
- **Enojo:** injusticia, límite, frustración, traición, impotencia
- **Miedo:** fobia, anticipatorio, abandono, fracaso, muerte
- **Culpa:** autoculpa, responsabilidad, daño, omisión
- **Vergüenza:** exposición, autoimagen, comportamiento
- **Alegría:** logro, conexión, gratitud, esperanza, placer

##### NUEVO: Detección de Temas/Contextos (v2.0)
**Servicio:** `topicDetector.detectTopic()`  
**Archivo:** `backend/services/topicDetector.js`

**Temas detectados:**
- relaciones, trabajo, salud, autoimagen, futuro, pasado, soledad, pérdida, dinero, general

##### NUEVO: Memoria Emocional de Sesión (v2.0)
**Servicio:** `sessionEmotionalMemory`  
**Archivo:** `backend/services/sessionEmotionalMemory.js`

**Funcionalidades:**
- Mantiene buffer de últimas 20 emociones detectadas por usuario
- Analiza tendencias: racha negativa, volatilidad, emoción dominante
- Detecta patrones temporales en la sesión actual

##### Resultado del Análisis Emocional (ACTUALIZADO):
```javascript
{
  mainEmotion: string,        // Emoción principal detectada
  intensity: number,          // 1-10
  category: string,           // 'positive' | 'negative' | 'neutral'
  secondary: string[],        // Emociones secundarias
  confidence: number,         // 0-1
  requiresAttention: boolean, // true si category='negative' && intensity>=7
  // NUEVOS CAMPOS v2.0:
  subtype: string | null,     // Subtipo emocional detectado
  topic: string,              // Tema principal del mensaje
  topics: string[]            // Múltiples temas detectados
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

#### 4.3. Evaluación de Riesgo de Crisis (NUEVO)
**Ubicación:** `chatRoutes.js:223-250`  
**Función:** `evaluateSuicideRisk()`  
**Archivo:** `backend/constants/crisis.js`

##### Proceso de Evaluación:
1. **Factores de riesgo evaluados:**
   - Intención de tipo `CRISIS` (+3 puntos)
   - Indicadores directos de ideación suicida (+4 puntos)
   - Plan específico mencionado (+3 puntos)
   - Despedidas o mensajes finales (+2 puntos)
   - Desesperanza extrema (+2 puntos)
   - Intensidad emocional >= 9 (+2 puntos)
   - Tristeza extrema (intensidad >= 8) (+2 puntos)
   - Expresiones de rendición (+1 punto)

2. **Factores protectores (reducen riesgo):**
   - Búsqueda de ayuda (-1 punto)
   - Emoción secundaria de esperanza (-1 punto)
   - Expresiones de mejora (-1 punto)

3. **Niveles de riesgo:**
   - `HIGH`: Score >= 7
   - `MEDIUM`: Score >= 4
   - `LOW`: Score < 4

##### Resultado:
```javascript
{
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  isCrisis: boolean,
  country: string // País del usuario (o 'GENERAL')
}
```

#### 4.4. Envío de Alertas a Contactos de Emergencia (NUEVO)
**Ubicación:** `chatRoutes.js:230-249`  
**Servicio:** `emergencyAlertService.sendEmergencyAlerts()`  
**Archivo:** `backend/services/emergencyAlertService.js`

##### Proceso:
1. **Condiciones para enviar alertas:**
   - Solo se envían si `riskLevel === 'MEDIUM'` o `riskLevel === 'HIGH'`
   - Se verifica cooldown (máximo 1 alerta por hora por usuario)
   - Se obtienen contactos de emergencia activos del usuario (máximo 2)

2. **Contenido del email de alerta:**
   - Nombre del usuario que activó la alerta
   - Nivel de riesgo detectado
   - Mensaje de situación detectada
   - Recursos de emergencia disponibles
   - Instrucciones sobre qué hacer
   - **Nota:** No se incluye el contenido exacto del mensaje por privacidad

3. **Protecciones implementadas:**
   - Cooldown de 60 minutos entre alertas
   - Solo contactos habilitados reciben alertas
   - Manejo de errores sin bloquear el flujo principal
   - Logging detallado de envíos exitosos y fallidos

##### Resultado:
```javascript
{
  sent: boolean,
  contacts: Array<{
    contact: { name, email, relationship },
    sent: boolean,
    error: string | null
  }>,
  totalContacts: number,
  successfulSends: number,
  reason?: string // Si no se envió, razón
}
```

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

#### 6.2. Obtención de Memoria Contextual (líneas 167-175)
**Servicio:** `memoryService.getRelevantContext()`  
**Archivo:** `backend/services/memoryService.js` (líneas 83-126)  
**Constantes:** `backend/constants/memory.js`

**Optimizaciones implementadas:**
- **Consultas paralelas:** Obtiene interacciones recientes y período actual en paralelo
- **Análisis paralelo:** Analiza contexto, extrae temas y encuentra patrones comunes simultáneamente
- **Optimización MongoDB:** `getRecentInteractions()` usa agregaciones de MongoDB para ordenar y limitar en la BD

**Proceso:**
1. Obtiene interacciones recientes usando agregación MongoDB optimizada
2. Analiza contexto de interacciones (timing, frecuencia, temas)
3. Extrae temas recientes de las interacciones
4. Encuentra patrones comunes (tiempo, temas, emociones)
5. Retorna contexto completo con patrones, contexto actual e historial

#### 6.2.5. NUEVO: Memoria Emocional de Sesión (v2.0)
**Ubicación:** `chatRoutes.js:240-244`  
**Servicio:** `sessionEmotionalMemory`  
**Archivo:** `backend/services/sessionEmotionalMemory.js`

**Proceso:**
1. Se agrega el análisis emocional al buffer de sesión del usuario
2. Se analizan tendencias de la sesión actual (racha negativa, volatilidad, emoción dominante)
3. Las tendencias se incluyen en el contexto para personalizar la respuesta

**Tendencias analizadas:**
- `streakNegative`: Racha de mensajes con emociones negativas consecutivos
- `streakAnxiety`: Racha de mensajes con ansiedad
- `streakSadness`: Racha de mensajes con tristeza
- `recentTopics`: Temas más frecuentes en los últimos mensajes
- `emotionalVolatility`: Cambios de emoción en la sesión
- `averageIntensity`: Intensidad promedio en la sesión
- `dominantEmotion`: Emoción más frecuente
- `trend`: Tendencia general ('worsening', 'improving', 'stable')

#### 6.3. Construcción del Prompt Contextualizado (líneas 163-173)
**Método:** `construirPromptContextualizado()` (líneas 293-327)

##### Filtros aplicados al prompt:
1. **Filtro de momento del día:**
   - `getTimeOfDay()`: Determina período usando `TIME_PERIODS` (mañana, tarde, noche)
   - Constante: `backend/constants/openai.js:TIME_PERIODS`

2. **Filtro de estilo comunicativo:**
   - Obtiene de `contexto.profile?.preferences?.communicationStyle` (ver docs/ESTILOS_COMUNICACION.md)
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

7. **NUEVO: Filtro de subtipo emocional (v2.0):**
   - Obtiene de `contexto.emotional?.subtype`
   - Se incluye en el prompt para personalización específica

8. **NUEVO: Filtro de tema/contexto (v2.0):**
   - Obtiene de `contexto.emotional?.topic`
   - Se incluye en el prompt para contextualizar la respuesta

9. **NUEVO: Filtro de tendencias de sesión (v2.0):**
   - Obtiene de `contexto.sessionTrends`
   - Incluye información sobre rachas, volatilidad y tendencias

10. **NUEVO: Filtro de estilo de respuesta (v2.0):**
    - Obtiene de `contexto.profile?.preferences?.responseStyle`
    - Valores: `'brief'`, `'balanced'`, `'deep'`
    - Ajusta el tono y longitud de la respuesta

##### Estructura del System Message:
- Contexto actual (momento del día, estado emocional, temas, estilo, fase)
- Directrices (tono, adaptación emocional, consideración de historial)
- Estructura de respuesta (4 pasos definidos)

##### Mensajes de Contexto Adicionales (líneas 374-426):
**Método:** `generarMensajesContexto()`
1. **Última interacción:**
   - Si existe `contexto.memory?.lastInteraction`: Se agrega como mensaje del asistente

2. **Alerta de crisis (MEJORADO):**
   - Si `contexto.emotional?.requiresUrgentCare`, `contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.CRISIS`, o `contexto.crisis?.riskLevel`
   - Se genera mensaje de crisis personalizado usando `generateCrisisMessage()` de `backend/constants/crisis.js`
   - El mensaje incluye:
     - Recursos de emergencia específicos por país
     - Líneas de prevención del suicidio
     - Líneas de salud mental
     - Líneas de texto de crisis
     - Mensajes de seguridad y apoyo
   - El nivel de riesgo determina qué recursos se incluyen:
     - `HIGH`: Todos los recursos de emergencia + urgencia máxima
     - `MEDIUM`: Líneas de ayuda + plan de seguridad
     - `LOW`: Apoyo general + plan de seguridad

3. **Prompt del sistema para crisis (NUEVO):**
   - Si `contexto.crisis?.riskLevel` existe, se agrega un prompt completo de crisis al inicio del `systemMessage`
   - El prompt incluye:
     - Protocolo de intervención según nivel de riesgo
     - Recursos de emergencia disponibles
     - Instrucciones críticas para la IA
     - Generado por `generateCrisisSystemPrompt()` de `backend/constants/crisis.js`

#### 6.4. Generación con OpenAI (líneas 177-209)

##### Filtros de Parámetros de OpenAI:
1. **Modelo:**
   - `model: OPENAI_MODEL` (`'gpt-5-mini'`)
   - Constante: `backend/constants/openai.js:OPENAI_MODEL`

2. **Temperatura:**
   - GPT-5 Mini solo soporta el valor por defecto (1) - no se puede especificar otro valor
   - El parámetro `temperature` no se incluye en la llamada a la API
   - Nota: El método `determinarTemperatura()` existe pero su resultado no se usa con GPT-5 Mini

3. **Max Tokens (líneas 376-384):**
   - Si `contexto.urgent` o `contexto.contextual?.urgencia === 'ALTA'`: `RESPONSE_LENGTHS.LONG` (`400` tokens)
   - Si `contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.GREETING`: `RESPONSE_LENGTHS.SHORT` (`200` tokens)
   - Por defecto: `RESPONSE_LENGTHS.MEDIUM` (`300` tokens)
   - Constantes: `backend/constants/openai.js:RESPONSE_LENGTHS`

4. **Penalizaciones:**
   - `presence_penalty` y `frequency_penalty`: No soportados por GPT-5 Mini (removidos)
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

#### 6.5.5. NUEVO: Plantillas Terapéuticas por Emoción + Subtipo (v2.0)
**Ubicación:** `openaiService.js:238-250`  
**Servicio:** `therapeuticTemplateService`  
**Archivo:** `backend/services/therapeuticTemplateService.js`

**Proceso:**
1. Se verifica si existe una plantilla para la combinación emoción + subtipo
2. Si existe, se construye una base terapéutica estructurada con:
   - Validación emocional
   - Psicoeducación breve
   - Pregunta exploratoria
3. La base se integra con la respuesta generada por OpenAI

#### 6.5.6. NUEVO: Protocolos Terapéuticos Multi-Turno (v2.0)
**Ubicación:** `openaiService.js:232-250`  
**Servicio:** `therapeuticProtocolService`  
**Archivo:** `backend/services/therapeuticProtocolService.js`

**Proceso:**
1. Se verifica si hay un protocolo activo para el usuario
2. Si no hay protocolo activo, se evalúa si se debe iniciar uno según:
   - Emoción e intensidad detectadas
   - Subtipo emocional
   - Contexto de crisis
3. Si hay protocolo activo, se obtiene la intervención del paso actual
4. La respuesta se adapta según el paso del protocolo

**Protocolos disponibles:**
- `panic_protocol`: Para crisis de pánico (4 pasos)
- `guilt_protocol`: Para culpa intensa (4 pasos)
- `loneliness_protocol`: Para soledad (3 pasos)

#### 6.5.7. NUEVO: Chequeos de Seguridad (v2.0)
**Ubicación:** `openaiService.js:252-260`  
**Método:** `addSafetyChecks()`

**Proceso:**
- Si la intensidad es >= 8, se agregan preguntas de seguridad
- Si la intensidad es >= 9, se agregan recursos de emergencia
- Se incluyen mensajes de apoyo y recursos disponibles

#### 6.5.8. NUEVO: Respuestas con Elecciones (v2.0)
**Ubicación:** `openaiService.js:262-270`  
**Método:** `addResponseChoices()`

**Proceso:**
- Se generan 2-3 opciones según la emoción detectada
- Las opciones permiten al usuario elegir cómo continuar
- Se adaptan según la emoción, intensidad y tema

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

### **PASO 9: Creación y Guardado del Mensaje del Asistente (en chatRoutes)**
**Ubicación:** `chatRoutes.js:250-280`

#### Metadata guardada:
- `status: 'sent'`
- `context.emotional`: Análisis emocional completo (normalizado)
- `context.contextual`: Análisis contextual completo
- `context.response`: Contexto de la respuesta (JSON stringificado)

**Nota:** Este paso crea y guarda el mensaje del asistente. La respuesta ya viene validada y mejorada desde `generarRespuesta()`, que incluye:
- Validación de longitud
- Validación de respuestas genéricas
- Validación y ajuste de coherencia emocional (en `validarYMejorarRespuesta()`)
- Reducción de longitud si es necesario

**Nota sobre duplicación eliminada:** La validación de coherencia emocional que antes se hacía aquí (líneas 247-250) fue eliminada porque ya se realiza dentro de `generarRespuesta()` en el método `validarYMejorarRespuesta()` (líneas 468-471 de `openaiService.js`).

---

### **PASO 9.5. NUEVO: Generación de Sugerencias de Acciones (v2.0)**
**Ubicación:** `chatRoutes.js:520-530`  
**Servicio:** `actionSuggestionService`  
**Archivo:** `backend/services/actionSuggestionService.js`

**Proceso:**
1. Se generan sugerencias basadas en:
   - Emoción principal
   - Intensidad emocional
   - Tema detectado
   - Subtipo emocional (si existe)
2. Las sugerencias se formatean para la UI
3. Se incluyen en la respuesta JSON

**Tipos de sugerencias:**
- Ejercicios de respiración
- Técnicas de grounding
- Herramientas de comunicación
- Ejercicios de autocompasión
- Actividades de autocuidado
- Y más según el contexto

### **PASO 10: Actualización de Registros en Paralelo (en chatRoutes)**
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
1. ✅ `CRISIS` (73 patrones, requiere seguimiento)
2. ✅ `AYUDA_EMOCIONAL` (patrones expandidos, requiere seguimiento)
3. ✅ `CONSULTA_IMPORTANTE` (patrones expandidos)
4. ✅ `CONVERSACION_GENERAL` (patrones expandidos)

### **FILTROS DE CRISIS Y RIESGO:**
1. ✅ **Evaluación de riesgo suicida** (`backend/constants/crisis.js:evaluateSuicideRisk`)
   - Factores de riesgo: intención CRISIS, ideación suicida, plan específico, despedidas, desesperanza, intensidad emocional
   - Factores protectores: búsqueda de ayuda, esperanza, mejoras
   - Niveles: `LOW`, `MEDIUM`, `HIGH`
2. ✅ **Recursos de emergencia por país** (`backend/constants/crisis.js:EMERGENCY_LINES`)
   - Líneas de emergencia, prevención del suicidio, salud mental, texto de crisis
   - Países: ARGENTINA, MEXICO, ESPANA, COLOMBIA, CHILE, PERU, GENERAL
3. ✅ **Protocolo de intervención en crisis** (`backend/constants/crisis.js:CRISIS_PROTOCOL`)
   - Pasos estructurados según nivel de riesgo
   - Acciones específicas por nivel (LOW, MEDIUM, HIGH)
4. ✅ **Mensajes de crisis estructurados** (`backend/constants/crisis.js:CRISIS_MESSAGES`)
   - Mensajes personalizados según nivel de riesgo
   - Integración automática en prompts de OpenAI

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
**Constantes:** `backend/constants/memory.js`

#### **Métodos Principales:**
1. ✅ **`getRelevantContext(userId, content, currentAnalysis)`** (líneas 83-126)
   - Recupera contexto relevante del historial
   - Usa consultas paralelas para optimizar rendimiento
   - Retorna patrones, contexto actual e historial

2. ✅ **`getRecentInteractions(userId, limit)`** (líneas 134-171)
   - **Optimizado con agregación MongoDB:** Ordena y limita en la BD
   - Usa `$unwind`, `$sort`, `$limit` para eficiencia
   - Fallback al método anterior si la agregación falla
   - Límite por defecto: `LIMITS.DEFAULT_QUERY` (10)

3. ✅ **`analyzeTemporalTrends(userId, options)`** (NUEVO)
   - Analiza tendencias temporales en las interacciones
   - Detecta mejoras/empeoramientos emocionales
   - Identifica patrones semanales y diarios
   - Genera resumen automático de tendencias

4. ✅ **`detectAdvancedPatterns(userId)`** (NUEVO)
   - Detecta correlaciones entre emociones y días/horas
   - Identifica triggers emocionales (eventos que preceden emociones)
   - Detecta ciclos emocionales (patrones que se repiten)
   - Analiza transiciones emocionales

#### **Filtros y Constantes:**

1. ✅ **Filtro de interacciones recientes:**
   - Límite almacenado: `LIMITS.INTERACTIONS` (50 interacciones)
   - Límite consulta: `LIMITS.DEFAULT_QUERY` (10 por defecto)
   - Orden: Por fecha descendente (optimizado con agregación MongoDB)
   - Constantes: `backend/constants/memory.js:LIMITS`

2. ✅ **Filtro de períodos de interacción:**
   - `MORNING`: 5-11
   - `AFTERNOON`: 12-17
   - `EVENING`: 18-21
   - `NIGHT`: 22-4
   - Constantes: `backend/constants/memory.js:INTERACTION_PERIODS`

3. ✅ **Filtro de intensidad emocional:**
   - `INTENSITY.HIGH_THRESHOLD`: 7
   - `INTENSITY.LOW_THRESHOLD`: 4
   - `INTENSITY.DEFAULT`: 5
   - `INTENSITY.MIN`: 1, `INTENSITY.MAX`: 10
   - Constantes: `backend/constants/memory.js:INTENSITY`

4. ✅ **Análisis de patrones temporales:**
   - Patrones por hora del día
   - Frecuencia de interacción por período
   - Cálculo de frecuencia diaria y semanal (últimas 24h y 7 días)

5. ✅ **Análisis de patrones temáticos:**
   - Temas más frecuentes
   - Frecuencia de cada tema
   - Extracción de temas de `metadata.topics` y `patterns`

6. ✅ **Análisis de patrones emocionales:**
   - Emociones más frecuentes
   - Intensidad promedio
   - Tendencias emocionales
   - Compatible con estructuras `metadata.emotional.mainEmotion` y `emotion` directo

7. ✅ **Análisis de tendencias temporales (NUEVO):**
   - Tendencias emocionales: `improving`, `declining`, `stable`
   - Tendencias de intensidad: `increasing`, `decreasing`, `stable`
   - Patrones semanales: Detección de días con mayor actividad emocional
   - Patrones diarios: Horas pico y períodos más activos
   - Ventana de análisis: Configurable (por defecto 30 días)
   - Constantes: `backend/constants/memory.js:TIME_WINDOWS`, `LIMITS.TREND_ANALYSIS` (30)

8. ✅ **Detección de patrones avanzados (NUEVO):**
   - **Correlaciones:** Emociones con días de la semana, períodos del día, horas
   - **Triggers:** Eventos que preceden emociones negativas (dentro de 24h)
   - **Ciclos:** Patrones emocionales que se repiten semanalmente
   - **Transiciones:** Análisis de cambios entre emociones
   - Umbrales: `PATTERN_CONFIG.MIN_CORRELATION_STRENGTH` (0.6), `PATTERN_CONFIG.MIN_PATTERN_OCCURRENCES` (3)
   - Constantes: `backend/constants/memory.js:PATTERN_CONFIG`, `LIMITS.PATTERN_DETECTION` (20)

---

## 🔍 SERVICIOS INVOLUCRADOS

1. **emotionalAnalyzer** (`backend/services/emotionalAnalyzer.js`)
   - Análisis emocional con 9 emociones principales
   - Cálculo de intensidad y confianza
   - Detección de emociones secundarias

2. **contextAnalyzer** (`backend/services/contextAnalyzer.js`)
   - Análisis de intención (4 tipos)
   - Análisis de tema (5 categorías)
   - Evaluación de urgencia

3. **crisis.js** (`backend/constants/crisis.js`) (NUEVO)
   - Evaluación de riesgo suicida
   - Recursos de emergencia por país
   - Protocolo de intervención en crisis
   - Generación de mensajes y prompts de crisis

4. **emergencyAlertService** (`backend/services/emergencyAlertService.js`) (NUEVO)
   - Envío de alertas a contactos de emergencia
   - Gestión de cooldown para evitar spam
   - Generación de emails de alerta personalizados
   - Manejo de contactos de emergencia del usuario

5. **openaiService** (`backend/services/openaiService.js`)
   - Generación de respuesta con GPT-5 Mini
   - Construcción de prompt contextualizado
   - Validación y mejora de respuesta
   - **Constantes:** `backend/constants/openai.js`
     - Modelo, longitudes de respuesta, temperaturas, penalties
     - Valores por defecto, umbrales, períodos del día
     - Patrones de validación, coherencia emocional, mensajes de error

6. **memoryService** (`backend/services/memoryService.js`)
   - Recuperación de contexto relevante (optimizado con consultas paralelas)
   - Gestión de memoria contextual
   - Análisis de tendencias temporales
   - Detección de patrones avanzados (correlaciones, triggers, ciclos, transiciones)
   - **Constantes:** `backend/constants/memory.js`
     - Umbrales de intensidad, límites, períodos de interacción
     - Ventanas de tiempo, configuración de patrones, días de la semana

7. **personalizationService** (`backend/services/personalizationService.js`)
   - Gestión de perfil de usuario
   - Preferencias de comunicación
   - Patrones detectados

8. **progressTracker** (`backend/services/progressTracker.js`)
   - Seguimiento de progreso del usuario
   - Estadísticas de interacción

9. **userProfileService** (`backend/services/userProfileService.js`)
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
- **Optimización de memoryService:** 
  - Consultas MongoDB optimizadas con agregaciones (ordenamiento y limitación en la BD)
  - Consultas paralelas en `getRelevantContext()` para mejor rendimiento
  - Nuevos métodos para análisis de tendencias temporales y patrones avanzados
  - Constantes centralizadas en `backend/constants/memory.js`
- **Sistema de crisis implementado:**
  - Evaluación automática de riesgo suicida en `chatRoutes.js` usando `evaluateSuicideRisk()`
  - Recursos de emergencia por país en `backend/constants/crisis.js`
  - Protocolo estructurado de intervención según nivel de riesgo (LOW, MEDIUM, HIGH)
  - Integración automática en prompts de OpenAI para respuestas de crisis
  - Mensajes de crisis personalizados según nivel de riesgo detectado
  - Prompt del sistema de crisis agregado automáticamente cuando se detecta riesgo
- **Sistema de alertas a contactos de emergencia:**
  - Modelo de Usuario actualizado con campo `emergencyContacts` (máximo 2 contactos)
  - Servicio `emergencyAlertService` para enviar alertas automáticas
  - Alertas enviadas cuando se detecta riesgo MEDIUM o HIGH
  - Cooldown de 60 minutos para evitar spam de alertas
  - Emails de alerta personalizados con recursos de emergencia
  - Rutas API para gestionar contactos de emergencia (GET, POST, PUT, DELETE, PATCH)
  - Protección de privacidad: no se incluye el contenido exacto del mensaje en las alertas
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
16. ✅ Revisar filtros de memoria en `memoryService.js` (líneas 83-126)
    - Interacciones recientes (optimizado con agregación MongoDB)
    - Períodos de interacción
    - Consultas paralelas para mejor rendimiento
    - Constantes: `backend/constants/memory.js`
17. ✅ Revisar análisis de patrones en `memoryService.js` (líneas 164-200, 218-325)
    - Patrones temporales, temáticos, emocionales
    - Cálculo de frecuencia diaria y semanal
    - Compatibilidad con múltiples estructuras de datos
18. ✅ Revisar detección de patrones emocionales en `memoryService.js` (líneas 304-325, 456-525)
    - Intensidad, fluctuación, emociones dominantes
    - Análisis de tendencias emocionales a lo largo del tiempo
19. ✅ Revisar análisis cognitivo en `memoryService.js` (líneas 532-551)
    - Patrones cognitivos por categoría
20. ✅ Revisar análisis de tendencias temporales en `memoryService.js` (NUEVO)
    - `analyzeTemporalTrends()`: Tendencias emocionales, intensidad, patrones semanales/diarios
    - Detección de mejoras/empeoramientos
    - Generación de resúmenes automáticos
21. ✅ Revisar detección de patrones avanzados en `memoryService.js` (NUEVO)
    - `detectAdvancedPatterns()`: Correlaciones, triggers, ciclos, transiciones
    - Configuración de umbrales en `PATTERN_CONFIG`
    - Análisis de confianza basado en cantidad de interacciones

### **FILTROS DE PERSONALIZACIÓN:**
22. ✅ Revisar estilos de comunicación en `personalizationService.js` (líneas 28-53)
    - 4 estilos: EMPATICO, DIRECTO, EXPLORATORIO, ESTRUCTURADO
23. ✅ Revisar análisis de patrones en `personalizationService.js` (líneas 277-291)
    - Patrones emocionales, temporales, temáticos
24. ✅ Revisar determinación de estilo en `personalizationService.js` (líneas 383-404)
    - Lógica de determinación de estilo comunicativo

