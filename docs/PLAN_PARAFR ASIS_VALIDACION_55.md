# Plan de Implementación: Propuesta #55 - Paráfrasis + validación antes consejo

## Resumen Ejecutivo

**Objetivo:** Implementar la habilidad terapéutica fundamental de **paráfrasis** en el chat: el asistente debe reflejar/reformular la emoción o necesidad del usuario **antes** de orientar o intervenir.

**Valor:** Mejora alianza terapéutica, reduce alucinaciones interpretativas, aumenta sensación de ser escuchado/a.

**Métricas clave:**
- Urg=3, Imp=5, Ret=5, Imp*=5
- Costo=M, Tiempo=M, Q2

**Arquitectura:** 3 fases (Backend Policy + Detección, Backend Validación + Métricas, Análisis de Impacto)

---

## Contexto Técnico Actual

### Flujo del chat (simplificado)
```
Usuario envía mensaje
    ↓
POST /api/chat/conversations/:id/messages
    ↓
Análisis de contexto (emotional, factual, crisis, etc.)
    ↓
openaiPromptBuilder.js construye system prompt + history
    ↓
openaiService.createChatCompletion() → OpenAI API
    ↓
Persistencia en Message + respuesta al cliente
```

### Puntos de inyección identificados
1. **`openaiPromptBuilder.js`**: Ya tiene snippets modulares (grounding, crisis, session phase, etc.)
2. **Metadata del turno**: `Message.metadata.context` almacena análisis emocional
3. **Pipeline de enhancements**: `chatTurnEnhancementsService.js` coordina mejoras del turno

---

## Fase 1: Backend - Policy de Paráfrasis + Detección

**Objetivo:** Instruir al LLM para que use paráfrasis y detectar cuándo es necesaria.

### 1.1 Servicio de Policy de Paráfrasis

**Archivo:** `backend/services/chat/paraphrasisPolicySnippet.js`

```javascript
/**
 * Policy snippet bilingüe (ES/EN) que instruye al LLM a parafrasear
 * antes de intervenir en turnos de carga emocional significativa.
 */

/**
 * Construye el snippet de policy de paráfrasis según idioma y contexto.
 * 
 * @param {string} language - Idioma ('es' o 'en')
 * @param {Object} context - Contexto del turno
 * @param {number} context.emotionalIntensity - Intensidad emocional (1-10)
 * @param {string} context.mainEmotion - Emoción principal
 * @param {boolean} context.isFirstTurn - Si es el primer turno del usuario
 * @returns {string} Snippet de policy o string vacío si no aplica
 */
export function buildParaphrasisPolicySnippet(language, context) {
  // Reglas de disparo: cuándo se requiere paráfrasis
  const requiresParaphrasis = shouldRequireParaphrasis(context);
  
  if (!requiresParaphrasis) {
    return '';
  }
  
  if (language === 'en') {
    return `

## Paraphrasing before intervening

Before offering guidance or suggestions, **first paraphrase** what the user expressed:
- Reflect their emotion and core need in your own words
- Validate their experience without interpretation
- Ask for confirmation: "Did I understand correctly?"

Only after the user confirms or clarifies, offer your therapeutic response.

Example:
User: "Estoy muy estresada en el trabajo, ya no puedo más."
You: "Entiendo que el trabajo te está generando mucho estrés y sientes que llegaste a un límite. ¿Es así?"
[Espera confirmación]
You: "Te escucho. Cuando sientas que no puedes más..."
`;
  }
  
  // Español (default)
  return `

## Paráfrasis antes de intervenir

Antes de ofrecer orientación o sugerencias, **primero parafrasea** lo que expresó el usuario:
- Refleja su emoción y necesidad central con tus propias palabras
- Valida su experiencia sin interpretación
- Pide confirmación: "¿Te entendí bien?"

Solo después de que el usuario confirme o aclare, ofrece tu respuesta terapéutica.

