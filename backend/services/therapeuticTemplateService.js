/**
 * Servicio de Plantillas Terapéuticas por Emoción + Subtipo
 * Proporciona plantillas estructuradas para respuestas terapéuticas
 * basadas en la emoción principal y su subtipo detectado
 */
import { selectAppropriateTechnique } from '../constants/therapeuticTechniques.js';

class TherapeuticTemplateService {
  constructor() {
    // Plantillas base por emoción + subtipo
    this.templates = {
      tristeza: {
        duelo: {
          validation: [
            'Entiendo que estás pasando por un momento de pérdida. El duelo es un proceso natural y necesario.',
            'Es completamente normal sentir tristeza cuando perdemos a alguien o algo importante.',
            'Tu dolor es válido. No hay una forma "correcta" de sentir el duelo.'
          ],
          psychoeducation: [
            'El duelo tiene diferentes etapas y cada persona las vive a su ritmo.',
            'Es importante permitirte sentir todas las emociones que vienen con la pérdida.',
            'El tiempo y el apoyo son fundamentales en el proceso de duelo.'
          ],
          question: [
            '¿Qué te gustaría recordar o compartir sobre lo que perdiste?',
            '¿Hay algo específico que te está costando más en este momento?',
            '¿Tienes personas cercanas con las que puedas hablar sobre esto?'
          ]
        },
        soledad: {
          validation: [
            'La soledad puede ser muy dolorosa. Es válido que te sientas así.',
            'Sentirse solo no significa que estés realmente solo, pero el sentimiento es real.',
            'La soledad es una emoción humana común, especialmente en momentos difíciles.'
          ],
          psychoeducation: [
            'La soledad puede venir de desconexión emocional, no solo física.',
            'A veces necesitamos conexión profunda, no solo compañía superficial.',
            'Es importante distinguir entre estar solo (físicamente) y sentirse solo (emocionalmente).'
          ],
          question: [
            '¿Qué tipo de conexión sientes que te falta?',
            '¿Hay alguien con quien te gustaría acercarte más?',
            '¿Qué te gustaría que otros entendieran sobre cómo te sientes?'
          ]
        },
        fracaso: {
          validation: [
            'Es difícil cuando las cosas no salen como esperábamos. Tu frustración es comprensible.',
            'Sentirse como un fracaso no significa que lo seas. Los sentimientos no son hechos.',
            'Es normal sentirse desanimado cuando algo no funciona como planeaste.'
          ],
          psychoeducation: [
            'El "fracaso" es parte del aprendizaje y crecimiento.',
            'Una situación que no salió bien no define tu valor como persona.',
            'Muchos logros importantes vienen después de intentos que no funcionaron.'
          ],
          question: [
            '¿Qué aprendiste de esta situación?',
            '¿Qué harías diferente si tuvieras otra oportunidad?',
            '¿Hay algo positivo, por pequeño que sea, que puedas rescatar de esta experiencia?'
          ]
        },
        desesperanza: {
          validation: [
            'Cuando no vemos salida, es natural sentir desesperanza. Tu sentimiento es válido.',
            'La desesperanza puede hacer que todo se vea oscuro, pero no significa que no haya luz.',
            'Es comprensible que te sientas así cuando las cosas se ven difíciles.'
          ],
          psychoeducation: [
            'La desesperanza es una emoción temporal, aunque no lo parezca.',
            'Nuestro cerebro a veces nos engaña haciéndonos creer que las cosas nunca cambiarán.',
            'Pequeños pasos pueden abrir nuevas posibilidades que no vemos desde donde estamos.'
          ],
          question: [
            '¿Ha habido momentos en el pasado donde pensaste que no había salida y luego las cosas cambiaron?',
            '¿Qué sería diferente si tuvieras un poco más de esperanza?',
            '¿Hay algo pequeño que podrías hacer hoy que te acerque a sentirte mejor?'
          ]
        },
        vacío: {
          validation: [
            'El vacío interior puede ser muy desconcertante. Es válido que te sientas así.',
            'Sentirse vacío no significa que no tengas valor o propósito.',
            'Este sentimiento de vacío es real y merece atención.'
          ],
          psychoeducation: [
            'El vacío puede venir de desconexión con uno mismo o con lo que da sentido a la vida.',
            'A veces necesitamos explorar qué nos llena y qué nos conecta con el significado.',
            'El vacío puede ser una señal de que necesitamos reconectar con nuestros valores.'
          ],
          question: [
            '¿Qué solía darte sentido o propósito?',
            '¿Hay algo que te gustaría explorar o probar?',
            '¿Qué te gustaría que llenara ese vacío?'
          ]
        },
        rechazo: {
          validation: [
            'El rechazo duele profundamente. Es natural sentirse herido cuando alguien nos rechaza.',
            'Sentirse rechazado puede activar heridas antiguas. Tu dolor es válido.',
            'El rechazo puede hacer que cuestionemos nuestro valor, pero no lo define.'
          ],
          psychoeducation: [
            'El rechazo de una persona no refleja tu valor como ser humano.',
            'A veces el rechazo dice más sobre la otra persona que sobre ti.',
            'Todos experimentamos rechazo en algún momento; es parte de la vida humana.'
          ],
          question: [
            '¿Qué te dice este rechazo sobre ti mismo?',
            '¿Hay otras personas en tu vida que sí te valoran y aceptan?',
            '¿Cómo podrías cuidarte en este momento?'
          ]
        }
      },
      ansiedad: {
        social: {
          validation: [
            'La ansiedad social puede ser muy limitante. Es válido que te sientas así.',
            'Sentirse ansioso en situaciones sociales es más común de lo que piensas.',
            'Tu ansiedad social es real y merece comprensión, no juicio.'
          ],
          psychoeducation: [
            'La ansiedad social viene del miedo a ser juzgado o rechazado.',
            'Muchas personas experimentan ansiedad social, incluso quienes parecen seguros.',
            'La ansiedad social puede mejorar con práctica y técnicas específicas.'
          ],
          question: [
            '¿Qué es lo que más te preocupa en situaciones sociales?',
            '¿Hay situaciones sociales específicas que te generan más ansiedad?',
            '¿Qué te ayudaría a sentirte más cómodo en situaciones sociales?'
          ]
        },
        anticipatoria: {
          validation: [
            'La ansiedad por el futuro puede ser abrumadora. Es comprensible que te sientas así.',
            'Preocuparse por lo que puede pasar es natural, aunque puede volverse excesivo.',
            'Tu ansiedad anticipatoria es válida, aunque a veces nos hace sufrir por cosas que no pasarán.'
          ],
          psychoeducation: [
            'La ansiedad anticipatoria es preocuparse por eventos futuros que pueden no ocurrir.',
            'Nuestro cerebro a veces nos prepara para peligros que no existen.',
            'Vivir en el presente puede ayudar a reducir la ansiedad por el futuro.'
          ],
          question: [
            '¿Qué es lo peor que podría pasar? ¿Y lo más probable?',
            '¿Has sobrevivido a situaciones difíciles antes?',
            '¿Qué te ayudaría a enfocarte más en el presente?'
          ]
        },
        rendimiento: {
          validation: [
            'La presión por rendir bien puede generar mucha ansiedad. Es válido que te sientas así.',
            'Sentirse ansioso por el rendimiento es común, especialmente cuando algo es importante para ti.',
            'Tu ansiedad por el rendimiento muestra que te importa, aunque puede ser paralizante.'
          ],
          psychoeducation: [
            'Un poco de ansiedad puede mejorar el rendimiento, pero demasiada lo perjudica.',
            'El perfeccionismo y el miedo al fracaso suelen estar detrás de la ansiedad por rendimiento.',
            'El valor no está solo en los resultados, sino también en el esfuerzo y el proceso.'
          ],
          question: [
            '¿Qué pasaría si no cumplieras con tus expectativas?',
            '¿Qué te dirías a ti mismo si fueras tu mejor amigo?',
            '¿Cómo podrías prepararte de manera que reduzcas la ansiedad?'
          ]
        }
      },
      enojo: {
        injusticia: {
          validation: [
            'Es natural sentir enojo cuando percibes injusticia. Tu reacción es comprensible.',
            'El enojo por injusticia muestra que tienes valores y principios.',
            'Sentirse enojado por ser tratado injustamente es una respuesta válida.'
          ],
          psychoeducation: [
            'El enojo puede ser una señal de que algo importante para ti fue vulnerado.',
            'Expresar el enojo de manera constructiva puede ser más efectivo que reprimirlo.',
            'A veces necesitamos establecer límites para proteger nuestros valores.'
          ],
          question: [
            '¿Qué es lo que más te molesta de esta situación?',
            '¿Qué necesitarías para sentir que se hizo justicia?',
            '¿Cómo podrías expresar tu enojo de manera que te ayude en lugar de perjudicarte?'
          ]
        },
        frustración: {
          validation: [
            'La frustración es agotadora. Es válido que te sientas así cuando las cosas no salen.',
            'Sentirse frustrado cuando algo no funciona es completamente normal.',
            'Tu frustración muestra que te importa y que estás intentando.'
          ],
          psychoeducation: [
            'La frustración viene de la brecha entre lo que esperamos y lo que obtenemos.',
            'A veces necesitamos ajustar nuestras expectativas o nuestro enfoque.',
            'La frustración puede ser una señal de que necesitamos un descanso o un cambio de estrategia.'
          ],
          question: [
            '¿Qué está dentro de tu control en esta situación?',
            '¿Hay otra forma de abordar esto?',
            '¿Qué te ayudaría a sentir menos frustración?'
          ]
        }
      }
    };
  }

