/**
 * Constantes de Técnicas Terapéuticas
 * 
 * Este archivo centraliza técnicas estructuradas basadas en evidencia:
 * - TCC (Terapia Cognitivo-Conductual)
 * - DBT (Terapia Dialéctica Conductual)
 * - ACT (Terapia de Aceptación y Compromiso)
 * 
 * Organizadas por emoción y tipo (inmediatas vs. a largo plazo)
 */

// ========== TÉCNICAS INMEDIATAS POR EMOCIÓN ==========
// Técnicas que se pueden aplicar en el momento para regular emociones intensas

export const IMMEDIATE_TECHNIQUES = {
  tristeza: [
    {
      name: 'Activación Conductual Rápida',
      type: 'CBT',
      steps: [
        'Identifica una actividad pequeña y alcanzable (ej: caminar 5 minutos, escuchar una canción)',
        'Comprométete a hacerla aunque no tengas ganas',
        'Observa cómo te sientes durante y después de la actividad',
        'Celebra el esfuerzo, no el resultado'
      ],
      description: 'La actividad física, aunque sea mínima, puede ayudar a romper el ciclo de la tristeza.',
      whenToUse: 'Cuando la tristeza te paraliza y no tienes ganas de hacer nada.'
    },
    {
      name: 'Validación Emocional',
      type: 'DBT',
      steps: [
        'Reconoce que tu tristeza es válida y tiene sentido',
        'No juzgues tus sentimientos como "malos" o "incorrectos"',
        'Permítete sentir la tristeza sin intentar eliminarla inmediatamente',
        'Recuerda que las emociones son temporales'
      ],
      description: 'Validar tus emociones reduce la lucha interna y permite un procesamiento más saludable.',
      whenToUse: 'Cuando te sientes juzgado por estar triste o intentas reprimir tus sentimientos.'
    },
    {
      name: 'Respiración Consciente',
      type: 'DBT',
      steps: [
        'Inhala lentamente por la nariz contando hasta 4',
        'Mantén la respiración contando hasta 4',
        'Exhala lentamente por la boca contando hasta 6',
        'Repite 5-10 veces, enfocándote solo en la respiración'
      ],
      description: 'La respiración consciente activa el sistema nervioso parasimpático, ayudando a calmar el cuerpo.',
      whenToUse: 'Cuando la tristeza viene acompañada de tensión física o sensación de opresión.'
    }
  ],

  ansiedad: [
    {
      name: 'Grounding 5-4-3-2-1',
      type: 'DBT',
      steps: [
        'Identifica 5 cosas que puedes VER a tu alrededor',
        'Identifica 4 cosas que puedes TOCAR',
        'Identifica 3 cosas que puedes OÍR',
        'Identifica 2 cosas que puedes OLER',
        'Identifica 1 cosa que puedes SABOREAR'
      ],
      description: 'Esta técnica te ayuda a conectarte con el presente y reducir la ansiedad sobre el futuro.',
      whenToUse: 'Cuando la ansiedad te hace sentir desconectado o abrumado por pensamientos acelerados.'
    },
    {
      name: 'Reestructuración Cognitiva Rápida',
      type: 'CBT',
      steps: [
        'Identifica el pensamiento ansioso específico',
        'Pregúntate: "¿Qué evidencia tengo de que esto es cierto?"',
        'Considera: "¿Qué es lo peor que podría pasar? ¿Y lo más probable?"',
        'Reformula el pensamiento de manera más realista y equilibrada'
      ],
      description: 'Los pensamientos ansiosos suelen ser distorsionados. Esta técnica ayuda a verlos con más claridad.',
      whenToUse: 'Cuando tienes pensamientos catastróficos o preocupaciones excesivas.'
    },
    {
      name: 'Técnica de Aceptación',
      type: 'ACT',
      steps: [
        'Reconoce la ansiedad sin intentar eliminarla',
        'Dile a ti mismo: "Estoy sintiendo ansiedad, y está bien"',
        'Observa la ansiedad como una ola que sube y baja',
        'Continúa con lo que necesitas hacer, llevando la ansiedad contigo'
      ],
      description: 'Aceptar la ansiedad en lugar de luchar contra ella reduce su intensidad.',
      whenToUse: 'Cuando intentar controlar la ansiedad la empeora o te paraliza.'
    }
  ],

  enojo: [
    {
      name: 'Tiempo Fuera Consciente',
      type: 'DBT',
      steps: [
        'Reconoce que estás enojado y necesitas un momento',
        'Retírate físicamente de la situación si es posible',
        'Usa 5-10 minutos para respirar profundamente',
        'Cuando te sientas más calmado, decide cómo responder'
      ],
      description: 'Tomar un tiempo fuera previene reacciones impulsivas y permite respuestas más efectivas.',
      whenToUse: 'Cuando sientes que vas a explotar o decir algo de lo que te arrepentirás.'
    },
    {
      name: 'Expresión Segura del Enojo',
      type: 'CBT',
      steps: [
        'Identifica qué te hizo enojar específicamente',
        'Expresa tus sentimientos usando "Yo siento..." en lugar de "Tú hiciste..."',
        'Describe el comportamiento que te molestó sin atacar a la persona',
        'Pide lo que necesitas de manera clara y respetuosa'
      ],
      description: 'Expresar el enojo de manera asertiva es más efectivo que reprimirlo o explotar.',
      whenToUse: 'Cuando necesitas comunicar que algo te molestó sin dañar relaciones.'
    },
    {
      name: 'Ejercicio Físico Rápido',
      type: 'CBT',
      steps: [
        'Realiza actividad física intensa por 5-10 minutos',
        'Puede ser: saltar, correr en el lugar, hacer flexiones, o caminar rápido',
        'Enfócate en la sensación física del movimiento',
        'Observa cómo cambia tu nivel de energía después'
      ],
      description: 'El ejercicio físico ayuda a liberar la energía acumulada del enojo de manera saludable.',
      whenToUse: 'Cuando el enojo viene con mucha energía física y tensión muscular.'
    }
  ],

  miedo: [
    {
      name: 'Exposición Gradual',
      type: 'CBT',
      steps: [
        'Identifica qué te da miedo específicamente',
        'Crea una lista de pasos pequeños hacia enfrentar ese miedo',
        'Comienza con el paso más pequeño y manejable',
        'Celebra cada pequeño avance, sin importar qué tan pequeño sea'
      ],
      description: 'Enfrentar los miedos gradualmente reduce su poder sobre ti.',
      whenToUse: 'Cuando el miedo te está limitando y evitando cosas importantes.'
    },
    {
      name: 'Validación del Miedo',
      type: 'DBT',
      steps: [
        'Reconoce que el miedo es una emoción protectora',
        'Agradece a tu mente por intentar protegerte',
        'Evalúa si el miedo es proporcional a la situación real',
        'Decide si necesitas escuchar el miedo o avanzar a pesar de él'
      ],
      description: 'Validar el miedo reduce la lucha interna y permite decisiones más claras.',
      whenToUse: 'Cuando el miedo te paraliza o te hace sentir débil por tenerlo.'
    },
    {
      name: 'Respiración de Calma',
      type: 'DBT',
      steps: [
        'Siéntate o acuéstate en un lugar cómodo',
        'Coloca una mano en tu pecho y otra en tu abdomen',
        'Respira profundamente, sintiendo cómo se expande tu abdomen',
        'Exhala lentamente, sintiendo cómo se relaja tu cuerpo',
        'Repite durante 5-10 minutos'
      ],
      description: 'La respiración profunda activa la respuesta de relajación del cuerpo.',
      whenToUse: 'Cuando el miedo viene con síntomas físicos como palpitaciones o tensión.'
    }
  ],

  verguenza: [
    {
      name: 'Autocompasión',
      type: 'ACT',
      steps: [
        'Reconoce que todos cometemos errores y tenemos momentos difíciles',
        'Trátate como tratarías a un buen amigo en la misma situación',
        'Recuerda que la vergüenza es una emoción humana común',
        'Practica el perdón hacia ti mismo'
      ],
      description: 'La autocompasión reduce la vergüenza y promueve la curación.',
      whenToUse: 'Cuando te sientes juzgándote severamente o sintiendo que no eres suficiente.'
    },
    {
      name: 'Recontextualización',
      type: 'CBT',
      steps: [
        'Identifica la situación que te causa vergüenza',
        'Pregúntate: "¿Qué le diría a un amigo en esta situación?"',
        'Considera: "¿Esto realmente define quién soy como persona?"',
        'Reconoce que un error o momento difícil no te define completamente'
      ],
      description: 'Recontextualizar ayuda a ver la situación con más perspectiva y menos juicio.',
      whenToUse: 'Cuando la vergüenza te hace sentir que eres fundamentalmente defectuoso.'
    }
  ],

  culpa: [
    {
      name: 'Análisis de Responsabilidad',
      type: 'CBT',
      steps: [
        'Identifica qué acción específica te causa culpa',
        'Evalúa tu nivel real de responsabilidad (0-100%)',
        'Considera otros factores que influyeron en la situación',
        'Si eres responsable, identifica qué puedes hacer para reparar'
      ],
      description: 'La culpa a menudo es desproporcionada. Este análisis ayuda a evaluarla objetivamente.',
      whenToUse: 'Cuando la culpa es intensa y persistente, incluso cuando no es proporcional.'
    },
    {
      name: 'Reparación Activa',
      type: 'CBT',
      steps: [
        'Si lastimaste a alguien, reconoce tu error directamente',
        'Ofrece una disculpa sincera sin excusas',
        'Pregunta qué puedes hacer para reparar el daño',
        'Comprométete a cambiar el comportamiento en el futuro'
      ],
      description: 'Tomar acción para reparar reduce la culpa y restaura relaciones.',
      whenToUse: 'Cuando la culpa es válida y hay algo que puedes hacer para reparar.'
    }
  ],

  alegria: [
    {
      name: 'Savoring (Saborear)',
      type: 'CBT',
      steps: [
        'Cuando sientas alegría, detente y obsérvala conscientemente',
        'Amplifica la experiencia: nota los detalles sensoriales',
        'Comparte la alegría con alguien si es posible',
        'Guarda un recuerdo mental o escrito de este momento'
      ],
      description: 'Saborear los momentos positivos aumenta su duración e impacto.',
      whenToUse: 'Cuando experimentas alegría y quieres que dure más o tener más impacto.'
    },
    {
      name: 'Gratitud Activa',
      type: 'CBT',
      steps: [
        'Identifica 3 cosas específicas por las que estás agradecido ahora',
        'Escribe o piensa en detalle sobre cada una',
        'Reconoce cómo estas cosas contribuyen a tu bienestar',
        'Expresa gratitud a alguien si es apropiado'
      ],
      description: 'La gratitud amplifica las emociones positivas y mejora el bienestar general.',
      whenToUse: 'Cuando quieres cultivar más alegría y bienestar en tu vida.'
    }
  ],

  esperanza: [
    {
      name: 'Visualización de Futuro Positivo',
      type: 'ACT',
      steps: [
        'Imagina un futuro donde las cosas van mejor',
        'Visualiza los pasos específicos que te llevarían allí',
        'Identifica qué valores importantes guían ese futuro',
        'Comienza con una acción pequeña hacia ese futuro hoy'
      ],
      description: 'Conectar con un futuro positivo motiva acción y mantiene la esperanza.',
      whenToUse: 'Cuando necesitas motivación o dirección hacia adelante.'
    }
  ],

  neutral: [
    {
      name: 'Mindfulness del Presente',
      type: 'DBT',
      steps: [
        'Observa tu estado actual sin juzgarlo',
        'Nota las sensaciones físicas en tu cuerpo',
        'Observa tus pensamientos sin aferrarte a ellos',
        'Permanece presente con lo que es, sin necesidad de cambiarlo'
      ],
      description: 'El estado neutral es válido. Practicar mindfulness ayuda a estar cómodo con él.',
      whenToUse: 'Cuando quieres cultivar mayor conciencia y presencia en el momento.'
    }
  ]
};

