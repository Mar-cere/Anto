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
            'Tu dolor es válido. No hay una forma "correcta" de sentir el duelo.',
            'Lo que estás sintiendo tiene sentido para lo que has vivido; no estás exagerando.',
            'Cuando algo importante se pierde, el impacto emocional puede sentirse muy profundo y real.'
          ],
          psychoeducation: [
            'El duelo tiene diferentes etapas y cada persona las vive a su ritmo.',
            'Es importante permitirte sentir todas las emociones que vienen con la pérdida.',
            'El tiempo y el apoyo son fundamentales en el proceso de duelo.',
            'El duelo no siempre es lineal: hay días de mayor alivio y otros de mayor dolor, y ambos son parte del proceso.',
            'Nombrar lo que duele y apoyarte en rutinas básicas puede ayudarte a transitar esta etapa con más cuidado.'
          ],
          question: [
            '¿Qué te gustaría recordar o compartir sobre lo que perdiste?',
            '¿Hay algo específico que te está costando más en este momento?',
            '¿Tienes personas cercanas con las que puedas hablar sobre esto?',
            '¿Qué momentos del día se vuelven más difíciles para ti desde esta pérdida?',
            '¿Qué tipo de apoyo te haría sentir más acompañado ahora mismo?'
          ]
        },
        soledad: {
          validation: [
            'La soledad puede ser muy dolorosa. Es válido que te sientas así.',
            'Sentirse solo no significa que estés realmente solo, pero el sentimiento es real.',
            'La soledad es una emoción humana común, especialmente en momentos difíciles.',
            'Tiene sentido que esto te pese: sentirse desconectado puede agotar mucho por dentro.',
            'No estás mal por sentirte así; la necesidad de conexión es profundamente humana.'
          ],
          psychoeducation: [
            'La soledad puede venir de desconexión emocional, no solo física.',
            'A veces necesitamos conexión profunda, no solo compañía superficial.',
            'Es importante distinguir entre estar solo (físicamente) y sentirse solo (emocionalmente).',
            'Pequeños gestos de contacto consistente suelen aliviar más que interacciones intensas pero esporádicas.',
            'Fortalecer una o dos relaciones significativas puede ser más protector que intentar encajar en muchos espacios.'
          ],
          question: [
            '¿Qué tipo de conexión sientes que te falta?',
            '¿Hay alguien con quien te gustaría acercarte más?',
            '¿Qué te gustaría que otros entendieran sobre cómo te sientes?',
            '¿Qué señal te haría sentir realmente acompañado esta semana?',
            '¿Hay un primer paso pequeño que podrías dar hoy para sentir más conexión?'
          ]
        },
        fracaso: {
          validation: [
            'Es difícil cuando las cosas no salen como esperábamos. Tu frustración es comprensible.',
            'Sentirse como un fracaso no significa que lo seas. Los sentimientos no son hechos.',
            'Es normal sentirse desanimado cuando algo no funciona como planeaste.',
            'Entiendo lo duro que puede ser cargar con esa autocrítica cuando algo sale mal.',
            'Que hoy te sientas así no define todo lo que eres ni todo lo que has logrado.'
          ],
          psychoeducation: [
            'El "fracaso" es parte del aprendizaje y crecimiento.',
            'Una situación que no salió bien no define tu valor como persona.',
            'Muchos logros importantes vienen después de intentos que no funcionaron.',
            'Nuestra mente suele convertir un error puntual en una identidad global, pero eso es una distorsión común.',
            'Separar resultado, esfuerzo y valor personal ayuda a recuperar perspectiva y motivación.'
          ],
          question: [
            '¿Qué aprendiste de esta situación?',
            '¿Qué harías diferente si tuvieras otra oportunidad?',
            '¿Hay algo positivo, por pequeño que sea, que puedas rescatar de esta experiencia?',
            'Si esto le pasara a alguien que quieres, ¿qué le dirías?',
            '¿Qué evidencia concreta tienes de que sí eres capaz en otras áreas?'
          ]
        },
        desesperanza: {
          validation: [
            'Cuando no vemos salida, es natural sentir desesperanza. Tu sentimiento es válido.',
            'La desesperanza puede hacer que todo se vea oscuro, pero no significa que no haya luz.',
            'Es comprensible que te sientas así cuando las cosas se ven difíciles.',
            'Gracias por poner en palabras algo tan pesado; no es fácil hablar desde ahí.',
            'No estás solo en esto, incluso si ahora se siente como si no hubiera salida.'
          ],
          psychoeducation: [
            'La desesperanza es una emoción temporal, aunque no lo parezca.',
            'Nuestro cerebro a veces nos engaña haciéndonos creer que las cosas nunca cambiarán.',
            'Pequeños pasos pueden abrir nuevas posibilidades que no vemos desde donde estamos.',
            'Cuando la carga emocional es alta, la visión se estrecha; por eso conviene decidir en pasos cortos y concretos.',
            'Recuperar sensación de agencia suele empezar con acciones mínimas sostenidas, no con cambios gigantes.'
          ],
          question: [
            '¿Ha habido momentos en el pasado donde pensaste que no había salida y luego las cosas cambiaron?',
            '¿Qué sería diferente si tuvieras un poco más de esperanza?',
            '¿Hay algo pequeño que podrías hacer hoy que te acerque a sentirte mejor?',
            '¿Qué te ayudaría a pasar las próximas 24 horas con más seguridad y calma?',
            '¿Quién podría ser tu primer apoyo si esta sensación empeora?'
          ]
        },
        vacío: {
          validation: [
            'El vacío interior puede ser muy desconcertante. Es válido que te sientas así.',
            'Sentirse vacío no significa que no tengas valor o propósito.',
            'Este sentimiento de vacío es real y merece atención.',
            'Tiene sentido que te inquieta: el vacío suele sentirse como desconexión de uno mismo.',
            'No estás fallando; este estado emocional puede aparecer cuando algo importante necesita ser escuchado.'
          ],
          psychoeducation: [
            'El vacío puede venir de desconexión con uno mismo o con lo que da sentido a la vida.',
            'A veces necesitamos explorar qué nos llena y qué nos conecta con el significado.',
            'El vacío puede ser una señal de que necesitamos reconectar con nuestros valores.',
            'Rutinas de autocuidado, descanso y contacto humano suelen reducir la sensación de entumecimiento emocional.',
            'Volver a actividades con significado personal, aunque sea en dosis pequeñas, puede devolver dirección.'
          ],
          question: [
            '¿Qué solía darte sentido o propósito?',
            '¿Hay algo que te gustaría explorar o probar?',
            '¿Qué te gustaría que llenara ese vacío?',
            '¿En qué momentos del día sientes más ese vacío y en cuáles baja un poco?',
            '¿Qué valor importante tuyo sientes que hoy está más desconectado?'
          ]
        },
        rechazo: {
          validation: [
            'El rechazo duele profundamente. Es natural sentirse herido cuando alguien nos rechaza.',
            'Sentirse rechazado puede activar heridas antiguas. Tu dolor es válido.',
            'El rechazo puede hacer que cuestionemos nuestro valor, pero no lo define.',
            'Es entendible que esto te haya tocado tanto; el rechazo suele sentirse muy personal.',
            'Lo que pasó puede doler mucho sin que eso signifique que vales menos.'
          ],
          psychoeducation: [
            'El rechazo de una persona no refleja tu valor como ser humano.',
            'A veces el rechazo dice más sobre la otra persona que sobre ti.',
            'Todos experimentamos rechazo en algún momento; es parte de la vida humana.',
            'Después de un rechazo, la mente suele enfocarse en señales de amenaza y olvidar evidencias de aceptación.',
            'Reforzar límites y autocompasión ayuda a que el rechazo no se convierta en identidad.'
          ],
          question: [
            '¿Qué te dice este rechazo sobre ti mismo?',
            '¿Hay otras personas en tu vida que sí te valoran y aceptan?',
            '¿Cómo podrías cuidarte en este momento?',
            '¿Qué interpretación alternativa podrías considerar sobre lo que ocurrió?',
            '¿Qué necesitarías para proteger tu autoestima frente a esta situación?'
          ]
        }
      },
      ansiedad: {
        social: {
          validation: [
            'La ansiedad social puede ser muy limitante. Es válido que te sientas así.',
            'Sentirse ansioso en situaciones sociales es más común de lo que piensas.',
            'Tu ansiedad social es real y merece comprensión, no juicio.',
            'Tiene lógica que te cueste: exponerte cuando temes ser evaluado puede sentirse agotador.',
            'No estás solo en esto; muchas personas sensibles al juicio social viven algo parecido.'
          ],
          psychoeducation: [
            'La ansiedad social viene del miedo a ser juzgado o rechazado.',
            'Muchas personas experimentan ansiedad social, incluso quienes parecen seguros.',
            'La ansiedad social puede mejorar con práctica y técnicas específicas.',
            'La evitación alivia a corto plazo, pero suele mantener el miedo a largo plazo.',
            'Exposiciones graduales y autodiálogo compasivo pueden entrenar al cerebro a sentirse más seguro.'
          ],
          question: [
            '¿Qué es lo que más te preocupa en situaciones sociales?',
            '¿Hay situaciones sociales específicas que te generan más ansiedad?',
            '¿Qué te ayudaría a sentirte más cómodo en situaciones sociales?',
            '¿Qué escenario social te gustaría empezar a practicar primero, en versión pequeña?',
            '¿Cómo sabrías que una interacción fue "suficientemente buena" sin exigir perfección?'
          ]
        },
        anticipatoria: {
          validation: [
            'La ansiedad por el futuro puede ser abrumadora. Es comprensible que te sientas así.',
            'Preocuparse por lo que puede pasar es natural, aunque puede volverse excesivo.',
            'Tu ansiedad anticipatoria es válida, aunque a veces nos hace sufrir por cosas que no pasarán.',
            'Tiene sentido que tu mente se adelante; cuando buscamos control, el futuro puede sentirse amenazante.',
            'No estás exagerando: vivir en alerta constante cansa mucho mental y físicamente.'
          ],
          psychoeducation: [
            'La ansiedad anticipatoria es preocuparse por eventos futuros que pueden no ocurrir.',
            'Nuestro cerebro a veces nos prepara para peligros que no existen.',
            'Vivir en el presente puede ayudar a reducir la ansiedad por el futuro.',
            'Diferenciar entre "riesgo real" y "posibilidad temida" ayuda a bajar la rumiación.',
            'Acotar el foco a lo controlable suele reducir la sensación de desborde.'
          ],
          question: [
            '¿Qué es lo peor que podría pasar? ¿Y lo más probable?',
            '¿Has sobrevivido a situaciones difíciles antes?',
            '¿Qué te ayudaría a enfocarte más en el presente?',
            '¿Qué parte de esta situación sí depende de ti hoy?',
            'Si tuvieras que decidir un solo paso útil para mañana, ¿cuál sería?'
          ]
        },
        rendimiento: {
          validation: [
            'La presión por rendir bien puede generar mucha ansiedad. Es válido que te sientas así.',
            'Sentirse ansioso por el rendimiento es común, especialmente cuando algo es importante para ti.',
            'Tu ansiedad por el rendimiento muestra que te importa, aunque puede ser paralizante.',
            'Tiene sentido que te afecte tanto cuando sientes que hay mucho en juego.',
            'No estás fallando por sentir ansiedad; tu sistema está intentando protegerte de equivocarte.'
          ],
          psychoeducation: [
            'Un poco de ansiedad puede mejorar el rendimiento, pero demasiada lo perjudica.',
            'El perfeccionismo y el miedo al fracaso suelen estar detrás de la ansiedad por rendimiento.',
            'El valor no está solo en los resultados, sino también en el esfuerzo y el proceso.',
            'Objetivos realistas y criterios de éxito flexibles suelen mejorar desempeño y bienestar.',
            'Entrenar recuperación (pausas, respiración, revisión amable) es tan importante como entrenar ejecución.'
          ],
          question: [
            '¿Qué pasaría si no cumplieras con tus expectativas?',
            '¿Qué te dirías a ti mismo si fueras tu mejor amigo?',
            '¿Cómo podrías prepararte de manera que reduzcas la ansiedad?',
            '¿Qué expectativa necesitas ajustar para que sea exigente pero sostenible?',
            '¿Qué señal concreta te indicaría progreso, aunque no sea perfección?'
          ]
        }
      },
      enojo: {
        injusticia: {
          validation: [
            'Es natural sentir enojo cuando percibes injusticia. Tu reacción es comprensible.',
            'El enojo por injusticia muestra que tienes valores y principios.',
            'Sentirse enojado por ser tratado injustamente es una respuesta válida.',
            'Tiene sentido que te afecte: cuando se vulnera algo importante, el enojo aparece para proteger.',
            'No estás mal por enojarte; esa emoción señala que algo para ti fue cruzado.'
          ],
          psychoeducation: [
            'El enojo puede ser una señal de que algo importante para ti fue vulnerado.',
            'Expresar el enojo de manera constructiva puede ser más efectivo que reprimirlo.',
            'A veces necesitamos establecer límites para proteger nuestros valores.',
            'Regular primero la activación física del enojo ayuda a comunicarte con más claridad y firmeza.',
            'Canalizar el enojo hacia acciones concretas suele generar más cambio que descargarlo impulsivamente.'
          ],
          question: [
            '¿Qué es lo que más te molesta de esta situación?',
            '¿Qué necesitarías para sentir que se hizo justicia?',
            '¿Cómo podrías expresar tu enojo de manera que te ayude en lugar de perjudicarte?',
            '¿Qué límite concreto te gustaría marcar a partir de ahora?',
            '¿Qué conversación pendiente necesitas tener para defender lo que es importante para ti?'
          ]
        },
        frustración: {
          validation: [
            'La frustración es agotadora. Es válido que te sientas así cuando las cosas no salen.',
            'Sentirse frustrado cuando algo no funciona es completamente normal.',
            'Tu frustración muestra que te importa y que estás intentando.',
            'Tiene sentido que estés cansado de intentarlo sin ver el resultado que esperas.',
            'No estás retrocediendo por sentir frustración; suele aparecer justo cuando estamos comprometidos.'
          ],
          psychoeducation: [
            'La frustración viene de la brecha entre lo que esperamos y lo que obtenemos.',
            'A veces necesitamos ajustar nuestras expectativas o nuestro enfoque.',
            'La frustración puede ser una señal de que necesitamos un descanso o un cambio de estrategia.',
            'Dividir metas grandes en pasos pequeños reduce bloqueo y mejora la percepción de avance.',
            'Pausar para regularte no es rendirte; es preparar mejores decisiones.'
          ],
          question: [
            '¿Qué está dentro de tu control en esta situación?',
            '¿Hay otra forma de abordar esto?',
            '¿Qué te ayudaría a sentir menos frustración?',
            '¿Qué parte específica te está trabando más ahora mismo?',
            '¿Cuál sería un siguiente paso mínimo y viable para destrabar esto hoy?'
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
   * Construye una guía breve para mezclar con la respuesta del modelo.
   * Evita introducir bloques largos que se perciban como plantilla rígida.
   * @param {string} emotion
   * @param {string} subtype
   * @param {Object} options
   * @returns {string|null}
   */
  buildTherapeuticHint(emotion, subtype, options = {}) {
    const template = this.getTemplate(emotion, subtype);
    if (!template) return null;

    const { maxLength = 180 } = options;
    const candidates = [...(template.validation || []), ...(template.psychoeducation || [])]
      .filter((s) => typeof s === 'string' && s.trim().length > 0);

    if (candidates.length === 0) return null;

    const concise = candidates.filter((s) => s.length <= maxLength);
    const pool = concise.length > 0 ? concise : candidates;
    return this.selectPhrase(pool, 'brief');
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

