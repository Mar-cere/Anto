/**
 * Pruebas para el Detector de Temas
 */
import topicDetector from '../services/topicDetector.js';

const testCases = [
  {
    content: 'Mi pareja y yo tuvimos una discusión',
    expectedTopic: 'relaciones'
  },
  {
    content: 'Mi jefe me está presionando mucho en el trabajo',
    expectedTopic: 'trabajo'
  },
  {
    content: 'Me duele mucho la cabeza últimamente',
    expectedTopic: 'salud'
  },
  {
    content: 'No me gusta cómo me veo en el espejo',
    expectedTopic: 'autoimagen'
  },
  {
    content: 'Me preocupa qué pasará en el futuro',
    expectedTopic: 'futuro'
  },
  {
    content: 'Recuerdo cuando era más feliz',
    expectedTopic: 'pasado'
  },
  {
    content: 'Me siento solo, sin nadie con quien hablar',
    expectedTopic: 'soledad'
  },
  {
    content: 'Mi abuela falleció hace un mes',
    expectedTopic: 'pérdida'
  },
  {
    content: 'No tengo dinero para pagar las cuentas',
    expectedTopic: 'dinero'
  },
  {
    content: 'No sé qué hacer con mi vida',
    expectedTopic: 'general'
  }
];

console.log('🧪 Ejecutando pruebas de Detector de Temas...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = topicDetector.detectTopic(testCase.content);
  
  const success = result === testCase.expectedTopic;
  
  if (success) {
    passed++;
    console.log(`✅ Caso ${index + 1}: "${testCase.content.substring(0, 50)}..."`);
    console.log(`   Tema detectado: ${result}\n`);
  } else {
    failed++;
    console.log(`❌ Caso ${index + 1}: "${testCase.content.substring(0, 50)}..."`);
    console.log(`   Esperado: ${testCase.expectedTopic}`);
    console.log(`   Obtenido: ${result}\n`);
  }
});

console.log(`\n📊 Resultados:`);
console.log(`   ✅ Pasaron: ${passed}`);
console.log(`   ❌ Fallaron: ${failed}`);
console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);