// ========== TÉCNICAS DE TCC (TERAPIA COGNITIVO-CONDUCTUAL) ==========

export const CBT_TECHNIQUES = {
  cognitiveRestructuring: {
    name: 'Reestructuración Cognitiva',
    description: 'Identificar y cambiar pensamientos distorsionados o negativos.',
    steps: [
      'Identifica el pensamiento automático negativo',
      'Evalúa la evidencia a favor y en contra del pensamiento',
      'Identifica distorsiones cognitivas (pensamiento todo-o-nada, catastrofismo, etc.)',
      'Genera pensamientos alternativos más equilibrados y realistas',
      'Pon a prueba el nuevo pensamiento con experimentos conductuales'
    ],
    whenToUse: 'Para pensamientos negativos persistentes, ansiedad, depresión, o patrones de pensamiento rígidos.',
    emotions: ['ansiedad', 'tristeza', 'enojo', 'miedo', 'culpa', 'verguenza']
  },

  thoughtRecord: {
    name: 'Registro de Pensamientos',
    description: 'Documentar pensamientos, emociones y comportamientos para identificar patrones.',
    steps: [
      'Registra la situación que activó el pensamiento',
      'Anota el pensamiento automático exacto',
      'Identifica la emoción y su intensidad (1-10)',
      'Evalúa la evidencia a favor y en contra',
      'Genera un pensamiento alternativo más equilibrado',
      'Reevalúa la emoción después del cambio de pensamiento'
    ],
    whenToUse: 'Para identificar patrones de pensamiento y practicar reestructuración cognitiva.',
    emotions: ['ansiedad', 'tristeza', 'enojo', 'culpa', 'verguenza']
  },

  behavioralActivation: {
    name: 'Activación Conductual',
    description: 'Aumentar actividades agradables y significativas para mejorar el estado de ánimo.',
    steps: [
      'Identifica actividades que solías disfrutar o que son importantes para ti',
      'Crea una lista de actividades graduadas (de más fácil a más difícil)',
      'Programa al menos una actividad agradable cada día',
      'Comienza con actividades pequeñas y manejables',
      'Registra cómo te sientes antes y después de cada actividad',
      'Aumenta gradualmente la frecuencia y variedad de actividades'
    ],
    whenToUse: 'Para depresión, tristeza persistente, o cuando te sientes desmotivado y sin energía.',
    emotions: ['tristeza', 'neutral']
  },

  exposure: {
    name: 'Exposición Gradual',
    description: 'Enfrentar gradualmente situaciones temidas para reducir la ansiedad.',
    steps: [
      'Crea una jerarquía de situaciones temidas (de menos a más ansiosas)',
      'Comienza con la situación menos ansiosa',
      'Permanece en la situación hasta que la ansiedad disminuya naturalmente',
      'No uses estrategias de escape o evitación',
      'Avanza gradualmente a situaciones más desafiantes',
      'Celebra cada logro, sin importar qué tan pequeño'
    ],
    whenToUse: 'Para ansiedad, fobias, o cuando evitas situaciones importantes por miedo.',
    emotions: ['ansiedad', 'miedo']
  },

  problemSolving: {
    name: 'Resolución de Problemas',
    description: 'Enfoque estructurado para resolver problemas de manera efectiva.',
    steps: [
      'Define el problema de manera específica y concreta',
      'Genera múltiples soluciones posibles (sin juzgar)',
      'Evalúa las ventajas y desventajas de cada solución',
      'Selecciona la mejor solución o combinación de soluciones',
      'Crea un plan de acción específico con pasos concretos',
      'Implementa el plan y evalúa los resultados',
      'Ajusta el plan según sea necesario'
    ],
    whenToUse: 'Para problemas prácticos, decisiones difíciles, o cuando te sientes atascado.',
    emotions: ['ansiedad', 'tristeza', 'enojo']
  }
};