Ejemplo:
Usuario: "Estoy muy estresada en el trabajo, ya no puedo más."
Tú: "Entiendo que el trabajo te está generando mucho estrés y sientes que llegaste a un límite. ¿Es así?"
[Espera confirmación]
Tú: "Te escucho. Cuando sientas que no puedes más..."
`;
}

/**
 * Determina si el turno actual requiere paráfrasis.
 * 
 * Reglas de disparo:
 * 1. Intensidad emocional >= 7 (alta carga emocional)
 * 2. Primer turno del usuario en la conversación (establecer alianza)
 * 3. Usuario expresa sentimiento de no ser escuchado/comprendido
 * 4. Cambio abrupto de tema o tono
 * 5. Usuario comparte contenido vulnerable (trauma, vergüenza, etc.)
 * 
 * Excepciones (NO requiere paráfrasis):
 * - Crisis activa (protocolo de crisis tiene prioridad)
 * - Consulta factual breve (ej: "¿Qué es CBT?")
 * - Mensaje muy corto sin carga emocional (<10 caracteres)
 * - Usuario ya confirmó comprensión en turno anterior
 * 
 * @param {Object} context
 * @returns {boolean}
 */
export function shouldRequireParaphrasis(context) {
  const {
    emotionalIntensity = 5,
    mainEmotion,
    isFirstTurn = false,
    isCrisisActive = false,
    isFactualQuery = false,
    messageLength = 0,
    hasAbruptToneChange = false,
    previousTurnWasParaphrasis = false,
  } = context;
  
  // Excepciones: NO parafrasear
  if (isCrisisActive) return false; // Crisis tiene prioridad
  if (isFactualQuery) return false; // Consulta factual no necesita paráfrasis
  if (messageLength < 10) return false; // Mensaje muy corto
  if (previousTurnWasParaphrasis) return false; // Ya parafraseamos en turno anterior
  
  // Reglas de disparo: SÍ parafrasear
  if (emotionalIntensity >= 7) return true; // Alta carga emocional
  if (isFirstTurn) return true; // Primer contacto
  if (hasAbruptToneChange) return true; // Cambio de tono
  
  // Emociones que siempre requieren paráfrasis
  const vulnerableEmotions = ['miedo', 'tristeza', 'vergüenza', 'culpa', 'ansiedad'];
  if (mainEmotion && vulnerableEmotions.includes(mainEmotion.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Detecta si el usuario expresa que no se siente escuchado/comprendido.
 * Patterns: "no me entiendes", "no me escuchas", "parece que no captas", etc.
 */
export function detectsLackOfUnderstanding(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return false;
  
  const patterns = [
    /no\s+(me\s+)?(entiendes?|comprendes?|escuchas?|captas?)/i,
    /parece\s+que\s+no\s+(me\s+)?(entiendes?|escuchas?)/i,
    /siento\s+que\s+no\s+(me\s+)?(entiendes?|escuchas?)/i,
    /no\s+(estás?|estas?)\s+entendiendo/i,
  ];
  
  return patterns.some(pattern => pattern.test(userMessage));
}

/**
 * Marca el turno como paráfrasis en los metadatos.
 * Esto permite evitar parafrasear dos veces seguidas.
 */
export function markTurnAsParaphrasis(metadata) {
  return {
    ...metadata,
    paraphrasis: {
      wasParaphrasis: true,
      timestamp: new Date().toISOString(),
    },
  };
}
```

### 1.2 Integración en `openaiPromptBuilder.js`

**Modificación:** Inyectar el snippet de paráfrasis en el system prompt cuando aplique.

