/**
 * Pruebas End-to-End del Flujo Completo v2.0
 * 
 * Valida el flujo completo desde el mensaje del usuario hasta la respuesta,
 * incluyendo todas las mejoras v2.0:
 * - Detección de subtipos emocionales
 * - Detección de temas
 * - Memoria emocional de sesión
 * - Plantillas terapéuticas
 * - Protocolos multi-turno
 * - Chequeos de seguridad
 * - Respuestas con elecciones
 * - Sugerencias de acciones
 */

import emotionalAnalyzer from '../services/emotionalAnalyzer.js';
import emotionalSubtypeDetector from '../services/emotionalSubtypeDetector.js';
import topicDetector from '../services/topicDetector.js';
import sessionEmotionalMemory from '../services/sessionEmotionalMemory.js';
import therapeuticTemplateService from '../services/therapeuticTemplateService.js';
import therapeuticProtocolService from '../services/therapeuticProtocolService.js';
import actionSuggestionService from '../services/actionSuggestionService.js';
import contextAnalyzer from '../services/contextAnalyzer.js';

// Función principal async para ejecutar todas las pruebas
async function runAllTests() {
  const userId = 'test-user-e2e-' + Date.now();

  // Limpiar estado antes de empezar
  sessionEmotionalMemory.clearBuffer(userId);
  therapeuticProtocolService.endProtocol(userId);

  console.log('🧪 Ejecutando Pruebas End-to-End del Flujo Completo v2.0...\n');
  console.log('='.repeat(80));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Helper para ejecutar pruebas (async)
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

  // ========== PRUEBAS DE DETECCIÓN ==========
  console.log('\n📊 PRUEBAS DE DETECCIÓN\n');

  await runTest('Detección de emoción principal', async () => {
    const analysis = await emotionalAnalyzer.analyzeEmotion('Me siento muy triste');
    return analysis.mainEmotion === 'tristeza' && analysis.intensity >= 7;
  });

  await runTest('Detección de subtipo emocional', async () => {
    const subtype = emotionalSubtypeDetector.detectSubtype('tristeza', 'Extraño mucho a mi abuela que falleció');
    return subtype === 'duelo';
  });

  await runTest('Detección de tema', async () => {
    const topic = topicDetector.detectTopic('Mi pareja y yo tuvimos una discusión');
    return topic === 'relaciones';
  });

  await runTest('Análisis emocional incluye subtipo y tema', async () => {
    const analysis = await emotionalAnalyzer.analyzeEmotion('Me siento solo, nadie me entiende');
    return analysis.subtype !== undefined && 
           analysis.topic !== undefined && 
           analysis.topics !== undefined;
  });

  // ========== PRUEBAS DE MEMORIA DE SESIÓN ==========
  console.log('\n🧠 PRUEBAS DE MEMORIA DE SESIÓN\n');

  await runTest('Agregar análisis a memoria de sesión', async () => {
    const analysis = await emotionalAnalyzer.analyzeEmotion('Estoy muy ansioso');
    sessionEmotionalMemory.addAnalysis(userId, analysis);
    const buffer = sessionEmotionalMemory.getBuffer(userId);
    return buffer.length === 1 && buffer[0].mainEmotion === 'ansiedad';
  });

  await runTest('Análisis de tendencias de sesión', async () => {
    // Agregar múltiples análisis
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 7, category: 'negative', topic: 'relaciones' });
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 8, category: 'negative', topic: 'relaciones' });
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'ansiedad', intensity: 6, category: 'negative', topic: 'trabajo' });
    
    const trends = sessionEmotionalMemory.analyzeTrends(userId);
    return trends.messageCount >= 3 && 
           trends.dominantEmotion !== null &&
           trends.averageIntensity > 0;
  });

  await runTest('Detección de racha negativa', async () => {
    sessionEmotionalMemory.clearBuffer(userId);
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 7, category: 'negative' });
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'ansiedad', intensity: 8, category: 'negative' });
    sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'enojo', intensity: 7, category: 'negative' });
    
    const trends = sessionEmotionalMemory.analyzeTrends(userId);
    return trends.streakNegative >= 3;
  });

  // ========== PRUEBAS DE PLANTILLAS TERAPÉUTICAS ==========
  console.log('\n💡 PRUEBAS DE PLANTILLAS TERAPÉUTICAS\n');

  await runTest('Obtener plantilla para emoción + subtipo', async () => {
    const template = therapeuticTemplateService.getTemplate('tristeza', 'duelo');
    return template !== null && 
           template.validation !== undefined &&
           template.psychoeducation !== undefined &&
           template.question !== undefined;
  });

  await runTest('Construir base terapéutica', async () => {
    const base = therapeuticTemplateService.buildTherapeuticBase('tristeza', 'soledad', { style: 'brief' });
    return base !== null && base.length > 0;
  });

  await runTest('Plantilla retorna null para combinación inexistente', async () => {
    const template = therapeuticTemplateService.getTemplate('alegria', 'inexistente');
    return template === null;
  });

  // ========== PRUEBAS DE PROTOCOLOS MULTI-TURNO ==========
  console.log('\n🔄 PRUEBAS DE PROTOCOLOS MULTI-TURNO\n');

  await runTest('Iniciar protocolo de pánico', async () => {
    const protocol = therapeuticProtocolService.startProtocol(userId, 'panic_protocol');
    return protocol !== null && 
           protocol.currentStep === 1 &&
           protocol.protocolName === 'panic_protocol';
  });

  await runTest('Obtener intervención actual del protocolo', async () => {
    const intervention = therapeuticProtocolService.getCurrentIntervention(userId);
    return intervention !== null && 
           intervention.step === 1 &&
           intervention.name !== undefined;
  });

  await runTest('Avanzar protocolo al siguiente paso', async () => {
    const nextStep = therapeuticProtocolService.advanceProtocol(userId);
    return nextStep !== null && nextStep.step === 2;
  });

  await runTest('Detectar cuándo iniciar protocolo', async () => {
    const shouldStart = therapeuticProtocolService.shouldStartProtocol(
      { mainEmotion: 'ansiedad', intensity: 9, subtype: 'anticipatoria' },
      { intencion: { tipo: 'CRISIS' } }
    );
    return shouldStart === 'panic_protocol';
  });

  // ========== PRUEBAS DE SUGERENCIAS DE ACCIONES ==========
  console.log('\n🎯 PRUEBAS DE SUGERENCIAS DE ACCIONES\n');

  await runTest('Generar sugerencias para ansiedad alta', async () => {
    const suggestions = actionSuggestionService.generateSuggestions(
      { mainEmotion: 'ansiedad', intensity: 9, topic: 'general' }
    );
    return suggestions.length > 0 && suggestions.length <= 3;
  });

  await runTest('Generar sugerencias para tristeza con tema específico', async () => {
    const suggestions = actionSuggestionService.generateSuggestions(
      { mainEmotion: 'tristeza', intensity: 8, topic: 'relaciones' }
    );
    return suggestions.length > 0;
  });

  await runTest('Formatear sugerencias para UI', async () => {
    const formatted = actionSuggestionService.formatSuggestions(['breathing_exercise', 'grounding_technique']);
    return formatted.length === 2 && 
           formatted[0].label !== undefined &&
           formatted[0].icon !== undefined;
  });

  // ========== PRUEBAS DE FLUJO COMPLETO ==========
  console.log('\n🔄 PRUEBAS DE FLUJO COMPLETO\n');

  await runTest('Flujo completo: Mensaje -> Análisis -> Memoria -> Sugerencias', async () => {
    const content = 'Me siento muy triste y solo, mi pareja me dejó';
    
    // 1. Análisis emocional
    const analysis = await emotionalAnalyzer.analyzeEmotion(content);
    if (!analysis || !analysis.mainEmotion) return { success: false, error: 'Análisis emocional falló' };
    
    // 2. Agregar a memoria
    sessionEmotionalMemory.addAnalysis(userId, analysis);
    
    // 3. Obtener tendencias
    const trends = sessionEmotionalMemory.analyzeTrends(userId);
    if (!trends) return { success: false, error: 'Tendencias no disponibles' };
    
    // 4. Generar sugerencias
    const suggestions = actionSuggestionService.generateSuggestions(analysis);
    if (suggestions.length === 0) return { success: false, error: 'No se generaron sugerencias' };
    
    return {
      success: true,
      details: `Emoción: ${analysis.mainEmotion}, Subtipo: ${analysis.subtype || 'N/A'}, Tema: ${analysis.topic}, Sugerencias: ${suggestions.length}`
    };
  });

  await runTest('Flujo completo con protocolo: Detección -> Inicio -> Avance', async () => {
    const content = 'Estoy teniendo un ataque de pánico, no puedo respirar';
    
    // 1. Análisis
    const analysis = await emotionalAnalyzer.analyzeEmotion(content);
    
    // 2. Análisis contextual (pasar content en el objeto)
    const contextual = await contextAnalyzer.analizarMensaje({ content }, []);
    // Agregar content al contextual para que shouldStartProtocol pueda usarlo
    contextual.content = content;
    
    // 3. Verificar si debe iniciar protocolo
    const protocolToStart = therapeuticProtocolService.shouldStartProtocol(analysis, contextual);
    
    if (protocolToStart) {
      // 4. Iniciar protocolo
      const protocol = therapeuticProtocolService.startProtocol(userId + '-protocol', protocolToStart);
      if (!protocol) return { success: false, error: 'No se pudo iniciar protocolo' };
      
      // 5. Obtener intervención actual
      const intervention = therapeuticProtocolService.getCurrentIntervention(userId + '-protocol');
      if (!intervention) return { success: false, error: 'No se obtuvo intervención' };
      
      return {
        success: true,
        details: `Protocolo iniciado: ${protocol.protocolName}, Paso: ${intervention.step}`
      };
    }
    
    return { 
      success: false, 
      error: `No se detectó necesidad de protocolo. Emoción: ${analysis.mainEmotion}, Intensidad: ${analysis.intensity}, Subtipo: ${analysis.subtype}` 
    };
  });

  await runTest('Flujo completo con plantilla terapéutica', async () => {
    const content = 'Extraño mucho a mi abuela que falleció hace un mes';
    
    // 1. Análisis
    const analysis = await emotionalAnalyzer.analyzeEmotion(content);
    
    // 2. Obtener plantilla
    if (analysis.subtype) {
      const template = therapeuticTemplateService.getTemplate(analysis.mainEmotion, analysis.subtype);
      if (!template) return { success: false, error: 'No se encontró plantilla' };
      
      // 3. Construir base
      const base = therapeuticTemplateService.buildTherapeuticBase(
        analysis.mainEmotion,
        analysis.subtype,
        { style: 'balanced' }
      );
      
      if (!base || base.length === 0) return { success: false, error: 'No se construyó base' };
      
      return {
        success: true,
        details: `Plantilla encontrada y base construida para ${analysis.mainEmotion} - ${analysis.subtype}`
      };
    }
    
    // Si no se detectó subtipo automáticamente, intentar detectarlo manualmente
    const manualSubtype = emotionalSubtypeDetector.detectSubtype(analysis.mainEmotion, content);
    if (manualSubtype) {
      const template = therapeuticTemplateService.getTemplate(analysis.mainEmotion, manualSubtype);
      if (template) {
        return {
          success: true,
          details: `Plantilla encontrada manualmente para ${analysis.mainEmotion} - ${manualSubtype}`
        };
      }
    }
    
    return { 
      success: false, 
      error: `No se detectó subtipo. Emoción: ${analysis.mainEmotion}, Subtipo detectado: ${analysis.subtype}, Manual: ${manualSubtype}` 
    };
  });

  // ========== PRUEBAS DE INTEGRACIÓN ==========
  console.log('\n🔗 PRUEBAS DE INTEGRACIÓN\n');

  await runTest('Integración: Análisis completo con todos los campos v2.0', async () => {
    const content = 'Me siento muy ansioso por mi presentación de mañana, tengo miedo de fallar';
    
    const analysis = await emotionalAnalyzer.analyzeEmotion(content);
    
    // Verificar que todos los campos v2.0 estén presentes
    const hasAllFields = 
      analysis.mainEmotion !== undefined &&
      analysis.intensity !== undefined &&
      analysis.category !== undefined &&
      analysis.subtype !== undefined &&
      analysis.topic !== undefined &&
      analysis.topics !== undefined &&
      Array.isArray(analysis.topics);
    
    return {
      success: hasAllFields,
      details: hasAllFields ? 
        `Todos los campos presentes: emoción=${analysis.mainEmotion}, subtipo=${analysis.subtype}, tema=${analysis.topic}` :
        'Faltan campos en el análisis'
    };
  });

  await runTest('Integración: Memoria de sesión con múltiples mensajes', async () => {
    sessionEmotionalMemory.clearBuffer(userId + '-integration');
    
    const messages = [
      'Me siento triste',
      'Estoy muy triste',
      'Me siento ansioso',
      'Estoy mejor ahora'
    ];
    
    for (const msg of messages) {
      const analysis = await emotionalAnalyzer.analyzeEmotion(msg);
      sessionEmotionalMemory.addAnalysis(userId + '-integration', analysis);
    }
    
    const trends = sessionEmotionalMemory.analyzeTrends(userId + '-integration');
    
    return {
      success: trends.messageCount === messages.length && trends.dominantEmotion !== null,
      details: `Procesados ${trends.messageCount} mensajes, emoción dominante: ${trends.dominantEmotion}`
    };
  });

  // ========== RESULTADOS FINALES ==========
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RESULTADOS FINALES\n');
  console.log(`   Total de pruebas: ${totalTests}`);
  console.log(`   ✅ Pasaron: ${passedTests}`);
  console.log(`   ❌ Fallaron: ${failedTests}`);
  console.log(`   📈 Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! El sistema v2.0 está funcionando correctamente.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
  }

  // Limpiar estado después de las pruebas
  sessionEmotionalMemory.clearBuffer(userId);
  therapeuticProtocolService.endProtocol(userId);
  therapeuticProtocolService.endProtocol(userId + '-protocol');
  sessionEmotionalMemory.clearBuffer(userId + '-integration');

  console.log('\n');
  return failedTests > 0 ? 1 : 0;
}

// Ejecutar todas las pruebas (código de salida distinto de 0 si falla alguna aserción — útil en CI)
runAllTests()
  .then((exitCode) => process.exit(exitCode ?? 0))
  .catch((error) => {
    console.error('❌ Error ejecutando pruebas:', error);
    process.exit(1);
  });