// ========== TÉCNICAS DE DBT (TERAPIA DIALÉCTICA CONDUCTUAL) ==========

export const DBT_TECHNIQUES = {
  mindfulness: {
    name: 'Mindfulness',
    description: 'Practicar atención plena al momento presente sin juicio.',
    steps: [
      'Observa: Nota lo que está sucediendo sin intentar cambiarlo',
      'Describe: Usa palabras para describir la experiencia sin juicios',
      'Participa: Involúcrate completamente en la actividad presente',
      'No juzgues: Observa sin etiquetar como "bueno" o "malo"',
      'Una cosa a la vez: Enfócate en una actividad o sensación a la vez',
      'Efectivamente: Haz lo que funciona, no lo que "deberías" hacer'
    ],
    whenToUse: 'Para regular emociones intensas, reducir reactividad, o aumentar conciencia.',
    emotions: ['ansiedad', 'enojo', 'tristeza', 'miedo', 'verguenza', 'culpa']
  },

  distressTolerance: {
    name: 'Tolerancia a la Angustia',
    description: 'Habilidades para sobrellevar momentos difíciles sin empeorar la situación.',
    techniques: {
      distract: {
        name: 'Distracción (ACEPTA)',
        steps: [
          'Actividades: Haz algo que te distraiga',
          'Contribuir: Ayuda a alguien o haz algo útil',
          'Comparaciones: Compara tu situación con otras más difíciles',
          'Emociones: Genera emociones opuestas (ej: ver comedia cuando estás triste)',
          'Empujar: Empuja la situación fuera de tu mente temporalmente',
          'Pensamientos: Piensa en otras cosas',
          'Sensaciones: Usa sensaciones intensas (agua fría, música fuerte)'
        ]
      },
      selfSoothe: {
        name: 'Autoconsuelo',
        steps: [
          'Vista: Mira algo hermoso o relajante',
          'Oído: Escucha música calmante o sonidos de naturaleza',
          'Olfato: Usa aromas relajantes (velas, aceites esenciales)',
          'Gusto: Saborea algo que disfrutes lentamente',
          'Tacto: Toma un baño caliente, usa una manta suave'
        ]
      },
      improve: {
        name: 'MEJORAR el momento',
        steps: [
          'Imagina: Visualiza un lugar seguro o situación mejor',
          'Significado: Encuentra significado o propósito en el sufrimiento',
          'Oración: Reza, medita, o conecta con algo más grande',
          'Relajación: Usa técnicas de relajación',
          'Una cosa a la vez: Enfócate solo en este momento',
          'Vacaciones: Date un "descanso" mental breve',
          'Aliento: Anímate con afirmaciones positivas'
        ]
      }
    },
    whenToUse: 'Para momentos de crisis, emociones intensas, o cuando no puedes cambiar la situación inmediatamente.',
    emotions: ['ansiedad', 'enojo', 'tristeza', 'miedo', 'verguenza', 'culpa']
  },

  emotionRegulation: {
    name: 'Regulación Emocional',
    description: 'Habilidades para entender y cambiar emociones problemáticas.',
    steps: [
      'Identifica y etiqueta la emoción',
      'Identifica obstáculos para cambiar la emoción',
      'Reduce la vulnerabilidad a emociones negativas (PLEASED)',
      'Aumenta eventos emocionales positivos',
      'Aumenta mindfulness de emociones actuales',
      'Aplica técnicas opuestas a la acción',
      'Resuelve problemas que causan emociones negativas'
    ],
    whenToUse: 'Para emociones intensas que interfieren con la vida, o patrones emocionales problemáticos.',
    emotions: ['ansiedad', 'enojo', 'tristeza', 'miedo', 'verguenza', 'culpa']
  },

  interpersonalEffectiveness: {
    name: 'Efectividad Interpersonal',
    description: 'Habilidades para mantener relaciones y lograr objetivos interpersonales.',
    skills: {
      dearMan: {
        name: 'DEAR MAN (Pedir lo que necesitas)',
        steps: [
          'Describe: Describe la situación de manera objetiva',
          'Expresa: Expresa tus sentimientos y opiniones',
          'Afirma: Afirma tus necesidades de manera clara',
          'Refuerza: Refuerza por qué es importante para ti',
          'Mindful: Mantén la atención en tu objetivo',
          'Aparece: Aparece confiado (postura, tono de voz)',
          'Negocia: Negocia y encuentra compromisos'
        ]
      },
      give: {
        name: 'GIVE (Mantener relaciones)',
        steps: [
          'Gentil: Sé amable y respetuoso',
          'Interesado: Muestra interés genuino',
          'Valida: Valida los sentimientos de la otra persona',
          'Fácil: Mantén un tono fácil y relajado'
        ]
      },
      fast: {
        name: 'FAST (Mantener auto-respeto)',
        steps: [
          'Justo: Sé justo contigo mismo y con los demás',
          'No disculpas: No te disculpes por tener necesidades',
          'Apegarse: Apegarse a tus valores',
          'Verdadero: Sé honesto, no exageres ni minimices'
        ]
      }
    },
    whenToUse: 'Para conflictos interpersonales, establecer límites, o pedir lo que necesitas.',
    emotions: ['enojo', 'ansiedad', 'verguenza', 'culpa']
  }
};