```javascript
// En buildContextualizedPrompt()

// Después del snippet de grounding (#63)
// Paráfrasis policy (#55)
const paraphrasContext = {
  emotionalIntensity: contexto.emotional?.intensity || 5,
  mainEmotion: contexto.emotional?.mainEmotion,
  isFirstTurn: !conversationHasUserMessages, // o similar flag
  isCrisisActive: contexto.crisis?.isActive || false,
  isFactualQuery: contexto.factual?.isFactual || false,
  messageLength: mensaje.content?.length || 0,
  hasAbruptToneChange: contexto.toneChange?.isAbrupt || false,
  previousTurnWasParaphrasis: lastAssistantTurn?.metadata?.paraphrasis?.wasParaphrasis || false,
};

const paraphrasisSnippet = buildParaphrasisPolicySnippet(language, paraphrasContext);
if (paraphrasisSnippet) {
  systemMessage += paraphrasisSnippet;
}
```

### 1.3 Tests Unitarios

**Archivo:** `backend/tests/unit/services/paraphrasisPolicySnippet.test.js`

```javascript
describe('paraphrasisPolicySnippet', () => {
  describe('shouldRequireParaphrasis', () => {
    test('debe requerir paráfrasis para alta intensidad emocional', () => {
      const context = { emotionalIntensity: 8 };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });
    
    test('NO debe requerir paráfrasis durante crisis activa', () => {
      const context = { emotionalIntensity: 9, isCrisisActive: true };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });
    
    test('debe requerir paráfrasis en primer turno', () => {
      const context = { isFirstTurn: true };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });
    
    test('NO debe requerir paráfrasis para consulta factual', () => {
      const context = { emotionalIntensity: 7, isFactualQuery: true };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });
    
    test('NO debe parafrasear dos veces seguidas', () => {
      const context = { emotionalIntensity: 8, previousTurnWasParaphrasis: true };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });
    
    // ... más tests para cada regla
  });
  
  describe('buildParaphrasisPolicySnippet', () => {
    test('debe devolver snippet en español con reglas de paráfrasis', () => {
      const context = { emotionalIntensity: 8 };
      const snippet = buildParaphrasisPolicySnippet('es', context);
      
      expect(snippet).toContain('Paráfrasis antes de intervenir');
      expect(snippet).toContain('parafrasea');
      expect(snippet).toContain('Ejemplo:');
    });
    
    test('debe devolver snippet en inglés', () => {
      const context = { emotionalIntensity: 8 };
      const snippet = buildParaphrasisPolicySnippet('en', context);
      
      expect(snippet).toContain('Paraphrasing before intervening');
      expect(snippet).toContain('paraphrase');
    });
    
    test('debe devolver string vacío si no requiere paráfrasis', () => {
      const context = { emotionalIntensity: 3, isFactualQuery: true };
      const snippet = buildParaphrasisPolicySnippet('es', context);
      
      expect(snippet).toBe('');
    });
  });
  
  describe('detectsLackOfUnderstanding', () => {
    test('debe detectar "no me entiendes"', () => {
      expect(detectsLackOfUnderstanding('Siento que no me entiendes')).toBe(true);
    });
    
    test('debe detectar "parece que no captas"', () => {
      expect(detectsLackOfUnderstanding('Parece que no captas lo que digo')).toBe(true);
    });
    
    test('NO debe detectar en mensaje sin señal', () => {
      expect(detectsLackOfUnderstanding('Hoy fue un buen día')).toBe(false);
    });
  });
});
```

### 1.4 Detección de Contexto Adicional

**Modificación en `chatRoutes.js` o servicio de análisis:**

```javascript
// Agregar detección de cambio abrupto de tono
const hasAbruptToneChange = detectAbruptToneChange(
  userMessage.content,
  lastUserMessage?.metadata?.context?.emotional
);

// Agregar a contexto
analysisContext.toneChange = {
  isAbrupt: hasAbruptToneChange,
};
```

---

## Fase 2: Backend - Validación de Calidad + Métricas

**Objetivo:** Asegurar que las paráfrasis sean fieles y medir impacto.

### 2.1 Detección de Paráfrasis en Respuesta

**Archivo:** `backend/services/chat/paraphrasDetectionService.js`

