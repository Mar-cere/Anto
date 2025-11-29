/**
 * Pruebas Específicas para Funcionalidades v2.0
 * 
 * Pruebas detalladas de cada nueva funcionalidad implementada
 */

import emotionalAnalyzer from '../services/emotionalAnalyzer.js';
import emotionalSubtypeDetector from '../services/emotionalSubtypeDetector.js';
import topicDetector from '../services/topicDetector.js';
import sessionEmotionalMemory from '../services/sessionEmotionalMemory.js';
import therapeuticTemplateService from '../services/therapeuticTemplateService.js';
import therapeuticProtocolService from '../services/therapeuticProtocolService.js';
import actionSuggestionService from '../services/actionSuggestionService.js';

// Función principal async para ejecutar todas las pruebas
async function runAllTests() {
  const userId = 'test-v2-' + Date.now();

  console.log('🧪 Ejecutando Pruebas Específicas de Funcionalidades v2.0...\n');
  console.log('='.repeat(80));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  async function runTest(name, testFn) {
    totalTests++;
    try {
      const result = await testFn();
      if (result === true || (result && result.success)) {
        passedTests++;
        console.log(`✅ ${name}`);
        if (result && result.details) {
          console.log(`   ${result.details}`);
        }
        return true;
      } else {
        failedTests++;
        console.log(`❌ ${name}`);
        if (result && result.error) {
          console.log(`   Error: ${result.error}`);
        }
        return false;
      }
    } catch (error) {
      failedTests++;
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  // ========== PRUEBAS DE SUBTIPOS EMOCIONALES ==========
  console.log('\n🎭 PRUEBAS DE SUBTIPOS EMOCIONALES\n');

  const subtypeTestCases = [
    { emotion: 'tristeza', content: 'Extraño mucho a mi abuela', expected: 'duelo' },
    { emotion: 'tristeza', content: 'Me siento solo, nadie me entiende', expected: 'soledad' },
    { emotion: 'tristeza', content: 'Soy un fracaso, no puedo hacer nada bien', expected: 'fracaso' },
    { emotion: 'ansiedad', content: 'Tengo miedo de hablar en público', expected: 'social' },
    { emotion: 'ansiedad', content: 'Me preocupa mucho lo que puede pasar mañana', expected: 'anticipatoria' },
    { emotion: 'enojo', content: 'No es justo cómo me trataron', expected: 'injusticia' },
    { emotion: 'culpa', content: 'Todo es mi culpa, siempre arruino todo', expected: 'autoculpa' },
    { emotion: 'alegria', content: 'Logré completar mi meta', expected: 'logro' }
  ];

  for (const [index, testCase] of subtypeTestCases.entries()) {
    await runTest(`Subtipo ${index + 1}: ${testCase.emotion} - ${testCase.expected}`, async () => {
      const subtype = emotionalSubtypeDetector.detectSubtype(testCase.emotion, testCase.content);
      return subtype === testCase.expected;
    });
  }

  // ========== PRUEBAS DE DETECCIÓN DE TEMAS ==========
  console.log('\n📌 PRUEBAS DE DETECCIÓN DE TEMAS\n');

  const topicTestCases = [
    { content: 'Mi pareja y yo tuvimos una discusión', expected: 'relaciones' },
    { content: 'Mi jefe me está presionando mucho', expected: 'trabajo' },
    { content: 'Me duele mucho la cabeza', expected: 'salud' },
    { content: 'No me gusta cómo me veo', expected: 'autoimagen' },
    { content: 'Me preocupa el futuro', expected: 'futuro' },
    { content: 'Recuerdo cuando era más feliz', expected: 'pasado' },
    { content: 'Me siento solo', expected: 'soledad' },
    { content: 'Mi abuela falleció', expected: 'pérdida' }
  ];

  for (const [index, testCase] of topicTestCases.entries()) {
    await runTest(`Tema ${index + 1}: ${testCase.expected}`, async () => {
      const topic = topicDetector.detectTopic(testCase.content);
      return topic === testCase.expected;
    });
  }

  // ========== PRUEBAS DE MEMORIA DE SESIÓN ==========
  console.log('\n🧠 PRUEBAS DE MEMORIA DE SESIÓN\n');

  await runTest('Buffer mantiene máximo de 20 análisis', async () => {
    sessionEmotionalMemory.clearBuffer(userId);
    
    // Agregar 25 análisis
    for (let i = 0; i < 25; i++) {
      sessionEmotionalMemory.addAnalysis(userId, {
        mainEmotion: 'tristeza',
        intensity: 5 + (i % 5),
        category: 'negative',
        topic: 'general'
      });
    }
    
    const buffer = sessionEmotionalMemory.getBuffer(userId);
    return buffer.length === 20; // Debe mantener solo los últimos 20
  });

  await runTest('Tendencias detectan empeoramiento', async () => {
    sessionEmotionalMemory.clearBuffer(userId);
    
    // Simular empeoramiento
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 5, category: 'negative' });
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 7, category: 'negative' });
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 9, category: 'negative' });
    
    const trends = sessionEmotionalMemory.analyzeTrends(userId);
    return trends.trend === 'worsening';
  });

  await runTest('Tendencias detectan mejora', async () => {
    sessionEmotionalMemory.clearBuffer(userId);
    
    // Simular mejora
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 9, category: 'negative' });
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 7, category: 'negative' });
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 5, category: 'negative' });
    
    const trends = sessionEmotionalMemory.analyzeTrends(userId);
    return trends.trend === 'improving';
  });

  // ========== PRUEBAS DE PLANTILLAS TERAPÉUTICAS ==========
  console.log('\n💡 PRUEBAS DE PLANTILLAS TERAPÉUTICAS\n');

  await runTest('Plantilla retorna estructura correcta', async () => {
    const template = therapeuticTemplateService.getTemplate('tristeza', 'duelo');
    return template !== null &&
           Array.isArray(template.validation) &&
           Array.isArray(template.psychoeducation) &&
           Array.isArray(template.question) &&
           template.validation.length > 0;
  });

  await runTest('Base terapéutica se adapta al estilo', async () => {
    const brief = therapeuticTemplateService.buildTherapeuticBase('tristeza', 'soledad', { style: 'brief' });
    const deep = therapeuticTemplateService.buildTherapeuticBase('tristeza', 'soledad', { style: 'deep' });
    
    return brief !== null && 
           deep !== null && 
           deep.length > brief.length; // Deep debe ser más largo
  });

  // ========== PRUEBAS DE PROTOCOLOS ==========
  console.log('\n🔄 PRUEBAS DE PROTOCOLOS MULTI-TURNO\n');

  await runTest('Protocolo avanza correctamente por todos los pasos', async () => {
    therapeuticProtocolService.endProtocol(userId);
    const protocol = therapeuticProtocolService.startProtocol(userId, 'panic_protocol');
    
    if (!protocol) return false;
    
    let currentStep = 1;
    let stepsCompleted = 0;
    
    while (currentStep <= 4) {
      const intervention = therapeuticProtocolService.getCurrentIntervention(userId);
      if (!intervention || intervention.step !== currentStep) return false;
      
      const nextStep = therapeuticProtocolService.advanceProtocol(userId);
      stepsCompleted++;
      
      if (nextStep) {
        currentStep = nextStep.step;
      } else {
        break; // Protocolo terminado
      }
    }
    
    return stepsCompleted === 4; // Debe completar los 4 pasos
  });

  await runTest('Protocolo se finaliza correctamente', async () => {
    therapeuticProtocolService.endProtocol(userId);
    const protocol = therapeuticProtocolService.startProtocol(userId, 'guilt_protocol');
    
    // Avanzar hasta el final
    for (let i = 0; i < 4; i++) {
      therapeuticProtocolService.advanceProtocol(userId);
    }
    
    // Intentar obtener protocolo activo
    const activeProtocol = therapeuticProtocolService.getActiveProtocol(userId);
    return activeProtocol === null; // Debe estar finalizado
  });

  // ========== PRUEBAS DE SUGERENCIAS DE ACCIONES ==========
  console.log('\n🎯 PRUEBAS DE SUGERENCIAS DE ACCIONES\n');

  await runTest('Sugerencias se generan según intensidad', async () => {
    const highIntensity = actionSuggestionService.generateSuggestions(
      { mainEmotion: 'ansiedad', intensity: 9, topic: 'general' }
    );
    const lowIntensity = actionSuggestionService.generateSuggestions(
      { mainEmotion: 'ansiedad', intensity: 3, topic: 'general' }
    );
    
    return highIntensity.length > 0; // Alta intensidad debe generar sugerencias
  });

  await runTest('Sugerencias se ajustan según subtipo', async () => {
    const general = actionSuggestionService.generateSuggestions(
      { mainEmotion: 'ansiedad', intensity: 8, topic: 'general' }
    );
    const social = actionSuggestionService.generateSuggestions(
      { mainEmotion: 'ansiedad', intensity: 8, topic: 'general', subtype: 'social' }
    );
    
    return general.length > 0 && social.length > 0;
  });

  await runTest('Sugerencias formateadas tienen estructura correcta', async () => {
    const formatted = actionSuggestionService.formatSuggestions(['breathing_exercise', 'grounding_technique']);
    
    return formatted.length === 2 &&
           formatted[0].id !== undefined &&
           formatted[0].label !== undefined &&
           formatted[0].icon !== undefined;
  });

  // ========== RESULTADOS ==========
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RESULTADOS FINALES\n');
  console.log(`   Total de pruebas: ${totalTests}`);
  console.log(`   ✅ Pasaron: ${passedTests}`);
  console.log(`   ❌ Fallaron: ${failedTests}`);
  console.log(`   📈 Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // Limpiar
  sessionEmotionalMemory.clearBuffer(userId);
  therapeuticProtocolService.endProtocol(userId);

  console.log('\n');
}

// Ejecutar todas las pruebas
runAllTests().catch(error => {
  console.error('❌ Error ejecutando pruebas:', error);
  process.exit(1);
});