  /**
   * Obtiene una plantilla terapéutica para una emoción + subtipo
   * @param {string} emotion - Emoción principal
   * @param {string} subtype - Subtipo emocional
   * @returns {Object|null} Plantilla con validation, psychoeducation y question
   */
  getTemplate(emotion, subtype) {
    if (!emotion || !subtype) {
      return null;
    }

    const emotionTemplates = this.templates[emotion];
    if (!emotionTemplates) {
      return null;
    }

    return emotionTemplates[subtype] || null;
  }

  /**
   * Construye una base de respuesta terapéutica usando la plantilla
   * @param {string} emotion - Emoción principal
   * @param {string} subtype - Subtipo emocional
   * @param {Object} options - Opciones adicionales
   * @returns {string} Base de respuesta estructurada
   */
  buildTherapeuticBase(emotion, subtype, options = {}) {
    const template = this.getTemplate(emotion, subtype);
    
    if (!template) {
      return null; // No hay plantilla específica, usar selección normal
    }

    const { style = 'balanced' } = options;
    
    // Seleccionar frases según el estilo
    const validation = this.selectPhrase(template.validation, style);
    const psychoeducation = this.selectPhrase(template.psychoeducation, style);
    const question = this.selectPhrase(template.question, style);

    // Construir base según estilo
    if (style === 'brief') {
      return `${validation} ${question}`;
    } else if (style === 'deep') {
      return `${validation}\n\n${psychoeducation}\n\n${question}`;
    } else {
      // balanced (default)
      return `${validation} ${psychoeducation}\n\n${question}`;
    }
  }

  /**
   * Selecciona una frase de un array según el estilo
   * @param {Array} phrases - Array de frases
   * @param {string} style - Estilo de respuesta
   * @returns {string} Frase seleccionada
   */
  selectPhrase(phrases, style) {
    if (!phrases || phrases.length === 0) {
      return '';
    }

    // Para estilo breve, usar frases más cortas
    if (style === 'brief') {
      const shortPhrases = phrases.filter(p => p.length < 100);
      if (shortPhrases.length > 0) {
        return shortPhrases[Math.floor(Math.random() * shortPhrases.length)];
      }
    }

    // Selección aleatoria para otros estilos
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

export default new TherapeuticTemplateService();

