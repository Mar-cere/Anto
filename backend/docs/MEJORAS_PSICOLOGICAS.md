# Mejoras Psicológicas y Terapéuticas - Propuestas

Este documento contiene ideas para mejorar el flujo del sistema desde una perspectiva psicológica y terapéutica, basadas en principios de terapia cognitivo-conductual (TCC), terapia dialéctica conductual (DBT), terapia de aceptación y compromiso (ACT), y otras intervenciones basadas en evidencia.

---

## 🚨 1. RECURSOS DE EMERGENCIA Y PROTOCOLO DE CRISIS

**📊 Prioridad:** 🔴 **CRÍTICA** (Alta)  
**⚙️ Complejidad:** 🟡 **MEDIA** (Requiere creación de constantes, funciones de evaluación y integración en prompts)

### **Problema Actual:**
- Se detecta crisis pero no se proporcionan recursos específicos de emergencia
- No hay protocolo estructurado de intervención en crisis
- Falta información de líneas de ayuda 24/7

### **Mejoras Propuestas:**

#### A. Constantes de Recursos de Emergencia
```javascript
// backend/constants/crisis.js
export const CRISIS_RESOURCES = {
  // Líneas de emergencia por país
  EMERGENCY_LINES: {
    ARGENTINA: {
      SUICIDE_PREVENTION: '135',
      MENTAL_HEALTH: '0800-222-5462',
      EMERGENCY: '911'
    },
    MEXICO: {
      SUICIDE_PREVENTION: '800-273-8255',
      MENTAL_HEALTH: '800-911-2000',
      EMERGENCY: '911'
    },
    ESPANA: {
      SUICIDE_PREVENTION: '024',
      MENTAL_HEALTH: '024',
      EMERGENCY: '112'
    },
    GENERAL: {
      SUICIDE_PREVENTION: '988', // Línea internacional
      CRISIS_TEXT: '741741', // Texto de crisis
      EMERGENCY: '911'
    }
  },
  
  // Mensajes de crisis estructurados
  CRISIS_MESSAGES: {
    IMMEDIATE_SAFETY: 'Tu seguridad es lo más importante. Si estás en peligro inmediato, llama al {EMERGENCY} ahora.',
    SUICIDE_PREVENTION: 'No estás solo. Llama a la línea de prevención del suicidio: {SUICIDE_LINE}. Están disponibles 24/7.',
    MENTAL_HEALTH_SUPPORT: 'Para apoyo profesional inmediato, contacta: {MENTAL_HEALTH_LINE}',
    SAFETY_PLAN: '¿Tienes un plan de seguridad? Si no, podemos crear uno juntos ahora mismo.'
  },
  
  // Protocolo de intervención en crisis
  CRISIS_PROTOCOL: {
    STEPS: [
      '1. Validar la experiencia sin minimizar',
      '2. Evaluar nivel de riesgo (bajo, medio, alto)',
      '3. Proporcionar recursos de emergencia apropiados',
      '4. Crear sensación de seguridad y conexión',
      '5. Ofrecer seguimiento inmediato',
      '6. Documentar para seguimiento profesional'
    ],
    RISK_LEVELS: {
      LOW: 'Monitoreo y apoyo continuo',
      MEDIUM: 'Recursos de emergencia + seguimiento en 24h',
      HIGH: 'Recursos de emergencia inmediatos + alerta profesional'
    }
  }
};
```

#### B. Función de Evaluación de Riesgo
```javascript
// Evaluar nivel de riesgo suicida basado en múltiples factores
export const evaluateSuicideRisk = (emotionalAnalysis, contextualAnalysis, messageContent) => {
  let riskScore = 0;
  
  // Factores de riesgo
  if (contextualAnalysis.intencion?.tipo === 'CRISIS') riskScore += 3;
  if (emotionalAnalysis.intensity >= 9) riskScore += 2;
  if (emotionalAnalysis.mainEmotion === 'tristeza' && emotionalAnalysis.intensity >= 8) riskScore += 2;
  if (/suicid|morir|acabar.*vida|terminar.*todo/i.test(messageContent)) riskScore += 4;
  if (/plan|método|medios/i.test(messageContent)) riskScore += 3; // Plan específico
  if (/despedida|última.*vez|adiós/i.test(messageContent)) riskScore += 2;
  
  // Factores protectores (reducen riesgo)
  if (/ayuda|hablar|compartir/i.test(messageContent)) riskScore -= 1;
  if (emotionalAnalysis.secondary?.includes('esperanza')) riskScore -= 1;
  
  if (riskScore >= 7) return 'HIGH';
  if (riskScore >= 4) return 'MEDIUM';
  return 'LOW';
};
```

#### C. Integración en el Prompt
- Agregar recursos de emergencia automáticamente cuando se detecta crisis
- Incluir protocolo de seguridad en el prompt del sistema
- Priorizar estabilización sobre cualquier otra intervención

---

## 🧘 2. TÉCNICAS DE REGULACIÓN EMOCIONAL ESPECÍFICAS

**📊 Prioridad:** 🔴 **ALTA** (Mejora inmediata de efectividad)  
**⚙️ Complejidad:** 🟢 **BAJA** (Solo requiere crear constantes y estructuras de datos)

### **Problema Actual:**
- Las técnicas mencionadas son genéricas ("respiración", "grounding")
- No hay técnicas específicas por tipo de emoción
- Falta estructura paso a paso para técnicas

### **Mejoras Propuestas:**