// ========== TÉCNICAS DE ACT (TERAPIA DE ACEPTACIÓN Y COMPROMISO) ==========

export const ACT_TECHNIQUES = {
  acceptance: {
    name: 'Aceptación',
    description: 'Abrir espacio para experiencias difíciles sin luchar contra ellas.',
    steps: [
      'Observa la experiencia difícil (pensamiento, emoción, sensación)',
      'Reconoce que está presente sin intentar eliminarla',
      'Dale espacio: imagina que la experiencia tiene espacio para existir',
      'Respira alrededor de la experiencia, no a través de ella',
      'Continúa con lo que es importante para ti, llevando la experiencia contigo'
    ],
    whenToUse: 'Cuando luchar contra emociones o pensamientos los empeora o te paraliza.',
    emotions: ['ansiedad', 'tristeza', 'enojo', 'miedo', 'verguenza', 'culpa']
  },

  cognitiveDefusion: {
    name: 'Defusión Cognitiva',
    description: 'Ver pensamientos como eventos mentales, no como verdades absolutas.',
    techniques: {
      'Pensamiento como nube': 'Observa el pensamiento como una nube que pasa en el cielo',
      'Pensamiento como tren': 'Observa los pensamientos como vagones de tren que pasan',
      'Prefijo "Estoy teniendo el pensamiento de que..."': 'Agrega este prefijo a tus pensamientos para crear distancia',
      'Cantar el pensamiento': 'Canta el pensamiento difícil con una melodía tonta',
      'Repetir rápido': 'Repite el pensamiento rápidamente hasta que pierda significado'
    },
    whenToUse: 'Cuando los pensamientos te atrapan o te controlan, especialmente pensamientos negativos recurrentes.',
    emotions: ['ansiedad', 'tristeza', 'enojo', 'miedo', 'verguenza', 'culpa']
  },

  valuesClarification: {
    name: 'Clarificación de Valores',
    description: 'Identificar lo que realmente importa para guiar acciones significativas.',
    steps: [
      'Reflexiona sobre diferentes áreas de vida (relaciones, trabajo, salud, crecimiento)',
      'Para cada área, pregunta: "¿Qué es realmente importante para mí aquí?"',
      'Identifica valores específicos (no metas, sino principios que guían)',
      'Evalúa si tus acciones actuales están alineadas con estos valores',
      'Identifica acciones pequeñas que te acerquen a vivir según tus valores'
    ],
    whenToUse: 'Cuando te sientes perdido, sin dirección, o cuando tus acciones no reflejan lo que realmente importa.',
    emotions: ['tristeza', 'neutral', 'ansiedad']
  },

  committedAction: {
    name: 'Acción Comprometida',
    description: 'Tomar acción efectiva guiada por valores, incluso cuando es difícil.',
    steps: [
      'Identifica un valor importante para ti',
      'Define una acción específica alineada con ese valor',
      'Reconoce los obstáculos internos (pensamientos, emociones) que pueden aparecer',
      'Comprométete a la acción incluso si aparecen obstáculos',
      'Toma la acción, llevando contigo cualquier incomodidad',
      'Evalúa y ajusta según los resultados'
    ],
    whenToUse: 'Cuando sabes qué hacer pero emociones o pensamientos te impiden actuar.',
    emotions: ['ansiedad', 'miedo', 'tristeza', 'enojo']
  },

  presentMoment: {
    name: 'Momento Presente',
    description: 'Conectarse plenamente con la experiencia presente.',
    steps: [
      'Lleva tu atención al momento presente',
      'Observa lo que está sucediendo aquí y ahora',
      'Nota sensaciones físicas, sonidos, imágenes',
      'Cuando la mente divague, gentilmente regrésala al presente',
      'Practica sin juzgar si lo estás haciendo "bien" o "mal"'
    ],
    whenToUse: 'Para reducir rumiación sobre el pasado o preocupación sobre el futuro.',
    emotions: ['ansiedad', 'tristeza', 'miedo']
  }
};

