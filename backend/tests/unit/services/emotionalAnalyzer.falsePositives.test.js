/**
 * Regresión: keywords cortos sin límites de palabra no deben disparar emociones
 * por subcadena (p. ej. pena⊂apenas, ira⊂respirar).
 */
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import topicDetector from '../../../services/topicDetector.js';

describe('emotionalAnalyzer — falsos positivos por subcadena', () => {
  const cases = [
    {
      name: 'apenas no es vergüenza',
      text: 'Últimamente las mañanas son lo más difícil del día. Me cuesta arrancar y me siento pesado apenas despierto.',
      notEmotion: 'verguenza',
    },
    {
      name: 'respirar / inspirar / mentira / admirar no son enojo',
      texts: [
        'Me cuesta respirar cuando corro.',
        'Voy a inspirar aire fresco.',
        'Eso es una mentira.',
        'Mi admiración por ella creció.',
        'Quiero aspirar a algo mejor.',
      ],
      notEmotion: 'enojo',
    },
    {
      name: 'disculpas no es culpa',
      text: 'Te pido disculpas por llegar tarde.',
      notEmotion: 'culpa',
    },
    {
      name: 'pavorreal / territorio no son miedo',
      texts: ['El pavorreal está en el jardín.', 'Vivo en otro territorio.'],
      notEmotion: 'miedo',
    },
  ];

  it('rechaza falsos positivos conocidos', async () => {
    for (const c of cases) {
      const texts = c.texts || [c.text];
      for (const text of texts) {
        const result = await emotionalAnalyzer.analyzeEmotion(text);
        expect(result.mainEmotion).not.toBe(c.notEmotion);
      }
    }
  });

  it('sigue detectando las emociones explícitas correctas', async () => {
    expect((await emotionalAnalyzer.analyzeEmotion('me da mucha pena lo ocurrido')).mainEmotion).toBe(
      'verguenza',
    );
    expect((await emotionalAnalyzer.analyzeEmotion('siento mucha ira por lo que pasó')).mainEmotion).toBe(
      'enojo',
    );
    expect((await emotionalAnalyzer.analyzeEmotion('tengo rabia acumulada')).mainEmotion).toBe('enojo');
    expect((await emotionalAnalyzer.analyzeEmotion('es mi culpa lo que pasó')).mainEmotion).toBe('culpa');
    expect((await emotionalAnalyzer.analyzeEmotion('tengo mucho miedo')).mainEmotion).toBe('miedo');
  });
});

describe('topicDetector — falsos positivos por subcadena', () => {
  it('no marca Futuro por «las mañanas» (hora del día)', () => {
    const topic = topicDetector.detectTopic(
      'Últimamente las mañanas son lo más difícil del día. Me cuesta arrancar y me siento pesado apenas despierto.',
    );
    expect(topic).not.toBe('futuro');
  });

  it('sí detecta futuro cuando habla del mañana / planes', () => {
    expect(topicDetector.detectTopic('Tengo miedo al futuro y no sé qué pasará')).toBe('futuro');
    expect(topicDetector.detectTopic('Mañana tengo una entrevista importante')).toBe('futuro');
  });

  it('no marca futuro por planta / metal', () => {
    expect(topicDetector.detectTopic('Regué la planta esta tarde')).not.toBe('futuro');
    expect(topicDetector.detectTopic('La mesa es de metal')).not.toBe('futuro');
  });
});