#### A. Técnicas Específicas por Emoción
```javascript
// backend/constants/therapeuticTechniques.js
export const EMOTION_SPECIFIC_TECHNIQUES = {
  ansiedad: {
    immediate: [
      {
        name: 'Respiración 4-7-8',
        steps: [
          '1. Inhala por la nariz contando hasta 4',
          '2. Mantén la respiración contando hasta 7',
          '3. Exhala por la boca contando hasta 8',
          '4. Repite 3-4 veces'
        ],
        prompt: 'Vamos a hacer una respiración 4-7-8 juntos. ¿Estás listo?'
      },
      {
        name: 'Grounding 5-4-3-2-1',
        steps: [
          '5 cosas que puedes ver',
          '4 cosas que puedes tocar',
          '3 cosas que puedes oír',
          '2 cosas que puedes oler',
          '1 cosa que puedes saborear'
        ],
        prompt: 'Vamos a hacer un ejercicio de grounding. Nombra 5 cosas que puedes ver a tu alrededor.'
      },
      {
        name: 'Técnica STOP',
        steps: [
          'S: Stop (Detente)',
          'T: Toma distancia (observa tus pensamientos)',
          'O: Observa (qué está pasando en tu cuerpo)',
          'P: Procede (elige una acción consciente)'
        ]
      }
    ],
    longTerm: [
      'Identificación de triggers de ansiedad',
      'Técnicas de exposición gradual',
      'Reestructuración cognitiva de preocupaciones',
      'Mindfulness para ansiedad'
    ]
  },
  
  tristeza: {
    immediate: [
      {
        name: 'Validación y Acompañamiento',
        steps: [
          '1. Reconocer la tristeza sin juzgar',
          '2. Validar que es normal sentirse así',
          '3. Ofrecer presencia y acompañamiento',
          '4. Evitar soluciones inmediatas o minimizar'
        ]
      },
      {
        name: 'Actividades de Activación Conductual',
        steps: [
          '1. Identificar una actividad pequeña y alcanzable',
          '2. Comprometerse a hacerla (aunque no tengas ganas)',
          '3. Observar cómo te sientes después',
          '4. Celebrar el esfuerzo, no el resultado'
        ]
      }
    ],
    longTerm: [
      'Activación conductual estructurada',
      'Identificación de valores y actividades significativas',
      'Trabajo con pensamientos negativos',
      'Construcción de rutinas saludables'
    ]
  },
  
  enojo: {
    immediate: [
      {
        name: 'Técnica de Pausa',
        steps: [
          '1. Detente antes de reaccionar',
          '2. Respira profundamente 3 veces',
          '3. Identifica qué te está molestando específicamente',
          '4. Expresa tu necesidad de forma asertiva'
        ]
      },
      {
        name: 'Técnica de Tiempo Fuera',
        steps: [
          '1. Aléjate de la situación si es posible',
          '2. Usa ese tiempo para calmar tu cuerpo',
          '3. Identifica la emoción bajo el enojo (herida, miedo, frustración)',
          '4. Decide cómo responder de forma constructiva'
        ]
      }
    ],
    longTerm: [
      'Desarrollo de habilidades de comunicación asertiva',
      'Identificación de triggers de enojo',
      'Técnicas de resolución de conflictos',
      'Manejo de expectativas'
    ]
  },
  
  miedo: {
    immediate: [
      {
        name: 'Técnica de Seguridad',
        steps: [
          '1. Identifica que estás a salvo en este momento',
          '2. Nombra 3 cosas que te hacen sentir seguro',
          '3. Respira profundamente',
          '4. Recuerda que el miedo es una emoción, no un hecho'
        ]
      }
    ],
    longTerm: [
      'Exposición gradual a situaciones temidas',
      'Reestructuración de pensamientos catastróficos',
      'Desarrollo de autoeficacia',
      'Técnicas de relajación progresiva'
    ]
  }
};
```

#### B. Integración en Respuestas
- Cuando se detecta una emoción específica, sugerir técnicas inmediatas paso a paso
- Ofrecer técnicas a largo plazo según la fase terapéutica
- Personalizar técnicas según el estilo comunicativo del usuario

---

## 🎯 3. INTERVENCIONES BASADAS EN EVIDENCIA

**📊 Prioridad:** 🟡 **MEDIA** (Mejora calidad terapéutica a largo plazo)  
**⚙️ Complejidad:** 🟡 **MEDIA** (Requiere estructurar técnicas complejas y entrenamiento del modelo)

### **Problema Actual:**
- Las técnicas mencionadas son genéricas
- No hay intervenciones específicas de TCC, DBT, ACT, etc.
- Falta estructura terapéutica basada en evidencia

### **Mejoras Propuestas:**

#### A. Técnicas de TCC (Terapia Cognitivo-Conductual)
```javascript
export const CBT_TECHNIQUES = {
  // Reestructuración cognitiva
  cognitiveRestructuring: {
    steps: [
      '1. Identificar el pensamiento automático negativo',
      '2. Examinar la evidencia a favor y en contra',
      '3. Buscar explicaciones alternativas',
      '4. Generar un pensamiento más equilibrado',
      '5. Evaluar cómo te sientes con el nuevo pensamiento'
    ],
    prompts: [
      '¿Qué evidencia tienes de que ese pensamiento es cierto?',
      '¿Hay otra forma de ver esta situación?',
      '¿Qué le dirías a un amigo en esta situación?'
    ]
  },
  
  // Registro de pensamientos
  thoughtRecord: {
    structure: {
      situation: '¿Qué pasó?',
      emotion: '¿Cómo te sentiste?',
      thought: '¿Qué pensaste?',
      evidence: '¿Qué evidencia hay?',
      alternative: '¿Hay otra forma de verlo?',
      outcome: '¿Cómo te sientes ahora?'
    }
  },
  
  // Activación conductual
  behavioralActivation: {
    steps: [
      '1. Identificar actividades que solías disfrutar',
      '2. Empezar con actividades pequeñas y alcanzables',
      '3. Programar actividades en tu día',
      '4. Hacer la actividad aunque no tengas ganas',
      '5. Observar cómo te sientes después'
    ]
  }
};
```