// ========== FUNCIONES HELPER ==========

/**
 * Obtiene técnicas inmediatas para una emoción específica
 * @param {string} emotion - Emoción detectada
 * @param {number} intensity - Intensidad emocional (1-10)
 * @returns {Array} Array de técnicas inmediatas
 */
export const getImmediateTechniques = (emotion, intensity = 5) => {
  const techniques = IMMEDIATE_TECHNIQUES[emotion] || [];
  
  // Si la intensidad es muy alta (8+), priorizar técnicas de regulación
  if (intensity >= 8) {
    return techniques.filter(t => 
      t.type === 'DBT' || 
      t.name.includes('Respiración') || 
      t.name.includes('Grounding') ||
      t.name.includes('Tiempo Fuera')
    );
  }
  
  return techniques;
};

/**
 * Obtiene técnicas de TCC apropiadas para una emoción
 * @param {string} emotion - Emoción detectada
 * @returns {Array} Array de técnicas de TCC
 */
export const getCBTTechniques = (emotion) => {
  return Object.values(CBT_TECHNIQUES).filter(technique => 
    technique.emotions && technique.emotions.includes(emotion)
  );
};

/**
 * Obtiene técnicas de DBT apropiadas para una emoción
 * @param {string} emotion - Emoción detectada
 * @returns {Array} Array de técnicas de DBT
 */