```javascript
/**
 * Analiza si la respuesta del asistente contiene una paráfrasis.
 * 
 * Heurísticas:
 * - Presencia de frases clave: "Entiendo que...", "Te escucho...", "Veo que...", etc.
 * - Pregunta de confirmación: "¿Es así?", "¿Te entendí bien?", etc.
 * - Similitud semántica con mensaje del usuario (pero no copia textual)
 * - Longitud moderada (no muy corta ni muy larga)
 * 
 * @param {string} assistantMessage - Respuesta del asistente
 * @param {string} userMessage - Mensaje original del usuario
 * @returns {Object} { hasParaphrasis: boolean, confidence: number (0-1) }
 */
export function detectParaphrasisInResponse(assistantMessage, userMessage) {
  if (!assistantMessage || !userMessage) {
    return { hasParaphrasis: false, confidence: 0 };
  }
  
  let score = 0;
  
  // 1. Frases clave de paráfrasis (peso: 0.4)
  const paraphrasisPhrases = [
    /entiendo\s+que/i,
    /veo\s+que/i,
    /te\s+escucho/i,
    /siento\s+que\s+(estás?|sientes?)/i,
    /lo\s+que\s+(me\s+)?(dices?|comentas?|cuentas?)\s+es/i,
    /parece\s+que/i,
  ];
  
  const hasPhraseKey = paraphrasisPhrases.some(p => p.test(assistantMessage));
  if (hasPhraseKey) score += 0.4;
  
  // 2. Pregunta de confirmación (peso: 0.3)
  const confirmationQuestions = [
    /¿(te\s+entendí|entendí)\s+(bien|correctamente)/i,
    /¿es\s+así/i,
    /¿así\s+es/i,
    /¿verdad/i,
    /¿estoy\s+en\s+lo\s+correcto/i,
  ];
  
  const hasConfirmation = confirmationQuestions.some(q => q.test(assistantMessage));
  if (hasConfirmation) score += 0.3;
  
  // 3. No debe ser muy corta (mínimo 20 caracteres)
  if (assistantMessage.length >= 20) score += 0.1;
  
  // 4. No debe ser copia textual (Levenshtein > 0.5)
  const similarity = calculateSimilarity(assistantMessage, userMessage);
  if (similarity > 0.3 && similarity < 0.8) {
    score += 0.2;
  }
  
  return {
    hasParaphrasis: score >= 0.5,
    confidence: Math.min(score, 1.0),
  };
}

/**
 * Calcula similitud entre dos strings (simplificada).
 * Retorna valor entre 0 (totalmente diferentes) y 1 (idénticos).
 */
function calculateSimilarity(str1, str2) {
  // Implementación simple: palabras en común / total palabras únicas
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}
```

### 2.2 Métricas de Paráfrasis

**Archivo:** `backend/services/chat/paraphrasMetricsService.js`