#### B. Técnicas de DBT (Terapia Dialéctica Conductual)
```javascript
export const DBT_TECHNIQUES = {
  // Habilidades de Mindfulness
  mindfulness: {
    observe: 'Observa sin juzgar lo que está pasando',
    describe: 'Describe los hechos sin interpretar',
    participate: 'Participa completamente en el momento presente',
    nonJudgmental: 'Sé no juzgador con tus experiencias',
    oneMindful: 'Haz una cosa a la vez con atención plena',
    effective: 'Sé efectivo, no "tengas razón"'
  },
  
  // Tolerancia al malestar
  distressTolerance: {
    TIPP: {
      T: 'Temperature (Temperatura) - Agua fría en la cara',
      I: 'Intense exercise (Ejercicio intenso) - 20 minutos',
      P: 'Paced breathing (Respiración pausada) - 4-7-8',
      P: 'Paired muscle relaxation (Relajación muscular)'
    },
    ACCEPTS: {
      A: 'Activities (Actividades)',
      C: 'Contributing (Contribuir)',
      C: 'Comparisons (Comparaciones)',
      E: 'Emotions (Emociones opuestas)',
      P: 'Pushing away (Alejar temporalmente)',
      T: 'Thoughts (Pensamientos)',
      S: 'Sensations (Sensaciones)'
    }
  },
  
  // Regulación emocional
  emotionRegulation: {
    PLEASE: {
      P: 'Physical illness (Enfermedad física) - Trata enfermedades',
      L: 'Eating (Comer) - Come balanceado',
      E: 'Avoid drugs (Evita drogas)',
      A: 'Sleep (Sueño) - Duerme bien',
      S: 'Exercise (Ejercicio) - Haz ejercicio'
    }
  },
  
  // Efectividad interpersonal
  interpersonalEffectiveness: {
    DEARMAN: {
      D: 'Describe (Describe la situación)',
      E: 'Express (Expresa tus sentimientos)',
      A: 'Assert (Sé asertivo)',
      R: 'Reinforce (Refuerza)',
      M: 'Mindful (Mindful)',
      A: 'Appear confident (Parece confiado)',
      N: 'Negotiate (Negocia)'
    }
  }
};
```

#### C. Técnicas de ACT (Terapia de Aceptación y Compromiso)
```javascript
export const ACT_TECHNIQUES = {
  // Defusión cognitiva
  cognitiveDefusion: {
    techniques: [
      'Pensar "Estoy teniendo el pensamiento de que..."',
      'Nombrar el pensamiento: "Ahí está el pensamiento de..."',
      'Cantar el pensamiento',
      'Repetir el pensamiento hasta que pierda sentido'
    ]
  },
  
  // Aceptación
  acceptance: {
    steps: [
      '1. Observa la experiencia sin luchar contra ella',
      '2. Abre espacio para la experiencia',
      '3. Permite que esté ahí sin intentar cambiarla',
      '4. Continúa con lo que es importante para ti'
    ]
  },
  
  // Valores y compromiso
  valuesAndCommitment: {
    questions: [
      '¿Qué es realmente importante para ti?',
      '¿Cómo quieres ser recordado?',
      '¿Qué tipo de persona quieres ser?',
      '¿Qué acciones te acercan a tus valores?'
    ]
  }
};
```

---

## 🔄 4. DETECCIÓN DE RESISTENCIA AL CAMBIO

**📊 Prioridad:** 🔴 **ALTA** (Mejora significativamente la efectividad terapéutica)  
**⚙️ Complejidad:** 🟡 **MEDIA** (Requiere patrones de detección y lógica de intervención)

### **Problema Actual:**
- No se detecta cuando el usuario muestra resistencia
- No hay intervenciones específicas para manejar resistencia
- Falta detección de ambivalencia

### **Mejoras Propuestas:**

#### A. Patrones de Resistencia
```javascript
export const RESISTANCE_PATTERNS = {
  // Negación
  denial: [
    /(?:no.*tengo.*problema|no.*necesito.*ayuda|no.*me.*pasa.*nada|estoy.*bien|todo.*bien)/i,
    /(?:no.*es.*para.*tanto|exageras|no.*es.*tan.*grave)/i
  ],
  
  // Minimización
  minimization: [
    /(?:solo|nada.*más|solo.*un.*poco|no.*es.*nada)/i,
    /(?:otros.*tienen.*peor|no.*es.*tan.*malo)/i
  ],
  
  // Evitación
  avoidance: [
    /(?:no.*quiero.*hablar|prefiero.*no|mejor.*no|no.*me.*gusta.*hablar)/i,
    /(?:cambiar.*de.*tema|no.*quiero.*pensar)/i
  ],
  
  // Ambivalencia
  ambivalence: [
    /(?:no.*sé|tal.*vez|quizás|a.*veces.*sí.*a.*veces.*no)/i,
    /(?:quiero.*pero.*no.*puedo|me.*gustaría.*pero)/i
  ],
  
  // Desesperanza
  hopelessness: [
    /(?:nada.*funciona|ya.*lo.*intenté|no.*sirve.*de.*nada)/i,
    /(?:siempre.*será.*así|nunca.*cambiará)/i
  ]
};
```

#### B. Intervenciones para Resistencia
```javascript
export const RESISTANCE_INTERVENTIONS = {
  denial: {
    approach: 'Validar sin confrontar, explorar suavemente',
    techniques: ['Escala de importancia', 'Preguntas exploratorias', 'Normalización'],
    prompts: [
      'Entiendo que no sientes que sea un problema. ¿Qué te trajo aquí hoy?',
      'A veces es difícil reconocer cuando algo nos afecta. ¿Hay algo que te gustaría cambiar?'
    ]
  },
  
  ambivalence: {
    approach: 'Entrevista motivacional, explorar pros y contras',
    techniques: ['Escala de importancia', 'Exploración de valores', 'Reflexión'],
    prompts: [
      'Por un lado... y por otro lado... ¿Qué te gustaría que fuera diferente?',
      'En una escala del 1 al 10, ¿qué tan importante es para ti hacer un cambio?'
    ]
  },
  
  hopelessness: {
    approach: 'Validar la desesperanza, identificar excepciones, construir esperanza',
    techniques: ['Búsqueda de excepciones', 'Revisión de logros pasados', 'Pequeños pasos'],
    prompts: [
      'Entiendo que te sientes sin esperanza. ¿Ha habido momentos en que las cosas fueron un poco mejor?',
      'Aunque ahora sientas que nada funciona, ¿qué pequeña cosa podrías intentar diferente?'
    ]
  }
};
```