export const getDBTTechniques = (emotion) => {
  return Object.values(DBT_TECHNIQUES).filter(technique => 
    technique.emotions && technique.emotions.includes(emotion)
  );
};

/**
 * Obtiene técnicas de ACT apropiadas para una emoción
 * @param {string} emotion - Emoción detectada
 * @returns {Array} Array de técnicas de ACT
 */
export const getACTTechniques = (emotion) => {
  return Object.values(ACT_TECHNIQUES).filter(technique => 
    technique.emotions && technique.emotions.includes(emotion)
  );
};

/**
 * Selecciona la técnica más apropiada según emoción, intensidad y fase terapéutica
 * @param {string} emotion - Emoción detectada
 * @param {number} intensity - Intensidad emocional (1-10)
 * @param {string} phase - Fase terapéutica ('inicial', 'intermedia', 'avanzada')
 * @param {string} intent - Intención del mensaje
 * @returns {Object|null} Técnica seleccionada o null
 */
export const selectAppropriateTechnique = (emotion, intensity = 5, phase = 'inicial', intent = null) => {
  // Para intensidades muy altas (8+), priorizar técnicas inmediatas de regulación
  if (intensity >= 8) {
    const immediate = getImmediateTechniques(emotion, intensity);
    if (immediate.length > 0) {
      return {
        ...immediate[0],
        category: 'immediate',
        priority: 'high'
      };
    }
  }

  // Para fase inicial, usar técnicas más simples y accesibles
  if (phase === 'inicial') {
    const immediate = getImmediateTechniques(emotion, intensity);
    if (immediate.length > 0) {
      return {
        ...immediate[0],
        category: 'immediate',
        priority: 'medium'
      };
    }
  }

  // Para fases más avanzadas, incluir técnicas más estructuradas
  if (phase === 'intermedia' || phase === 'avanzada') {
    // Combinar técnicas inmediatas con técnicas estructuradas
    const allTechniques = [
      ...getImmediateTechniques(emotion, intensity),
      ...getCBTTechniques(emotion),
      ...getDBTTechniques(emotion),
      ...getACTTechniques(emotion)
    ];
    
    if (allTechniques.length > 0) {
      // Seleccionar técnica basada en la intención si está disponible
      if (intent === 'SEEKING_HELP' || intent === 'CRISIS') {
        return {
          ...allTechniques[0],
          category: 'structured',
          priority: 'high'
        };
      }
      
      return {
        ...allTechniques[0],
        category: 'structured',
        priority: 'medium'
      };
    }
  }

  // Fallback: técnica inmediata genérica
  const immediate = getImmediateTechniques(emotion, intensity);
  if (immediate.length > 0) {
    return {
      ...immediate[0],
      category: 'immediate',
      priority: 'low'
    };
  }

  return null;
};