```javascript
/**
 * Servicio para rastrear métricas de uso de paráfrasis.
 * Permite medir adopción, calidad, y correlación con retención.
 */

import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';

/**
 * Registra métricas de paráfrasis en el turno.
 * Se llama después de persistir el mensaje del asistente.
 */
export async function recordParaphrasMetrics(conversationId, messageId, metricsData) {
  const {
    wasRequired,      // boolean: ¿se requería paráfrasis según reglas?
    wasDetected,      // boolean: ¿se detectó paráfrasis en la respuesta?
    confidence,       // number: confianza de detección (0-1)
    emotionalContext, // object: contexto emocional del turno
  } = metricsData;
  
  try {
    // Actualizar metadatos del mensaje
    await Message.findByIdAndUpdate(messageId, {
      'metadata.paraphrasis': {
        wasRequired,
        wasDetected,
        confidence,
        timestamp: new Date(),
      },
    });
    
    // Agregar a métricas de conversación (para análisis agregado)
    await Conversation.findByIdAndUpdate(conversationId, {
      $inc: {
        'metrics.paraphrasisRequired': wasRequired ? 1 : 0,
        'metrics.paraphrasisDetected': wasDetected ? 1 : 0,
      },
    });
    
    // Log para análisis (opcional: enviar a servicio de métricas)
    console.log('[ParaphrasMetrics]', {
      conversationId,
      messageId,
      wasRequired,
      wasDetected,
      confidence,
      emotionalIntensity: emotionalContext?.intensity,
    });
  } catch (error) {
    console.error('[ParaphrasMetrics] Error recording metrics:', error);
    // No fallar el flujo si las métricas fallan
  }
}

/**
 * Obtiene estadísticas agregadas de paráfrasis para análisis.
 */
export async function getParaphrasStats(filters = {}) {
  const {
    userId,
    conversationId,
    startDate,
    endDate,
  } = filters;
  
  const match = {};
  if (userId) match.userId = userId;
  if (conversationId) match._id = conversationId;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await Conversation.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        totalParaphrasisRequired: { $sum: '$metrics.paraphrasisRequired' },
        totalParaphrasisDetected: { $sum: '$metrics.paraphrasisDetected' },
      },
    },
    {
      $project: {
        _id: 0,
        totalConversations: 1,
        totalParaphrasisRequired: 1,
        totalParaphrasisDetected: 1,
        adherenceRate: {
          $cond: {
            if: { $gt: ['$totalParaphrasisRequired', 0] },
            then: { $divide: ['$totalParaphrasisDetected', '$totalParaphrasisRequired'] },
            else: 0,
          },
        },
      },
    },
  ]);
  
  return stats[0] || {
    totalConversations: 0,
    totalParaphrasisRequired: 0,
    totalParaphrasisDetected: 0,
    adherenceRate: 0,
  };
}
```

### 2.3 Integración en Pipeline de Chat

**Modificación en `chatRoutes.js` (POST /messages):**

```javascript
// Después de recibir respuesta de OpenAI y antes de persistir

// Detectar si la respuesta contiene paráfrasis
const paraphrasisDetection = detectParaphrasisInResponse(
  assistantMessage.content,
  userMessage.content
);

// Registrar métricas
await recordParaphrasMetrics(conversationId, assistantMessage._id, {
  wasRequired: paraphrasContext.requiresParaphrasis,
  wasDetected: paraphrasisDetection.hasParaphrasis,
  confidence: paraphrasisDetection.confidence,
  emotionalContext: analysisContext.emotional,
});

// Marcar turno si hubo paráfrasis (para evitar repetir)
if (paraphrasisDetection.hasParaphrasis) {
  assistantMessage.metadata = markTurnAsParaphrasis(assistantMessage.metadata);
}
```

### 2.4 Tests de Validación

**Archivo:** `backend/tests/unit/services/paraphrasDetectionService.test.js`

```javascript
describe('paraphrasDetectionService', () => {
  describe('detectParaphrasisInResponse', () => {
    test('debe detectar paráfrasis con frase clave + confirmación', () => {
      const assistant = 'Entiendo que estás muy estresada con el trabajo. ¿Te entendí bien?';
      const user = 'Estoy muy estresada en el trabajo';
      
      const result = detectParaphrasisInResponse(assistant, user);
      
      expect(result.hasParaphrasis).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
    
    test('NO debe detectar paráfrasis en respuesta directa', () => {
      const assistant = 'Puedes intentar técnicas de respiración para relajarte.';
      const user = 'Estoy muy estresada';
      
      const result = detectParaphrasisInResponse(assistant, user);
      
      expect(result.hasParaphrasis).toBe(false);
    });
    
    test('NO debe detectar copia textual como paráfrasis', () => {
      const assistant = 'Estoy muy estresada en el trabajo.';
      const user = 'Estoy muy estresada en el trabajo.';
      
      const result = detectParaphrasisInResponse(assistant, user);
      
      expect(result.hasParaphrasis).toBe(false);
    });
  });
});
```

### 2.5 Hardening: Límites y Fallbacks