---

## 📈 5. PREVENCIÓN DE RECAÍDAS PROACTIVA

**📊 Prioridad:** 🔴 **ALTA** (Crítico para resultados a largo plazo)  
**⚙️ Complejidad:** 🟠 **ALTA** (Requiere sistema de seguimiento temporal, análisis de tendencias y lógica de detección)

### **Problema Actual:**
- No hay detección proactiva de señales de recaída
- Falta seguimiento después de mejoras
- No se identifican factores de riesgo de recaída

### **Mejoras Propuestas:**

#### A. Detección de Señales de Recaída
```javascript
export const RELAPSE_WARNING_SIGNS = {
  // Señales emocionales
  emotional: {
    patterns: [
      /(?:volví.*a.*sentirme.*mal|estoy.*peor|retrocedí|empeoré)/i,
      /(?:igual.*que.*antes|como.*siempre|nada.*cambió)/i
    ],
    indicators: [
      'Aumento de intensidad emocional negativa',
      'Retorno a emociones previas',
      'Pérdida de progreso emocional'
    ]
  },
  
  // Señales conductuales
  behavioral: {
    patterns: [
      /(?:volví.*a|empecé.*de.*nuevo|retomé)/i,
      /(?:no.*puedo.*mantener|no.*sirvo|fracasé)/i
    ],
    indicators: [
      'Retorno a conductas evitativas',
      'Abandono de actividades saludables',
      'Aislamiento social'
    ]
  },
  
  // Señales cognitivas
  cognitive: {
    patterns: [
      /(?:pensamientos.*negativos|no.*puedo|nunca.*podré)/i,
      /(?:soy.*un.*fracaso|no.*sirvo|nada.*funciona)/i
    ],
    indicators: [
      'Retorno de pensamientos negativos',
      'Pérdida de perspectiva',
      'Catastrofización'
    ]
  }
};
```

#### B. Intervenciones de Prevención de Recaídas
```javascript
export const RELAPSE_PREVENTION = {
  // Plan de prevención de recaídas
  relapsePreventionPlan: {
    steps: [
      '1. Identificar señales tempranas de advertencia',
      '2. Listar estrategias de afrontamiento que funcionan',
      '3. Identificar situaciones de alto riesgo',
      '4. Crear plan de acción para momentos difíciles',
      '5. Establecer red de apoyo',
      '6. Programar seguimiento regular'
    ]
  },
  
  // Intervenciones cuando se detecta recaída
  interventions: {
    normalize: 'Las recaídas son parte del proceso de cambio. No significa que hayas fallado.',
    reframe: 'Esta es una oportunidad para aprender qué funciona y qué no.',
    activate: '¿Qué estrategia que funcionó antes podrías usar ahora?',
    support: 'No estás solo en esto. Estoy aquí para apoyarte.'
  }
};
```

---

## 📚 6. PSICOEDUCACIÓN ESTRUCTURADA

**📊 Prioridad:** 🟡 **MEDIA** (Aumenta comprensión y empoderamiento del usuario)  
**⚙️ Complejidad:** 🟢 **BAJA** (Solo requiere estructurar información en constantes)

### **Problema Actual:**
- La psicoeducación es ad-hoc, no estructurada
- No hay módulos educativos por tema
- Falta información sobre condiciones de salud mental

### **Mejoras Propuestas:**

#### A. Módulos de Psicoeducación
```javascript
export const PSYCHOEDUCATION_MODULES = {
  // Ansiedad
  anxiety: {
    whatIs: 'La ansiedad es una respuesta natural del cuerpo al estrés. Se vuelve problemática cuando es excesiva o persistente.',
    symptoms: [
      'Físicos: palpitaciones, sudoración, tensión muscular',
      'Cognitivos: preocupación excesiva, pensamientos catastróficos',
      'Conductuales: evitación, inquietud'
    ],
    causes: [
      'Factores genéticos',
      'Experiencias traumáticas',
      'Estrés crónico',
      'Pensamientos negativos recurrentes'
    ],
    treatment: [
      'Terapia cognitivo-conductual (TCC)',
      'Técnicas de relajación',
      'Exposición gradual',
      'Medicación (si es necesario)'
    ]
  },
  
  // Depresión
  depression: {
    whatIs: 'La depresión es más que tristeza. Es un trastorno del estado de ánimo que afecta cómo piensas, sientes y actúas.',
    symptoms: [
      'Estado de ánimo bajo persistente',
      'Pérdida de interés o placer',
      'Cambios en el sueño o apetito',
      'Fatiga o pérdida de energía',
      'Sentimientos de inutilidad o culpa',
      'Dificultad para concentrarse'
    ],
    causes: [
      'Factores biológicos (química cerebral)',
      'Factores genéticos',
      'Eventos de vida estresantes',
      'Pensamientos negativos',
      'Aislamiento social'
    ],
    treatment: [
      'Terapia (TCC, terapia interpersonal)',
      'Activación conductual',
      'Medicación antidepresiva',
      'Ejercicio regular',
      'Apoyo social'
    ]
  },
  
  // Regulación emocional
  emotionRegulation: {
    whatIs: 'La regulación emocional es la capacidad de manejar y responder a las emociones de forma saludable.',
    skills: [
      'Identificar y nombrar emociones',
      'Entender la función de las emociones',
      'Reducir vulnerabilidad emocional',
      'Aumentar emociones positivas',
      'Aceptar emociones difíciles'
    ],
    techniques: [
      'Mindfulness',
      'Respiración profunda',
      'Reestructuración cognitiva',
      'Activación conductual',
      'Tolerancia al malestar'
    ]
  }
};
```