/**
 * Formatea una técnica como texto para incluir en respuestas del chat
 * @param {Object} technique - Objeto de técnica
 * @param {Object} options - Opciones de formato { compact: boolean, maxSteps: number }
 * @returns {string} Texto formateado de la técnica
 */
export const formatTechniqueForResponse = (technique, options = {}) => {
  if (!technique) return '';

  const { compact = false, maxSteps = 4 } = options;

  // Formato compacto para cuando hay limitaciones de espacio
  if (compact) {
    let text = `\n\n💡 ${technique.name} (${technique.type || 'Terapéutica'})\n\n`;
    
    if (technique.description) {
      text += `${technique.description}\n\n`;
    }

    // En formato compacto, mostrar solo los primeros 2-3 pasos
    if (technique.steps && Array.isArray(technique.steps) && technique.steps.length > 0) {
      const stepsToShow = Math.min(2, technique.steps.length);
      text += 'Pasos principales:\n';
      for (let i = 0; i < stepsToShow; i++) {
        text += `${i + 1}. ${technique.steps[i]}\n`;
      }
      if (technique.steps.length > stepsToShow) {
        text += `\nPuedes preguntarme por los pasos completos si te interesa.\n`;
      }
    }

    return text;
  }

  // Formato completo
  let text = `\n\n💡 Técnica sugerida: ${technique.name}\n`;
  text += `${technique.type || 'Terapéutica'}\n\n`;
  
  if (technique.description) {
    text += `${technique.description}\n\n`;
  }

  if (technique.steps && Array.isArray(technique.steps) && technique.steps.length > 0) {
    text += 'Pasos:\n';
    const stepsToShow = Math.min(maxSteps, technique.steps.length);
    technique.steps.slice(0, stepsToShow).forEach((step, index) => {
      text += `${index + 1}. ${step}\n`;
    });
    
    // Si hay más pasos, mencionarlo
    if (technique.steps.length > stepsToShow) {
      text += `\nHay ${technique.steps.length - stepsToShow} paso(s) adicional(es). Puedes preguntarme por los pasos completos.\n`;
    }
  }

  if (technique.whenToUse) {
    text += `\nCuándo usar: ${technique.whenToUse}\n`;
  }

  return text;
};

