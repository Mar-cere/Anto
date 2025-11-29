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
  {
    name: '51. Neurodivergencia - Dificultad con cambios',
    input: 'Los cambios en mi rutina me generan mucha ansiedad',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 7, maxIntensity: 9 }
  },
  {
    name: '52. Neurodivergencia - Meltdown',
    input: 'A veces tengo crisis donde no puedo controlar mis emociones',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '53. Neurodivergencia - Dificultad con contacto físico',
    input: 'No me gusta que me toquen, me siento incómodo',
    expected: { emotion: ['ansiedad', 'verguenza'], category: 'negative', minIntensity: 5, maxIntensity: 8 }
  },
  {
    name: '54. Neurodivergencia - Dificultad con comunicación',
    input: 'Me cuesta expresar lo que siento, las palabras no salen',
    expected: { emotion: ['ansiedad', 'frustración'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '55. Neurodivergencia - Dificultad con multitarea',
    input: 'No puedo hacer varias cosas a la vez, me siento abrumado',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '56. Neurodivergencia - Dificultad con ruidos',
    input: 'Los ruidos de fondo me distraen mucho, no puedo concentrarme',
    expected: { emotion: ['ansiedad', 'enojo'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '57. Neurodivergencia - Dificultad con luces',
    input: 'Las luces brillantes me molestan mucho, me dan dolor de cabeza',
    expected: { emotion: ['ansiedad', 'enojo'], category: 'negative', minIntensity: 5, maxIntensity: 8 }
  },
  {
    name: '58. Neurodivergencia - Dificultad con texturas',
    input: 'Algunas texturas me dan mucha ansiedad, no puedo tocarlas',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '59. Neurodivergencia - Dificultad con rutinas',
    input: 'Necesito seguir mis rutinas exactamente igual, si no me siento perdido',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '60. Neurodivergencia - Dificultad con transiciones',
    input: 'Cambiar de una actividad a otra me cuesta mucho, me siento bloqueado',
    expected: { emotion: 'ansiedad', category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '61. Neurodivergencia - Dificultad con contacto visual',
    input: 'No puedo mantener contacto visual, me siento incómodo',
    expected: { emotion: ['ansiedad', 'verguenza'], category: 'negative', minIntensity: 5, maxIntensity: 7 }
  },
  {
    name: '62. Neurodivergencia - Dificultad con interpretación literal',
    input: 'A veces tomo todo literalmente y no entiendo las bromas',
    expected: { emotion: ['ansiedad', 'verguenza'], category: 'negative', minIntensity: 5, maxIntensity: 7 }
  },
  {
    name: '63. Neurodivergencia - Dificultad con emociones propias',
    input: 'No sé qué siento, todas las emociones se mezclan',
    expected: { emotion: ['ansiedad', 'tristeza'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '64. Neurodivergencia - Dificultad con emociones ajenas',
    input: 'No entiendo cómo se sienten los demás, me siento desconectado',
    expected: { emotion: ['tristeza', 'ansiedad'], category: 'negative', minIntensity: 6, maxIntensity: 8 }
  },
  {
    name: '65. Neurodivergencia - Burnout',
    input: 'Me siento completamente agotado, como si mi cerebro se hubiera apagado',
    expected: { emotion: ['tristeza', 'ansiedad'], category: 'negative', minIntensity: 8, maxIntensity: 10 }
  },
  {
    name: '66. Neurodivergencia - Enmascaramiento',
    input: 'Tengo que fingir ser normal todo el tiempo y estoy agotado',
    expected: { emotion: ['tristeza', 'ansiedad'], category: 'negative', minIntensity: 8, maxIntensity: 10 }
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