#### B. Integración en Respuestas
- Ofrecer psicoeducación cuando el usuario pregunta sobre su condición
- Proporcionar información en la fase de "aprendizaje"
- Personalizar según el nivel de conocimiento del usuario

---

## 🎯 7. VALIDACIÓN DE PROGRESO TERAPÉUTICO

**📊 Prioridad:** 🟡 **MEDIA** (Mejora motivación y adherencia al tratamiento)  
**⚙️ Complejidad:** 🟡 **MEDIA** (Requiere comparación de estados históricos y lógica de detección de mejoras)

### **Problema Actual:**
- No hay validación explícita de progreso
- Falta reconocimiento de logros
- No se miden mejoras de forma estructurada

### **Mejoras Propuestas:**

#### A. Métricas de Progreso
```javascript
export const PROGRESS_METRICS = {
  // Indicadores de progreso
  indicators: {
    emotional: [
      'Reducción de intensidad emocional negativa',
      'Aumento de emociones positivas',
      'Mayor estabilidad emocional',
      'Mejor regulación emocional'
    ],
    cognitive: [
      'Reducción de pensamientos negativos',
      'Mayor flexibilidad cognitiva',
      'Mejor resolución de problemas',
      'Pensamientos más equilibrados'
    ],
    behavioral: [
      'Aumento de actividades saludables',
      'Reducción de conductas evitativas',
      'Mejor afrontamiento',
      'Mayor participación social'
    ]
  },
  
  // Preguntas de seguimiento
  followUpQuestions: [
    '¿Cómo te sientes comparado con hace una semana?',
    '¿Qué has notado que ha mejorado?',
    '¿Qué estrategias te han funcionado mejor?',
    '¿Qué desafíos sigues enfrentando?'
  ],
  
  // Celebración de logros
  celebration: {
    small: 'Cada paso cuenta. Celebra este pequeño logro.',
    medium: 'Has hecho un progreso significativo. ¡Felicidades!',
    large: 'Has logrado un cambio importante. Esto demuestra tu capacidad de crecimiento.'
  }
};
```

#### B. Detección Automática de Progreso
- Comparar estado emocional actual con histórico
- Identificar mejoras en patrones de pensamiento
- Reconocer aumento en uso de estrategias de afrontamiento

---

## 🔍 8. DETECCIÓN DE NECESIDADES NO EXPRESADAS

**📊 Prioridad:** 🟡 **MEDIA** (Mejora comprensión profunda del usuario)  
**⚙️ Complejidad:** 🟡 **MEDIA** (Requiere patrones de detección y lógica de exploración)

### **Problema Actual:**
- Solo se responde a lo que el usuario dice explícitamente
- No se detectan necesidades implícitas
- Falta exploración de necesidades subyacentes

### **Mejoras Propuestas:**

#### A. Patrones de Necesidades Implícitas
```javascript
export const IMPLICIT_NEEDS_PATTERNS = {
  // Necesidad de validación
  validation: [
    /(?:nadie.*entiende|no.*me.*comprenden|me.*siento.*solo)/i,
    /(?:nadie.*me.*escucha|no.*tengo.*con.*quién.*hablar)/i
  ],
  
  // Necesidad de control
  control: [
    /(?:no.*puedo.*controlar|siento.*que.*no.*tengo.*control)/i,
    /(?:todo.*está.*fuera.*de.*control|no.*puedo.*manejar)/i
  ],
  
  // Necesidad de conexión
  connection: [
    /(?:me.*siento.*solo|aislado|desconectado)/i,
    /(?:no.*tengo.*a.*nadie|me.*siento.*abandonado)/i
  ],
  
  // Necesidad de propósito
  purpose: [
    /(?:no.*tengo.*sentido|para.*qué.*sirvo|no.*tengo.*propósito)/i,
    /(?:mi.*vida.*no.*tiene.*sentido|no.*sé.*para.*qué.*estoy)/i
  ],
  
  // Necesidad de seguridad
  safety: [
    /(?:no.*me.*siento.*seguro|tengo.*miedo|me.*siento.*vulnerable)/i,
    /(?:no.*puedo.*confiar|me.*siento.*amenazado)/i
  ]
};
```

#### B. Intervenciones para Necesidades Implícitas
- Explorar necesidades subyacentes con preguntas abiertas
- Validar necesidades no expresadas
- Ofrecer recursos específicos para cada necesidad

---

## 💪 9. FORTALEZAS Y RECURSOS DEL USUARIO

**📊 Prioridad:** 🟢 **BAJA** (Enfoque positivo, mejora incremental)  
**⚙️ Complejidad:** 🟢 **BAJA** (Solo requiere estructurar información y preguntas)

### **Problema Actual:**
- Se enfoca en problemas, no en fortalezas
- No se identifican recursos del usuario
- Falta enfoque en resiliencia

### **Mejoras Propuestas:**

#### A. Identificación de Fortalezas
```javascript
export const STRENGTHS_IDENTIFICATION = {
  // Fortalezas personales
  personal: [
    'Resiliencia: capacidad de recuperarse de dificultades',
    'Perseverancia: seguir adelante a pesar de obstáculos',
    'Autocuidado: buscar ayuda cuando la necesitas',
    'Reflexión: capacidad de pensar sobre tus experiencias',
    'Empatía: capacidad de entender a otros'
  ],
  
  // Recursos sociales
  social: [
    'Red de apoyo: familia, amigos, comunidad',
    'Relaciones significativas',
    'Grupos de apoyo',
    'Comunidades en línea'
  ],
  
  // Recursos internos
  internal: [
    'Habilidades de afrontamiento previas',
    'Experiencias pasadas de superación',
    'Valores y creencias que guían',
    'Intereses y pasatiempos',
    'Logros y éxitos pasados'
  ],
  
  // Preguntas para identificar fortalezas
  questions: [
    '¿Qué has hecho en el pasado que te ayudó a superar dificultades?',
    '¿Qué cualidades tuyas te han ayudado en momentos difíciles?',
    '¿Quién o qué te ha apoyado en el pasado?',
    '¿Qué logros te enorgullecen?'
  ]
};
```

