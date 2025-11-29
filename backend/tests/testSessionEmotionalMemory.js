/**
 * Pruebas para la Memoria Emocional de Sesión
 */
import sessionEmotionalMemory from '../services/sessionEmotionalMemory.js';

console.log('🧪 Ejecutando pruebas de Memoria Emocional de Sesión...\n');

const userId = 'test-user-123';

// Limpiar buffer antes de empezar
sessionEmotionalMemory.clearBuffer(userId);

// Simular una sesión con diferentes emociones
const testAnalyses = [
  { mainEmotion: 'tristeza', intensity: 7, category: 'negative', topic: 'relaciones' },
  { mainEmotion: 'tristeza', intensity: 8, category: 'negative', topic: 'relaciones' },
  { mainEmotion: 'ansiedad', intensity: 6, category: 'negative', topic: 'trabajo' },
  { mainEmotion: 'tristeza', intensity: 9, category: 'negative', topic: 'relaciones' },
  { mainEmotion: 'alegria', intensity: 5, category: 'positive', topic: 'general' },
];

console.log('📝 Agregando análisis emocionales...');
testAnalyses.forEach((analysis, index) => {
  sessionEmotionalMemory.addAnalysis(userId, analysis);
  console.log(`   ${index + 1}. ${analysis.mainEmotion} (intensidad: ${analysis.intensity})`);
});

console.log('\n📊 Analizando tendencias...');
const trends = sessionEmotionalMemory.analyzeTrends(userId);

console.log(`   Racha negativa: ${trends.streakNegative}`);
console.log(`   Racha de ansiedad: ${trends.streakAnxiety}`);
console.log(`   Racha de tristeza: ${trends.streakSadness}`);
console.log(`   Temas recientes: ${trends.recentTopics.join(', ') || 'ninguno'}`);
console.log(`   Volatilidad emocional: ${trends.emotionalVolatility.toFixed(2)}`);
console.log(`   Intensidad promedio: ${trends.averageIntensity.toFixed(2)}`);
console.log(`   Emoción dominante: ${trends.dominantEmotion}`);
console.log(`   Tendencia: ${trends.trend}`);
console.log(`   Total de mensajes: ${trends.messageCount}`);

// Verificar resultados esperados
let passed = 0;
let failed = 0;

if (trends.messageCount === testAnalyses.length) {
  passed++;
  console.log('\n✅ Test 1: Número de mensajes correcto');
} else {
  failed++;
  console.log(`\n❌ Test 1: Esperado ${testAnalyses.length}, obtenido ${trends.messageCount}`);
}

if (trends.dominantEmotion === 'tristeza') {
  passed++;
  console.log('✅ Test 2: Emoción dominante correcta');
} else {
  failed++;
  console.log(`❌ Test 2: Esperado 'tristeza', obtenido '${trends.dominantEmotion}'`);
}

if (trends.streakNegative >= 3) {
  passed++;
  console.log('✅ Test 3: Racha negativa detectada correctamente');
} else {
  failed++;
  console.log(`❌ Test 3: Racha negativa menor a la esperada (${trends.streakNegative})`);
}

if (trends.recentTopics.includes('relaciones')) {
  passed++;
  console.log('✅ Test 4: Temas recientes detectados correctamente');
} else {
  failed++;
  console.log('❌ Test 4: No se detectó el tema esperado');
}

console.log(`\n📊 Resultados:`);
console.log(`   ✅ Pasaron: ${passed}`);
console.log(`   ❌ Fallaron: ${failed}`);
console.log(`   📈 Tasa de éxito: ${((passed / 4) * 100).toFixed(1)}%`);

// Limpiar después de las pruebas
sessionEmotionalMemory.clearBuffer(userId);