```javascript
// En paraphrasisPolicySnippet.js

/**
 * Límites y constraints para paráfrasis
 */
export const PARAPHRASIS_LIMITS = {
  MAX_USER_MESSAGE_LENGTH: 500,  // No parafrasear mensajes muy largos (resumir en cambio)
  MIN_USER_MESSAGE_LENGTH: 10,   // No parafrasear mensajes muy cortos
  MAX_CONSECUTIVE_PARAPHRASIS: 3, // Máximo 3 paráfrasis consecutivas en conversación
  COOLDOWN_TURNS: 2,              // Turnos de espera después de paráfrasis
};

/**
 * Valida constraints adicionales antes de requerir paráfrasis.
 */
export function validateParaphrasisConstraints(context, conversationHistory) {
  const { messageLength } = context;
  
  // Mensaje muy largo: mejor resumir que parafrasear
  if (messageLength > PARAPHRASIS_LIMITS.MAX_USER_MESSAGE_LENGTH) {
    return { valid: false, reason: 'message_too_long' };
  }
  
  // Mensaje muy corto
  if (messageLength < PARAPHRASIS_LIMITS.MIN_USER_MESSAGE_LENGTH) {
    return { valid: false, reason: 'message_too_short' };
  }
  
  // Contar paráfrasis consecutivas recientes
  const recentParaphrasis = countRecentParaphrasis(conversationHistory, PARAPHRASIS_LIMITS.COOLDOWN_TURNS);
  if (recentParaphrasis >= PARAPHRASIS_LIMITS.MAX_CONSECUTIVE_PARAPHRASIS) {
    return { valid: false, reason: 'max_consecutive_reached' };
  }
  
  return { valid: true };
}
```

---

## Fase 3: Análisis de Impacto + Iteración

**Objetivo:** Medir impacto en métricas de negocio y calidad terapéutica.

### 3.1 Correlación con WAI (#98)

Analizar si el uso de paráfrasis correlaciona con mejores scores en:
- "¿Te sentiste escuchado/a?" (eje WAI más relevante)
- "¿Te sentiste a salvo al compartir?"

```javascript
// Query de análisis (ejecutar manualmente o en dashboard)
db.conversations.aggregate([
  {
    $lookup: {
      from: 'messages',
      localField: '_id',
      foreignField: 'conversationId',
      as: 'messages',
    },
  },
  {
    $addFields: {
      paraphrasisRate: {
        $cond: {
          if: { $gt: [{ $sum: '$metrics.paraphrasisRequired' }, 0] },
          then: {
            $divide: [
              { $sum: '$metrics.paraphrasisDetected' },
              { $sum: '$metrics.paraphrasisRequired' },
            ],
          },
          else: 0,
        },
      },
    },
  },
  {
    $lookup: {
      from: 'session_wai_feedback',
      localField: '_id',
      foreignField: 'conversationId',
      as: 'waiFeedback',
    },
  },
  // ... análisis de correlación
]);
```

### 3.2 A/B Testing (opcional)

Si queremos validar impacto de forma controlada:

```javascript
// Feature flag en config
export const PARAPHRASIS_FEATURE_FLAG = {
  enabled: process.env.PARAPHRASIS_ENABLED === 'true',
  rolloutPercentage: parseInt(process.env.PARAPHRASIS_ROLLOUT) || 50, // 50% de usuarios
};

// En shouldRequireParaphrasis()
if (!PARAPHRASIS_FEATURE_FLAG.enabled) return false;

// A/B: asignar usuario a grupo control o tratamiento
const userIdHash = hashUserId(userId);
const isInTreatmentGroup = (userIdHash % 100) < PARAPHRASIS_FEATURE_FLAG.rolloutPercentage;

if (!isInTreatmentGroup) return false;
```

### 3.3 Métricas de Producto

**KPIs a monitorear:**

1. **Tasa de adherencia:** % de turnos donde se requería paráfrasis y se detectó
   - Target: >70%

2. **Impacto en WAI "escuchado":** Comparar score antes/después
   - Target: +0.5 puntos en escala 1-5