#### B. Integración en Respuestas
- Reconocer fortalezas cuando el usuario las menciona
- Usar fortalezas como base para intervenciones
- Construir sobre recursos existentes

---

## 🎓 10. INTERVENCIONES DE AUTOEFICACIA

**📊 Prioridad:** 🟢 **BAJA** (Construcción de confianza, mejora incremental)  
**⚙️ Complejidad:** 🟢 **BAJA** (Solo requiere estructurar intervenciones y preguntas)

### **Problema Actual:**
- No se trabaja explícitamente la autoeficacia
- Falta construcción de confianza en las propias capacidades
- No se celebran pequeños logros

### **Mejoras Propuestas:**

#### A. Construcción de Autoeficacia
```javascript
export const SELF_EFFICACY_INTERVENTIONS = {
  // Fuentes de autoeficacia (Bandura)
  sources: {
    mastery: 'Experiencias de éxito pasadas',
    vicarious: 'Ver a otros similares tener éxito',
    verbal: 'Persuasión y aliento de otros',
    emotional: 'Estado emocional positivo'
  },
  
  // Intervenciones
  interventions: {
    smallSteps: 'Empezar con pasos pequeños y alcanzables',
    celebrate: 'Celebrar cada logro, por pequeño que sea',
    reframe: 'Reencuadrar "fracasos" como oportunidades de aprendizaje',
    remind: 'Recordar logros pasados cuando se siente difícil',
    support: 'Ofrecer apoyo y aliento en el proceso'
  },
  
  // Preguntas de autoeficacia
  questions: [
    'En una escala del 1 al 10, ¿qué tan capaz te sientes de hacer X?',
    '¿Qué te ayudaría a sentirte más capaz?',
    '¿Qué has logrado antes que te demuestra que puedes hacer esto?',
    '¿Qué pequeño paso podrías dar hoy?'
  ]
};
```

---

## 🔗 11. DETECCIÓN Y FORTALECIMIENTO DE APOYO SOCIAL

**📊 Prioridad:** 🟢 **BAJA** (Evaluación social, mejora incremental)  
**⚙️ Complejidad:** 🟡 **MEDIA** (Requiere evaluación estructurada y lógica de intervención)

### **Problema Actual:**
- No se evalúa el apoyo social del usuario
- No se fortalece la red de apoyo
- Falta detección de aislamiento social

### **Mejoras Propuestas:**

#### A. Evaluación de Apoyo Social
```javascript
export const SOCIAL_SUPPORT_ASSESSMENT = {
  // Dimensiones de apoyo social
  dimensions: {
    emotional: 'Apoyo emocional (escucha, comprensión, validación)',
    instrumental: 'Apoyo práctico (ayuda con tareas, recursos)',
    informational: 'Apoyo informativo (consejos, información)',
    companionship: 'Compañía (actividades juntos, tiempo compartido)'
  },
  
  // Preguntas de evaluación
  questions: [
    '¿Tienes personas en tu vida con las que puedes hablar sobre tus sentimientos?',
    '¿Hay alguien que te apoye cuando pasas por momentos difíciles?',
    '¿Tienes personas con las que puedes hacer actividades que disfrutas?',
    '¿Te sientes solo/a a menudo?'
  ],
  
  // Intervenciones según nivel de apoyo
  interventions: {
    high: 'Reconocer y fortalecer la red de apoyo existente',
    medium: 'Identificar oportunidades para fortalecer conexiones',
    low: 'Explorar formas de construir nuevas conexiones, grupos de apoyo, actividades sociales'
  }
};
```

---

## 🧠 12. TÉCNICAS DE MINDFULNESS Y GROUNDING ESPECÍFICAS

**📊 Prioridad:** 🟢 **BAJA** (Ampliación de herramientas, mejora incremental)  
**⚙️ Complejidad:** 🟢 **BAJA** (Solo requiere estructurar técnicas en constantes)

### **Problema Actual:**
- Las técnicas de mindfulness son genéricas
- Falta variedad de técnicas de grounding
- No hay técnicas específicas por situación

### **Mejoras Propuestas:**

#### A. Técnicas de Mindfulness Estructuradas
```javascript
export const MINDFULNESS_TECHNIQUES = {
  // Para ansiedad
  anxiety: {
    bodyScan: 'Escanea tu cuerpo de pies a cabeza, notando sensaciones sin juzgar',
    breathAwareness: 'Observa tu respiración sin intentar cambiarla',
    presentMoment: 'Enfócate en 3 cosas que puedes percibir en este momento'
  },
  
  // Para tristeza
  sadness: {
    lovingKindness: 'Envíate compasión a ti mismo: "Que esté libre de sufrimiento"',
    selfCompassion: 'Trátate como tratarías a un amigo querido',
    acceptance: 'Permite que la tristeza esté ahí sin luchar contra ella'
  },
  
  // Para enojo
  anger: {
    pause: 'Haz una pausa antes de reaccionar',
    observe: 'Observa el enojo en tu cuerpo sin actuar',
    space: 'Crea espacio entre el enojo y tu respuesta'
  }
};
```

#### B. Técnicas de Grounding Avanzadas
```javascript
export const GROUNDING_TECHNIQUES = {
  // Grounding sensorial
  sensory: {
    fiveSenses: '5 cosas que ves, 4 que tocas, 3 que oyes, 2 que hueles, 1 que saboreas',
    temperature: 'Alterna agua fría y caliente en tus manos',
    texture: 'Toca diferentes texturas y describe cada una'
  },
  
  // Grounding mental
  mental: {
    categories: 'Nombra 5 cosas en una categoría (colores, países, animales)',
    math: 'Cuenta hacia atrás de 100 en 7',
    describe: 'Describe en detalle un objeto que tienes cerca'
  },
  
  // Grounding emocional
  emotional: {
    name: 'Nombra la emoción sin juzgarla',
    locate: '¿Dónde sientes esta emoción en tu cuerpo?',
    intensity: 'En una escala del 1 al 10, ¿qué tan intensa es?'
  }
};
```

