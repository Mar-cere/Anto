/**
 * Pruebas para el Detector de Subtipos Emocionales
 */
import emotionalSubtypeDetector from '../services/emotionalSubtypeDetector.js';

const testCases = [
  // Tristeza - Duelo
  {
    emotion: 'tristeza',
    content: 'Extraño mucho a mi abuela que falleció',
    expectedSubtype: 'duelo'
  },
  {
    emotion: 'tristeza',
    content: 'Echo de menos a mi perro que se fue',
    expectedSubtype: 'duelo'
  },
  
  // Tristeza - Soledad
  {
    emotion: 'tristeza',
    content: 'Me siento solo, nadie me entiende',
    expectedSubtype: 'soledad'
  },
  {
    emotion: 'tristeza',
    content: 'Estoy desconectado de todos',
    expectedSubtype: 'soledad'
  },
  
  // Tristeza - Fracaso
  {
    emotion: 'tristeza',
    content: 'Soy un fracaso, no puedo hacer nada bien',
    expectedSubtype: 'fracaso'
  },
  {
    emotion: 'tristeza',
    content: 'No sirvo para nada, siempre fallo',
    expectedSubtype: 'fracaso'
  },
  
  // Ansiedad - Social
  {
    emotion: 'ansiedad',
    content: 'Tengo miedo de hablar en público, me juzgan',
    expectedSubtype: 'social'
  },
  {
    emotion: 'ansiedad',
    content: 'Me da ansiedad social cuando estoy con mucha gente',
    expectedSubtype: 'social'
  },
  
  // Ansiedad - Anticipatoria
  {
    emotion: 'ansiedad',
    content: 'Me preocupa mucho lo que puede pasar mañana',
    expectedSubtype: 'anticipatoria'
  },
  {
    emotion: 'ansiedad',
    content: 'Tengo ansiedad por el futuro',
    expectedSubtype: 'anticipatoria'
  },
  
  // Enojo - Injusticia
  {
    emotion: 'enojo',
    content: 'No es justo cómo me trataron',
    expectedSubtype: 'injusticia'
  },
  {
    emotion: 'enojo',
    content: 'Me hicieron daño injustamente',
    expectedSubtype: 'injusticia'
  },
  
  // Enojo - Frustración
  {
    emotion: 'enojo',
    content: 'Estoy frustrado, nada me sale bien',
    expectedSubtype: 'frustración'
  },
  {
    emotion: 'enojo',
    content: 'No puedo hacerlo, estoy frustrado',
    expectedSubtype: 'frustración'
  },
  
  // Culpa - Autoculpa
  {
    emotion: 'culpa',
    content: 'Todo es mi culpa, siempre arruino todo',
    expectedSubtype: 'autoculpa'
  },
  {
    emotion: 'culpa',
    content: 'Soy el problema, la culpa es mía',
    expectedSubtype: 'autoculpa'
  },
  
  // Alegría - Logro
  {
    emotion: 'alegria',
    content: 'Logré completar mi meta',
    expectedSubtype: 'logro'
  },
  {
    emotion: 'alegria',
    content: 'Conseguí el trabajo que quería',
    expectedSubtype: 'logro'
  },
  
  // Alegría - Gratitud
  {
    emotion: 'alegria',
    content: 'Estoy agradecido por todo lo que tengo',
    expectedSubtype: 'gratitud'
  },
  {
    emotion: 'alegria',
    content: 'Tengo mucha gratitud en mi vida',
    expectedSubtype: 'gratitud'
  }
];

console.log('🧪 Ejecutando pruebas de Detector de Subtipos Emocionales...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = emotionalSubtypeDetector.detectSubtype(
    testCase.emotion,
    testCase.content
  );
  
  const success = result === testCase.expectedSubtype;
  
  if (success) {
    passed++;
    console.log(`✅ Caso ${index + 1}: ${testCase.emotion} - "${testCase.content.substring(0, 50)}..."`);
    console.log(`   Subtipo detectado: ${result}\n`);
  } else {
    failed++;
    console.log(`❌ Caso ${index + 1}: ${testCase.emotion} - "${testCase.content.substring(0, 50)}..."`);
    console.log(`   Esperado: ${testCase.expectedSubtype}`);
    console.log(`   Obtenido: ${result || 'null'}\n`);
  }
});

console.log(`\n📊 Resultados:`);
console.log(`   ✅ Pasaron: ${passed}`);
console.log(`   ❌ Fallaron: ${failed}`);
console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);