3. **Tasa de "no me entiendes":** Reducción de mensajes donde usuario expresa frustración
   - Target: -30%

4. **Retención D7/D30:** Impacto en usuarios que experimentan paráfrasis vs control
   - Target: +5% retención D7

5. **Latencia adicional:** Tiempo extra por incluir paráfrasis en prompt
   - Target: <100ms p95

### 3.4 Dashboard de Monitoreo

```javascript
// Endpoint para visualizar métricas (interno)
// GET /api/internal/paraphrasis/stats

router.get('/api/internal/paraphrasis/stats', protect, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getParaphrasStats({ startDate, endDate });
    
    // Agregar métricas adicionales
    const waiCorrelation = await analyzeWaiCorrelation(startDate, endDate);
    const retentionImpact = await analyzeRetentionImpact(startDate, endDate);
    
    res.json({
      paraphrasis: stats,
      wai: waiCorrelation,
      retention: retentionImpact,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Cronograma Estimado

| Fase | Duración | Entregables |
|------|----------|-------------|
| **Fase 1** | 3-5 días | Policy snippet, integración en prompt, tests unitarios, detección de contexto |
| **Fase 2** | 3-4 días | Detección de paráfrasis, métricas service, hardening, tests de validación |
| **Fase 3** | 2-3 días | Análisis WAI, dashboard métricas, documentación, iteración de prompts |
| **Total** | **8-12 días** | Feature completa en producción con métricas |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Aumento de latencia (paráfrasis alarga respuestas) | Media | Medio | Monitorear p95 latencia, optimizar prompt, limitar longitud paráfrasis |
| Falsos positivos en detección (parafrasear cuando no es necesario) | Alta | Bajo | Reglas de disparo conservadoras, cooldown, límite consecutivas |
| LLM no sigue instrucción de paráfrasis | Media | Alto | Tests golden con ejemplos, iteración de prompts, validación manual inicial |
| Usuario se frustra con paráfrasis excesiva | Baja | Alto | Cooldown, detectar "sí ya entendiste", máximo 3 consecutivas |
| No hay impacto medible en WAI | Media | Medio | A/B test, análisis cualitativo con usuarios beta |

---

## Dependencias

- ✅ **#98 (WAI post-sesión):** Ya implementado, permite medir impacto
- ✅ **Sistema de metadatos en Message:** Ya existe
- ✅ **Pipeline de snippets en openaiPromptBuilder:** Ya modular (usado en #63)
- ⚠️ **Feature flags (opcional):** Si queremos A/B test robusto
- ⚠️ **Dashboard interno (opcional):** Para visualizar métricas

---

## Criterios de Éxito

**MVP (Fase 1-2):**
- [x] Policy de paráfrasis inyectada en prompts según reglas
- [x] Detección de paráfrasis en respuestas
- [x] Métricas básicas registradas
- [x] Tests unitarios >80% coverage
- [x] Hardening de edge cases

**Éxito de producto (Fase 3):**
- [ ] Tasa de adherencia >70%
- [ ] Mejora en WAI "escuchado" >+0.3 puntos
- [ ] Reducción "no me entiendes" >20%
- [ ] Sin regresión en latencia p95 (<+100ms)
- [ ] Feedback cualitativo positivo de usuarios beta

---

## Próximos Pasos

1. **Revisión de plan** con equipo
2. **Crear branch** `cursor/paraphrasis-validation-d63c`
3. **Fase 1:** Implementar policy + detección
4. **Testing interno:** Validar con conversaciones reales
5. **Fase 2:** Métricas + hardening
6. **Beta limitada:** 10-20% usuarios
7. **Fase 3:** Análisis + iteración
8. **Rollout completo:** Si métricas son positivas

---

*Plan creado: 13 jul 2026*
*Propuesta: #55 - Paráfrasis + validación antes consejo*
*Estimación total: 8-12 días de desarrollo + 2-4 semanas de análisis*
