/**
 * Script de pruebas para validar el análisis emocional
 * 
 * Ejecutar con: node backend/tests/testEmotionalAnalysis.js
 */

import emotionalAnalyzer from '../services/emotionalAnalyzer.js';

// Casos de prueba
const testCases = [
  // ========== CASOS POSITIVOS ==========
  {
    name: '1. Expresiones de gusto/preferencia',
    input: 'Me gusta la Teletón',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '2. Expresiones de felicidad explícita',
    input: 'Estoy muy feliz hoy',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '3. Expresiones de satisfacción',
    input: 'Me siento contento con mi progreso',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '4. Expresiones de entusiasmo',
    input: 'Estoy emocionado por el nuevo proyecto',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '5. Expresiones de esperanza',
    input: 'Tengo esperanza de que todo mejore',
    expected: { emotion: 'esperanza', category: 'positive', minIntensity: 5, maxIntensity: 7 }
  },
  {
    name: '6. Expresiones con emojis positivos',
    input: 'Me siento genial 😊',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '7. Expresiones de logro',
    input: 'Logré completar mi meta',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 7, maxIntensity: 9 }
  },
  
  // ========== CASOS NEGATIVOS ==========
  {
    name: '8. Expresiones de tristeza explícita',
    input: 'Estoy muy triste',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '9. Expresiones de ansiedad',
    input: 'Me siento muy ansioso por el examen',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  {
    name: '10. Expresiones de enojo',
    input: 'Estoy furioso con mi jefe',
    expected: { emotion: 'enojo', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  {
    name: '11. Expresiones de miedo',
    input: 'Tengo miedo de lo que pueda pasar',
    expected: { emotion: 'miedo', category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '12. Expresiones de desánimo',
    input: 'No tengo ganas de hacer nada',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '13. Expresiones con emojis negativos',
    input: 'Me siento mal 😢',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  
  // ========== CASOS NEUTRALES ==========
  {
    name: '14. Expresiones neutrales',
    input: 'Estoy normal',
    expected: { emotion: 'neutral', category: 'neutral', minIntensity: 4, maxIntensity: 6 }
  },
  {
    name: '15. Expresiones de bienestar básico',
    input: 'Todo bien',
    expected: { emotion: 'neutral', category: 'neutral', minIntensity: 4, maxIntensity: 6 }
  },
  
  // ========== CASOS AMBIGUOS ==========
  {
    name: '16. Expresiones mixtas',
    input: 'Estoy feliz pero también preocupado',
    expected: { emotion: ['alegria', 'ansiedad'], category: ['positive', 'negative'], minIntensity: 5, maxIntensity: 8 }
  },
  {
    name: '17. Expresiones con negación',
    input: 'No estoy triste',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 4, maxIntensity: 6 }
  },
  {
    name: '18. Expresiones de "no me gusta"',
    input: 'No me gusta esta situación',
    expected: { emotion: ['tristeza', 'enojo'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '19. Preguntas retóricas negativas',
    input: '¿Por qué siempre me pasa esto a mí?',
    expected: { emotion: ['enojo', 'ansiedad'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '20. Expresiones de comparación temporal positiva',
    input: 'Me siento mejor que ayer',
    expected: { emotion: ['alegria', 'neutral'], category: ['positive', 'neutral'], minIntensity: 5, maxIntensity: 7 }
  },
  {
    name: '21. Expresiones de comparación temporal negativa',
    input: 'Estoy peor que antes',
    expected: { emotion: ['tristeza', 'ansiedad'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  
  // ========== CASOS CON INTENSIFICADORES ==========
  {
    name: '22. Intensificadores positivos',
    input: 'Estoy MUY MUY feliz',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '23. Intensificadores negativos',
    input: 'Estoy extremadamente triste',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '24. Atenuadores',
    input: 'Me siento un poco triste',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 4, maxIntensity: 6 }
  },
  
  // ========== CASOS ESPECÍFICOS ==========
  {
    name: '25. Expresiones de gratitud',
    input: 'Gracias por estar aquí',
    expected: { emotion: ['alegria', 'neutral'], category: ['positive', 'neutral'], minIntensity: 4, maxIntensity: 7 }
  },
  {
    name: '26. Expresiones de culpa',
    input: 'Me siento culpable por lo que hice',
    expected: { emotion: 'culpa', category: 'negative', minIntensity: 5, maxIntensity: 7 }
  },
  {
    name: '27. Expresiones de vergüenza',
    input: 'Me da vergüenza lo que pasó',
    expected: { emotion: 'verguenza', category: 'negative', minIntensity: 5, maxIntensity: 7 }
  },
  
  // ========== CASOS LÍMITE ==========
  {
    name: '28. Mensajes muy cortos',
    input: 'Bien',
    expected: { emotion: 'neutral', category: 'neutral', minIntensity: 4, maxIntensity: 6 }
  },
  {
    name: '29. Mensajes con mayúsculas',
    input: 'ESTOY MUY ENOJADO',
    expected: { emotion: 'enojo', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '30. Mensajes con signos de exclamación múltiples',
    input: '¡Estoy muy feliz!!!',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '31. Mensajes con signos de interrogación múltiples',
    input: '¿Por qué me pasa esto???',
    expected: { emotion: ['ansiedad', 'enojo'], category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  
  // ========== CASOS CRÍTICOS ==========
  {
    name: '32. "No me gusta" NO debe ser positivo',
    input: 'No me gusta esto',
    expected: { emotion: ['tristeza', 'enojo'], category: 'negative', minIntensity: 6, maxIntensity: 8, notEmotion: 'alegria' }
  },
  {
    name: '33. "Me gusta" SÍ debe ser positivo',
    input: 'Me gusta la música',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 6, maxIntensity: 8, notEmotion: 'tristeza' }
  },
  
  // ========== CASOS DE CRISIS DE PÁNICO ==========
  {
    name: '34. Crisis de pánico - Ataque de pánico',
    input: 'Estoy teniendo un ataque de pánico, no puedo respirar',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '35. Crisis de pánico - Sensación de ahogo',
    input: 'Siento que me ahogo, mi corazón late muy rápido',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '36. Crisis de pánico - Miedo a morir',
    input: 'Siento que me voy a morir, no puedo controlar mi respiración',
    expected: { emotion: ['ansiedad', 'miedo'], category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '37. Crisis de pánico - Síntomas físicos',
    input: 'Tengo palpitaciones, sudoración y siento que me desmayo',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '38. Crisis de pánico - Pérdida de control',
    input: 'Siento que pierdo el control, no puedo pensar claramente',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '39. Crisis de pánico - Despersonalización',
    input: 'Siento que no soy yo, como si estuviera fuera de mi cuerpo',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  
  // ========== CASOS DE PRINCIPIOS DE AUTOLESIÓN ==========
  {
    name: '40. Autolesión - Pensamientos de hacerse daño',
    input: 'Tengo ganas de hacerme daño',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '41. Autolesión - Cortarse',
    input: 'Quiero cortarme, siento que es la única forma de sentir algo',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '42. Autolesión - Quemarse',
    input: 'A veces me quemo para sentir algo diferente',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '43. Autolesión - Golpearse',
    input: 'Me golpeo cuando me siento muy mal',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '44. Autolesión - Sentir alivio con dolor',
    input: 'El dolor físico me hace sentir mejor que el dolor emocional',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '45. Autolesión - Pensamientos recurrentes',
    input: 'No puedo dejar de pensar en hacerme daño',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '46. Autolesión - Cicatrices',
    input: 'Tengo muchas cicatrices de cuando me cortaba',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  {
    name: '47. Autolesión - Urgencia',
    input: 'Necesito hacerme daño ahora mismo',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 10, maxIntensity: 10 }
  },
  
  // ========== CASOS DE SOSPECHA DE NEURODIVERGENCIA ==========
  {
    name: '48. Neurodivergencia - Dificultad con estímulos sensoriales',
    input: 'Los ruidos fuertes me abruman mucho, siento que me sobrecarga',
    expected: { emotion: ['ansiedad', 'miedo'], category: 'negative', minIntensity: 6, maxIntensity: 9 }
  },
  {
    name: '49. Neurodivergencia - Dificultad social',
    input: 'No entiendo las señales sociales, siempre me siento fuera de lugar',
    expected: { emotion: ['ansiedad', 'tristeza'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '50. Neurodivergencia - Hiperfoco',
    input: 'Me obsesiono con cosas y no puedo pensar en nada más',
    expected: { emotion: ['ansiedad', 'neutral'], category: ['negative', 'neutral'], minIntensity: 5, maxIntensity: 8 }
  },
  
  // ========== IDEACIÓN SUICIDA EXPLÍCITA ==========
  {
    name: '51. Ideación suicida - Pensamientos explícitos',
    input: 'A veces pienso que sería mejor si no existiera',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '52. Ideación suicida - Planificación',
    input: 'He pensado en cómo terminar con todo esto',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 10, maxIntensity: 10 }
  },
  {
    name: '53. Ideación suicida - Despedida',
    input: 'Nadie me extrañaría si me fuera',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  
  // ========== DESESPERANZA Y DESESPERACIÓN ==========
  {
    name: '54. Desesperanza - Sin salida',
    input: 'No veo ninguna salida a esta situación',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '55. Desesperanza - Sin futuro',
    input: 'Mi futuro se ve completamente negro',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '56. Desesperación - Ya no puedo más',
    input: 'Ya no puedo más, estoy al límite',
    expected: { emotion: ['tristeza', 'ansiedad'], category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  
  // ========== EXPRESIONES SARCÁSTICAS/IRÓNICAS ==========
  {
    name: '57. Sarcasmo - Positivo falso',
    input: '¡Qué genial! Otro problema más',
    expected: { emotion: ['enojo', 'tristeza'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '58. Ironía - Negación sarcástica',
    input: 'Claro, porque mi vida no puede ser peor',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  
  // ========== BURNOUT Y AGOTAMIENTO ==========
  {
    name: '59. Burnout - Agotamiento emocional',
    input: 'Estoy completamente agotado, no puedo más',
    expected: { emotion: ['tristeza', 'ansiedad'], category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '60. Burnout - Sin energía',
    input: 'Me siento vacío, sin energía para nada',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  
  // ========== SOLEDAD Y AISLAMIENTO ==========
  {
    name: '61. Soledad - Aislamiento social',
    input: 'Me siento completamente solo, nadie me entiende',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '62. Soledad - Desconexión',
    input: 'Me siento desconectado de todos',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  
  // ========== EXPRESIONES CON EMOJIS MIXTOS/CONTRADICTORIOS ==========
  {
    name: '63. Emojis mixtos - Contradicción',
    input: 'Estoy bien 😊😢',
    expected: { emotion: ['tristeza', 'alegria'], category: ['negative', 'positive'], minIntensity: 5, maxIntensity: 8 }
  },
  {
    name: '64. Emojis negativos con texto positivo',
    input: 'Todo está perfecto 😢',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  
  // ========== NEGACIÓN COMPLEJA ==========
  {
    name: '65. Negación compleja - Doble negación',
    input: 'No es que no esté triste, pero...',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 5, maxIntensity: 7 }
  },
  {
    name: '66. Negación compleja - Minimización',
    input: 'No es para tanto, solo estoy un poco triste',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 5, maxIntensity: 7 }
  },
  
  // ========== EXPRESIONES TEMPORALES COMPLEJAS ==========
  {
    name: '67. Temporal complejo - Mejora gradual',
    input: 'Me siento mejor que hace una semana pero peor que ayer',
    expected: { emotion: ['alegria', 'tristeza'], category: ['positive', 'negative'], minIntensity: 5, maxIntensity: 7 }
  },
  {
    name: '68. Temporal complejo - Ciclo',
    input: 'Algunos días estoy bien, otros días muy mal',
    expected: { emotion: ['tristeza', 'neutral'], category: ['negative', 'neutral'], minIntensity: 5, maxIntensity: 8 }
  },
  
  // ========== CULPA Y VERGÜENZA ESPECÍFICAS ==========
  {
    name: '69. Culpa - Autoculpa',
    input: 'Todo es mi culpa, siempre arruino todo',
    expected: { emotion: 'culpa', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '70. Vergüenza - Exposición social',
    input: 'Me da mucha vergüenza lo que pasó ayer',
    expected: { emotion: 'verguenza', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  
  // ========== MIEDO ESPECÍFICO ==========
  {
    name: '71. Miedo - Fobia específica',
    input: 'Tengo mucho miedo de salir de casa',
    expected: { emotion: 'miedo', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  {
    name: '72. Miedo - Ansiedad anticipatoria',
    input: 'Me aterra pensar en lo que puede pasar mañana',
    expected: { emotion: ['miedo', 'ansiedad'], category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  
  // ========== EXPRESIONES COLOQUIALES/REGIONALES ==========
  {
    name: '73. Coloquial - Expresión regional positiva',
    input: 'Estoy de lo más bien',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '74. Coloquial - Expresión regional negativa',
    input: 'Estoy hecho polvo',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  
  // ========== CASOS LÍMITE Y AMBIGUOS ==========
  {
    name: '75. Ambiguo - Mensaje muy corto',
    input: 'Ok',
    expected: { emotion: 'neutral', category: 'neutral', minIntensity: 3, maxIntensity: 5 }
  },
  {
    name: '76. Ambiguo - Sin contexto emocional',
    input: 'Hoy es martes',
    expected: { emotion: 'neutral', category: 'neutral', minIntensity: 3, maxIntensity: 5 }
  },
  {
    name: '77. Ambiguo - Pregunta simple',
    input: '¿Cómo estás?',
    expected: { emotion: 'neutral', category: 'neutral', minIntensity: 3, maxIntensity: 5 }
  },
  
  // ========== CRISIS MÁS ESPECÍFICAS ==========
  {
    name: '78. Crisis - Ataque de ansiedad',
    input: 'Estoy teniendo un ataque de ansiedad, no puedo calmarme',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 9, maxIntensity: 10 }
  },
  {
    name: '79. Crisis - Disociación',
    input: 'Siento que no estoy en mi cuerpo, como si fuera un sueño',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  
  // ========== EXPRESIONES DE INTENSIDAD EXTREMA ==========
  {
    name: '80. Intensidad extrema - Positiva',
    input: 'ESTOY EXTREMADAMENTE FELIZ!!!',
    expected: { emotion: 'alegria', category: 'positive', minIntensity: 10, maxIntensity: 10 }
  },
  {
    name: '81. Intensidad extrema - Negativa',
    input: 'ESTOY COMPLETAMENTE DESTROZADO!!!',
    expected: { emotion: 'tristeza', category: 'negative', minIntensity: 10, maxIntensity: 10 }
  }
];

// Función para ejecutar las pruebas
async function runTests() {
  console.log('🧪 Iniciando pruebas de análisis emocional...\n');
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const testCase of testCases) {
    try {
      const result = await emotionalAnalyzer.analyzeEmotion(testCase.input);
      
      // Verificar emoción
      const expectedEmotions = Array.isArray(testCase.expected.emotion) 
        ? testCase.expected.emotion 
        : [testCase.expected.emotion];
      
      const emotionMatch = expectedEmotions.includes(result.mainEmotion);
      
      // Verificar categoría
      const expectedCategories = Array.isArray(testCase.expected.category)
        ? testCase.expected.category
        : [testCase.expected.category];
      
      const categoryMatch = expectedCategories.includes(result.category);
      
      // Verificar intensidad
      const intensityMatch = result.intensity >= testCase.expected.minIntensity && 
                            result.intensity <= testCase.expected.maxIntensity;
      
      // Verificar que NO sea una emoción específica (si se especifica)
      const notEmotionMatch = testCase.expected.notEmotion 
        ? result.mainEmotion !== testCase.expected.notEmotion
        : true;
      
      const testPassed = emotionMatch && categoryMatch && intensityMatch && notEmotionMatch;
      
      if (testPassed) {
        console.log(`✅ ${testCase.name}`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Resultado: ${result.mainEmotion} (${result.category}), intensidad: ${result.intensity}`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Esperado: ${testCase.expected.emotion} (${testCase.expected.category}), intensidad: ${testCase.expected.minIntensity}-${testCase.expected.maxIntensity}`);
        console.log(`   Obtenido: ${result.mainEmotion} (${result.category}), intensidad: ${result.intensity}`);
        
        if (!emotionMatch) {
          console.log(`   ⚠️  Emoción no coincide`);
        }
        if (!categoryMatch) {
          console.log(`   ⚠️  Categoría no coincide`);
        }
        if (!intensityMatch) {
          console.log(`   ⚠️  Intensidad fuera de rango`);
        }
        if (!notEmotionMatch) {
          console.log(`   ⚠️  Emoción incorrecta detectada (no debería ser ${testCase.expected.notEmotion})`);
        }
        
        failed++;
        failures.push({
          test: testCase.name,
          input: testCase.input,
          expected: testCase.expected,
          actual: result
        });
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${testCase.name} - ERROR: ${error.message}`);
      failed++;
      failures.push({
        test: testCase.name,
        input: testCase.input,
        error: error.message
      });
      console.log('');
    }
  }
  
  // Resumen
  console.log('='.repeat(60));
  console.log(`📊 Resumen de pruebas:`);
  console.log(`   ✅ Pasadas: ${passed}`);
  console.log(`   ❌ Fallidas: ${failed}`);
  console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (failures.length > 0) {
    console.log('\n❌ Casos fallidos:');
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.test}`);
      console.log(`   Input: "${failure.input}"`);
      if (failure.error) {
        console.log(`   Error: ${failure.error}`);
      } else {
        console.log(`   Esperado: ${JSON.stringify(failure.expected, null, 2)}`);
        console.log(`   Obtenido: ${JSON.stringify(failure.actual, null, 2)}`);
      }
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error('❌ Error ejecutando pruebas:', error);
  process.exit(1);
});

