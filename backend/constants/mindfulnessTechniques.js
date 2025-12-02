/**
 * Técnicas de Mindfulness y Grounding Específicas
 * 
 * Técnicas adicionales de mindfulness y grounding organizadas
 * por tipo y situación
 */

export const MINDFULNESS_TECHNIQUES = {
  // Para ansiedad
  anxiety: {
    bodyScan: {
      name: 'Body Scan',
      steps: [
        'Escanea tu cuerpo de pies a cabeza',
        'Nota sensaciones sin juzgar',
        'Observa tensión o relajación',
        'Respira en cada área que notes tensión'
      ],
      description: 'El escaneo corporal aumenta la conciencia del cuerpo y reduce la ansiedad física.'
    },
    breathAwareness: {
      name: 'Atención a la Respiración',
      steps: [
        'Observa tu respiración sin intentar cambiarla',
        'Nota cómo entra y sale el aire',
        'Si tu mente divaga, vuelve suavemente a la respiración',
        'Practica por 5-10 minutos'
      ],
      description: 'Observar la respiración ayuda a calmar el sistema nervioso.'
    },
    presentMoment: {
      name: 'Tres Cosas del Presente',
      steps: [
        'Nombra 3 cosas que puedes ver',
        'Nombra 3 cosas que puedes oír',
        'Nombra 3 cosas que puedes sentir (tacto)',
        'Repite si es necesario'
      ],
      description: 'Conectarte con el presente reduce la ansiedad sobre el futuro.'
    }
  },
  
  // Para tristeza
  sadness: {
    lovingKindness: {
      name: 'Bondad Amorosa',
      steps: [
        'Envíate compasión a ti mismo: "Que esté libre de sufrimiento"',
        'Extiende compasión a alguien cercano',
        'Extiende compasión a alguien neutral',
        'Extiende compasión a alguien difícil',
        'Extiende compasión a todos los seres'
      ],
      description: 'La bondad amorosa genera emociones positivas y reduce la tristeza.'
    },
    selfCompassion: {
      name: 'Autocompasión',
      steps: [
        'Reconoce que estás sufriendo',
        'Recuerda que el sufrimiento es parte de la experiencia humana',
        'Trátate como tratarías a un amigo querido',
        'Ofrécete palabras de consuelo y apoyo'
      ],
      description: 'La autocompasión reduce la autocrítica y el sufrimiento emocional.'
    },
    acceptance: {
      name: 'Aceptación de la Tristeza',
      steps: [
        'Reconoce la tristeza sin luchar contra ella',
        'Permite que esté ahí sin intentar eliminarla',
        'Observa cómo se siente en tu cuerpo',
        'Recuerda que las emociones son temporales'
      ],
      description: 'Aceptar la tristeza reduce la lucha interna y permite un procesamiento más saludable.'
    }
  },
  
  // Para enojo
  anger: {
    pause: {
      name: 'Pausa Consciente',
      steps: [
        'Haz una pausa antes de reaccionar',
        'Respira profundamente 3 veces',
        'Observa el enojo en tu cuerpo',
        'Pregúntate: "¿Qué necesito ahora?"'
      ],
      description: 'La pausa permite espacio entre el enojo y la reacción.'
    },
    observe: {
      name: 'Observación del Enojo',
      steps: [
        'Observa el enojo sin actuar',
        'Nota dónde lo sientes en tu cuerpo',
        'Observa los pensamientos que acompañan el enojo',
        'Permite que el enojo esté ahí sin alimentarlo'
      ],
      description: 'Observar el enojo sin reaccionar reduce su intensidad.'
    },
    space: {
      name: 'Crear Espacio',
      steps: [
        'Crea espacio físico si es posible (alejarte)',
        'Crea espacio mental (respiración profunda)',
        'Crea espacio emocional (observa sin juzgar)',
        'Usa ese espacio para elegir tu respuesta'
      ],
      description: 'Crear espacio permite responder en lugar de reaccionar.'
    }
  }
};