---

## 📊 13. SEGUIMIENTO PROACTIVO

**📊 Prioridad:** 🟡 **MEDIA** (Mejora continuidad y adherencia)  
**⚙️ Complejidad:** 🟠 **ALTA** (Requiere sistema de programación de tareas, base de datos de seguimientos y lógica temporal)

### **Problema Actual:**
- El seguimiento es reactivo (solo cuando el usuario escribe)
- No hay check-ins proactivos
- Falta seguimiento después de crisis

### **Mejoras Propuestas:**

#### A. Sistema de Check-ins Proactivos
```javascript
export const PROACTIVE_FOLLOW_UP = {
  // Triggers para check-ins
  triggers: {
    afterCrisis: {
      timing: '24 horas después de una crisis',
      message: 'Hola, quería saber cómo estás hoy. ¿Cómo te sientes después de nuestra conversación de ayer?'
    },
    afterImprovement: {
      timing: '3 días después de una mejora emocional',
      message: 'Me alegra que hayas estado mejor. ¿Cómo ha ido? ¿Hay algo en lo que pueda ayudarte?'
    },
    afterSetback: {
      timing: '2 días después de un retroceso',
      message: 'Noté que las cosas fueron difíciles. ¿Cómo estás hoy? Estoy aquí para apoyarte.'
    },
    weekly: {
      timing: 'Una vez por semana si hay inactividad',
      message: 'Hola, hace tiempo que no hablamos. ¿Cómo has estado? Estoy aquí cuando me necesites.'
    }
  },
  
  // Mensajes de seguimiento
  messages: {
    checkIn: '¿Cómo has estado desde nuestra última conversación?',
    support: 'Estoy aquí para ti. ¿Hay algo en lo que pueda ayudarte?',
    progress: '¿Has notado algún cambio desde que empezamos a trabajar juntos?',
    resources: '¿Te gustaría que te recuerde algunas técnicas que funcionaron antes?'
  }
};
```

---

## 🎨 14. PERSONALIZACIÓN BASADA EN ESTILO DE APRENDIZAJE

**📊 Prioridad:** 🟢 **BAJA** (Optimización, mejora incremental)  
**⚙️ Complejidad:** 🟡 **MEDIA** (Requiere detección de estilo, almacenamiento en perfil y adaptación de respuestas)

### **Problema Actual:**
- No se considera el estilo de aprendizaje del usuario
- Las técnicas se presentan de la misma forma para todos
- Falta adaptación a preferencias de aprendizaje

### **Mejoras Propuestas:**

#### A. Estilos de Aprendizaje
```javascript
export const LEARNING_STYLES = {
  visual: {
    techniques: [
      'Usar imágenes mentales',
      'Visualizar el proceso paso a paso',
      'Crear mapas mentales',
      'Usar metáforas visuales'
    ],
    prompts: [
      'Imagina cómo sería...',
      'Visualiza el proceso de...',
      'Crea una imagen mental de...'
    ]
  },
  
  auditory: {
    techniques: [
      'Hablar a través del proceso',
      'Usar afirmaciones verbales',
      'Repetir instrucciones en voz alta',
      'Usar música o sonidos'
    ],
    prompts: [
      'Dime en voz alta...',
      'Repite después de mí...',
      'Escucha cómo suena...'
    ]
  },
  
  kinesthetic: {
    techniques: [
      'Movimiento físico',
      'Técnicas de respiración con movimiento',
      'Ejercicios prácticos',
      'Actividades hands-on'
    ],
    prompts: [
      'Hagamos esto juntos paso a paso',
      'Pruébalo ahora mismo',
      'Siente cómo...'
    ]
  }
};
```

---

## 🔄 15. DETECCIÓN DE PATRONES DISFUNCIONALES PROFUNDA

**📊 Prioridad:** 🟢 **BAJA** (Análisis profundo, mejora incremental)  
**⚙️ Complejidad:** 🟠 **ALTA** (Requiere análisis complejo de lenguaje, detección de esquemas y lógica terapéutica avanzada)

### **Problema Actual:**
- Se detectan algunos patrones cognitivos pero de forma básica
- No hay detección de esquemas cognitivos
- Falta identificación de creencias nucleares

### **Mejoras Propuestas:**

#### A. Esquemas Cognitivos Comunes
```javascript
export const COGNITIVE_SCHEMAS = {
  // Esquemas de desconexión y rechazo
  disconnection: {
    abandonment: 'Miedo al abandono, creencia de que las personas te dejarán',
    mistrust: 'Desconfianza, creencia de que otros te harán daño',
    emotionalDeprivation: 'Creencias de que tus necesidades emocionales no serán satisfechas',
    defectiveness: 'Creencias de que eres defectuoso o no vales',
    socialIsolation: 'Creencias de que estás aislado del mundo'
  },
  
  // Esquemas de autonomía deteriorada
  impairedAutonomy: {
    dependence: 'Creencias de que no puedes funcionar sin otros',
    vulnerability: 'Miedo excesivo a que ocurra una catástrofe',
    enmeshment: 'Fusión excesiva con otros, falta de identidad propia',
    failure: 'Creencias de que eres un fracaso'
  },
  
  // Esquemas de límites deteriorados
  impairedLimits: {
    entitlement: 'Creencias de superioridad, derechos especiales',
    insufficientSelfControl: 'Dificultad para controlar impulsos y emociones'
  },
  
  // Esquemas de orientación hacia otros
  otherDirectedness: {
    subjugation: 'Sacrificar tus necesidades por las de otros',
    selfSacrifice: 'Enfocarse excesivamente en satisfacer necesidades de otros',
    approvalSeeking: 'Búsqueda excesiva de aprobación'
  },
  
  // Esquemas de hipervigilancia e inhibición
  overvigilance: {
    negativity: 'Enfoque excesivo en aspectos negativos',
    emotionalInhibition: 'Inhibición excesiva de emociones',
    unrelentingStandards: 'Estándares excesivamente altos',
    punitiveness: 'Creencias de que los errores merecen castigo'
  }
};
```