export const GROUNDING_TECHNIQUES = {
  // Grounding sensorial
  sensory: {
    fiveSenses: {
      name: 'Grounding 5-4-3-2-1',
      steps: [
        '5 cosas que puedes VER',
        '4 cosas que puedes TOCAR',
        '3 cosas que puedes OÍR',
        '2 cosas que puedes OLER',
        '1 cosa que puedes SABOREAR'
      ],
      description: 'Conectarte con tus sentidos te ancla en el presente.'
    },
    temperature: {
      name: 'Grounding por Temperatura',
      steps: [
        'Alterna agua fría y caliente en tus manos',
        'Siente la diferencia de temperatura',
        'Enfócate solo en la sensación',
        'Repite 3-5 veces'
      ],
      description: 'Sensaciones físicas intensas ayudan a salir de pensamientos abrumadores.'
    },
    texture: {
      name: 'Grounding por Textura',
      steps: [
        'Toca diferentes texturas a tu alrededor',
        'Describe cada textura en detalle',
        'Nota las diferencias entre texturas',
        'Enfócate solo en las sensaciones táctiles'
      ],
      description: 'Explorar texturas ayuda a conectarte con el presente.'
    }
  },
  
  // Grounding mental
  mental: {
    categories: {
      name: 'Grounding por Categorías',
      steps: [
        'Elige una categoría (colores, países, animales, etc.)',
        'Nombra 5 cosas en esa categoría',
        'Cambia a otra categoría',
        'Repite con 3-5 categorías diferentes'
      ],
      description: 'Usar el pensamiento lógico distrae de emociones intensas.'
    },
    math: {
      name: 'Grounding por Matemáticas',
      steps: [
        'Cuenta hacia atrás de 100 en 7',
        'O cuenta hacia atrás de 50 en 3',
        'O multiplica números simples',
        'Enfócate solo en los cálculos'
      ],
      description: 'Los cálculos mentales requieren concentración y distraen de emociones intensas.'
    },
    describe: {
      name: 'Grounding por Descripción',
      steps: [
        'Elige un objeto cerca de ti',
        'Descríbelo en detalle (color, forma, tamaño, textura)',
        'Describe cómo se ve desde diferentes ángulos',
        'Enfócate solo en la descripción'
      ],
      description: 'Describir en detalle ayuda a anclarte en el presente.'
    }
  },
  
  // Grounding emocional
  emotional: {
    name: {
      name: 'Nombrar la Emoción',
      steps: [
        'Nombra la emoción que estás sintiendo',
        'Dónde la sientes en tu cuerpo',
        'Qué intensidad tiene (1-10)',
        'Cómo cambia con el tiempo'
      ],
      description: 'Nombrar y observar emociones reduce su intensidad.'
    },
    locate: {
      name: 'Localizar la Emoción',
      steps: [
        '¿Dónde sientes esta emoción en tu cuerpo?',
        '¿Qué forma tiene?',
        '¿Qué temperatura tiene?',
        '¿Se mueve o está quieta?'
      ],
      description: 'Localizar emociones en el cuerpo ayuda a observarlas sin quedar atrapado en ellas.'
    },
    intensity: {
      name: 'Escala de Intensidad',
      steps: [
        'En una escala del 1 al 10, ¿qué tan intensa es esta emoción?',
        '¿Ha cambiado la intensidad desde que empezaste?',
        '¿Qué la hace más o menos intensa?',
        'Observa cómo la intensidad fluctúa'
      ],
      description: 'Medir la intensidad ayuda a observar la emoción sin quedar abrumado por ella.'
    }
  }
};

/**
 * Obtiene técnicas de mindfulness para una emoción específica
 * @param {string} emotion - Emoción detectada
 * @returns {Array} Array de técnicas de mindfulness
 */
export const getMindfulnessTechniques = (emotion) => {
  return MINDFULNESS_TECHNIQUES[emotion] ? Object.values(MINDFULNESS_TECHNIQUES[emotion]) : [];
};

/**
 * Obtiene técnicas de grounding por tipo
 * @param {string} type - Tipo de grounding ('sensory', 'mental', 'emotional')
 * @returns {Array} Array de técnicas de grounding
 */
export const getGroundingTechniques = (type = 'sensory') => {
  return GROUNDING_TECHNIQUES[type] ? Object.values(GROUNDING_TECHNIQUES[type]) : [];
};

/**
 * Obtiene todas las técnicas de grounding disponibles
 * @returns {Object} Todas las técnicas de grounding organizadas por tipo
 */
export const getAllGroundingTechniques = () => {
  return GROUNDING_TECHNIQUES;
};