#### B. Intervenciones para Esquemas
- Identificar esquemas cuando aparecen en el lenguaje
- Trabajar con esquemas según la fase terapéutica
- Usar técnicas de reestructuración de esquemas

---

## 📝 RESUMEN DE PRIORIDADES Y COMPLEJIDAD

### **🔴 Prioridad CRÍTICA / ALTA:**

| # | Mejora | Prioridad | Complejidad | ROI |
|---|--------|-----------|-------------|-----|
| 1 | **Recursos de emergencia y protocolo de crisis** | 🔴 CRÍTICA | 🟡 MEDIA | ⭐⭐⭐⭐⭐ |
| 2 | **Técnicas de regulación emocional específicas** | 🔴 ALTA | 🟢 BAJA | ⭐⭐⭐⭐⭐ |
| 4 | **Detección de resistencia al cambio** | 🔴 ALTA | 🟡 MEDIA | ⭐⭐⭐⭐ |
| 5 | **Prevención de recaídas proactiva** | 🔴 ALTA | 🟠 ALTA | ⭐⭐⭐⭐ |

### **🟡 Prioridad MEDIA:**

| # | Mejora | Prioridad | Complejidad | ROI |
|---|--------|-----------|-------------|-----|
| 3 | **Intervenciones basadas en evidencia (TCC, DBT, ACT)** | 🟡 MEDIA | 🟡 MEDIA | ⭐⭐⭐⭐ |
| 6 | **Psicoeducación estructurada** | 🟡 MEDIA | 🟢 BAJA | ⭐⭐⭐ |
| 7 | **Validación de progreso terapéutico** | 🟡 MEDIA | 🟡 MEDIA | ⭐⭐⭐ |
| 8 | **Detección de necesidades no expresadas** | 🟡 MEDIA | 🟡 MEDIA | ⭐⭐⭐ |
| 13 | **Seguimiento proactivo** | 🟡 MEDIA | 🟠 ALTA | ⭐⭐⭐ |

### **🟢 Prioridad BAJA (Mejoras Incrementales):**

| # | Mejora | Prioridad | Complejidad | ROI |
|---|--------|-----------|-------------|-----|
| 9 | **Fortalezas y recursos del usuario** | 🟢 BAJA | 🟢 BAJA | ⭐⭐ |
| 10 | **Intervenciones de autoeficacia** | 🟢 BAJA | 🟢 BAJA | ⭐⭐ |
| 11 | **Detección de apoyo social** | 🟢 BAJA | 🟡 MEDIA | ⭐⭐ |
| 12 | **Técnicas de mindfulness específicas** | 🟢 BAJA | 🟢 BAJA | ⭐⭐ |
| 14 | **Personalización por estilo de aprendizaje** | 🟢 BAJA | 🟡 MEDIA | ⭐⭐ |
| 15 | **Detección de esquemas cognitivos** | 🟢 BAJA | 🟠 ALTA | ⭐⭐ |

---

## 🎯 MATRIZ DE DECISIÓN

### **Implementar PRIMERO (Alto ROI, Baja/Media Complejidad):**
1. ✅ **Técnicas de regulación emocional específicas** (🔴 ALTA, 🟢 BAJA) - **MEJOR OPCIÓN**
2. ✅ **Psicoeducación estructurada** (🟡 MEDIA, 🟢 BAJA) - **FÁCIL Y ÚTIL**
3. ✅ **Recursos de emergencia y protocolo de crisis** (🔴 CRÍTICA, 🟡 MEDIA) - **CRÍTICO**

### **Implementar SEGUNDO (Alto ROI, Media Complejidad):**
4. ✅ **Detección de resistencia al cambio** (🔴 ALTA, 🟡 MEDIA)
5. ✅ **Intervenciones basadas en evidencia** (🟡 MEDIA, 🟡 MEDIA)
6. ✅ **Validación de progreso terapéutico** (🟡 MEDIA, 🟡 MEDIA)
7. ✅ **Detección de necesidades no expresadas** (🟡 MEDIA, 🟡 MEDIA)

### **Implementar TERCERO (Alto ROI, Alta Complejidad):**
8. ✅ **Prevención de recaídas proactiva** (🔴 ALTA, 🟠 ALTA)
9. ✅ **Seguimiento proactivo** (🟡 MEDIA, 🟠 ALTA)

### **Implementar DESPUÉS (Bajo ROI, Baja Complejidad - Quick Wins):**
10. ✅ **Fortalezas y recursos del usuario** (🟢 BAJA, 🟢 BAJA)
11. ✅ **Intervenciones de autoeficacia** (🟢 BAJA, 🟢 BAJA)
12. ✅ **Técnicas de mindfulness específicas** (🟢 BAJA, 🟢 BAJA)

### **Implementar ÚLTIMO (Bajo ROI, Alta Complejidad):**
13. ✅ **Detección de esquemas cognitivos** (🟢 BAJA, 🟠 ALTA)
14. ✅ **Personalización por estilo de aprendizaje** (🟢 BAJA, 🟡 MEDIA)
15. ✅ **Detección de apoyo social** (🟢 BAJA, 🟡 MEDIA)

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

1. **Crear archivo de constantes de crisis** (`backend/constants/crisis.js`)
2. **Agregar técnicas terapéuticas específicas** (`backend/constants/therapeuticTechniques.js`)
3. **Implementar evaluación de riesgo suicida** en `emotionalAnalyzer` o nuevo servicio
4. **Integrar recursos de emergencia** en respuestas de crisis
5. **Agregar detección de resistencia** en `contextAnalyzer`
6. **Implementar seguimiento proactivo** (sistema de notificaciones/check-ins)
7. **Crear módulos de psicoeducación** estructurados
8. **Agregar validación de progreso** en `memoryService` o nuevo servicio

