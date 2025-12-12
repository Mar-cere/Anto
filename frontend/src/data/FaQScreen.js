// Datos de preguntas frecuentes organizados por categorías
const faqData = [
  {
    category: "Sobre la Aplicación",
    items: [
      {
        question: "¿Qué es Anto?",
        answer: "Anto es tu asistente personal para la salud mental y el bienestar emocional. Su función principal es ser un psicólogo virtual con inteligencia artificial (GPT-5 Mini), brindándote apoyo a través de un chat interactivo. Además, te ayuda a gestionar tus tareas, hábitos, técnicas terapéuticas y detección de crisis, con el objetivo de mejorar tu bienestar diario."
      },
      {
        question: "¿Cómo puedo sacar el máximo provecho de la aplicación?",
        answer: "Para aprovechar al máximo Anto, te recomendamos:\n1) Conversar con Anto regularmente para recibir apoyo emocional personalizado.\n2) Usar el sistema de hábitos y tareas para organizarte mejor.\n3) Explorar las técnicas terapéuticas interactivas (respiración, mindfulness, grounding, etc.).\n4) Revisar tu dashboard de crisis para conocer tus patrones emocionales.\n5) Configurar contactos de emergencia para tu seguridad.\n6) Revisar tus estadísticas de técnicas terapéuticas para ver tu progreso."
      },
      {
        question: "¿Puedo usar Anto sin conexión?",
        answer: "Algunas funciones como el registro de hábitos y tareas están disponibles sin conexión. Sin embargo, el chat con Anto requiere acceso a internet, ya que la IA necesita conectarse a sus servidores para generar respuestas en tiempo real. Las técnicas terapéuticas interactivas también funcionan mejor con conexión para guardar tu progreso."
      }
    ]
  },
  {
    category: "Chat con Anto",
    items: [
      {
        question: "¿Cómo funciona el chat con Anto?",
        answer: "El chat con Anto es el corazón de la aplicación. Puedes hablar sobre cómo te sientes, pedir consejos o simplemente desahogarte. Anto usa inteligencia artificial (GPT-5 Mini) para comprender tus respuestas, detectar emociones en tiempo real y brindarte apoyo personalizado. Cuanto más interactúes, mejor se adaptará a tus necesidades. El sistema también detecta automáticamente situaciones de crisis y puede activar protocolos de emergencia si es necesario."
      },
      {
        question: "¿Anto puede reemplazar a un psicólogo?",
        answer: "Anto es una herramienta de apoyo emocional basada en IA, pero no reemplaza a un profesional de la salud mental. Su objetivo es acompañarte y ayudarte en tu bienestar diario, proporcionar técnicas terapéuticas y detectar situaciones de crisis. Si necesitas ayuda profesional, Anto puede sugerirte cuándo es recomendable acudir a un especialista y puede activar alertas de emergencia si detecta una situación crítica."
      },
      {
        question: "¿El chat con Anto es privado y seguro?",
        answer: "Sí. Todas tus conversaciones están protegidas con cifrado de extremo a extremo, lo que significa que ni siquiera nosotros podemos acceder a ellas. Tu privacidad es nuestra prioridad. Los datos se almacenan de forma segura y solo se utilizan para mejorar tu experiencia personalizada."
      },
      {
        question: "¿Cómo funciona la detección de crisis?",
        answer: "Anto analiza tus mensajes en tiempo real para detectar señales de crisis emocional. Cuando identifica una situación de riesgo, puede activar protocolos de emergencia, sugerir técnicas de regulación emocional inmediatas, y si es necesario, enviar alertas a tus contactos de emergencia configurados. También puedes revisar tu historial de crisis en el Dashboard de Crisis para identificar patrones."
      }
    ]
  },
  {
    category: "Funcionalidades",
    items: [
      {
        question: "¿Cómo puedo gestionar mis hábitos?",
        answer: "Ve a la sección de Hábitos desde el Dashboard y pulsa el botón '+' para añadir uno nuevo. Puedes personalizar su frecuencia (diario, semanal, etc.), establecer recordatorios y hacer seguimiento de tu progreso con gráficos intuitivos. También puedes editarlos, archivarlos o eliminarlos en cualquier momento. Los hábitos te ayudan a construir rutinas positivas y mejorar tu bienestar."
      },
      {
        question: "¿Cómo funciona el sistema de tareas?",
        answer: "El sistema de tareas te permite organizar tus actividades diarias. Puedes crear tareas, establecer prioridades, agregar fechas de vencimiento y marcarlas como completadas. Las tareas pendientes aparecen en tu Dashboard para que no se te olvide nada importante. También puedes ver tus tareas completadas para celebrar tus logros."
      },
      {
        question: "¿Qué técnicas terapéuticas están disponibles?",
        answer: "Anto incluye múltiples técnicas terapéuticas interactivas basadas en evidencia científica:\n- Ejercicios de respiración para regular la ansiedad\n- Técnica de Grounding 5-4-3-2-1 para conectar con el presente\n- Mindfulness para practicar atención plena\n- Diario de Gratitud para cultivar positividad\n- Autocompasión para trabajar la autoaceptación\n- Herramientas de comunicación para mejorar relaciones\n- Y muchas más. Puedes acceder a ellas desde el Dashboard o cuando Anto las sugiera durante una conversación."
      },
      {
        question: "¿Qué es el Dashboard de Crisis?",
        answer: "El Dashboard de Crisis te permite visualizar tu historial emocional, identificar patrones de crisis, ver tendencias a lo largo del tiempo y revisar estadísticas detalladas. Te ayuda a entender mejor tus estados emocionales y a tomar medidas preventivas. Puedes acceder desde el menú principal de la aplicación."
      },
      {
        question: "¿Cómo funciona el temporizador Pomodoro?",
        answer: "El temporizador Pomodoro te ayuda a mejorar tu productividad y bienestar mediante sesiones de trabajo enfocado de 25 minutos, seguidas de descansos cortos. Puedes usar esta herramienta para gestionar mejor tu tiempo, reducir el estrés y mantener un equilibrio saludable entre trabajo y descanso."
      },
      {
        question: "¿Anto está disponible en varios idiomas?",
        answer: "Actualmente, Anto está disponible en español. Estamos trabajando para incluir más idiomas en futuras actualizaciones."
      }
    ]
  },
  {
    category: "Suscripciones y Pagos",
    items: [
      {
        question: "¿Hay un período de prueba?",
        answer: "Sí. Anto ofrece un período de prueba gratuito de 3 días para que puedas explorar todas las funcionalidades sin compromiso. Durante este período tendrás acceso completo a todas las características de la aplicación."
      },
      {
        question: "¿Cómo funcionan los pagos?",
        answer: "Los pagos se procesan de forma segura a través de Mercado Pago. Puedes gestionar tu suscripción, ver tu historial de transacciones y actualizar tu método de pago desde la sección de Suscripción en Ajustes. Todos los pagos están protegidos con encriptación de alto nivel."
      },
      {
        question: "¿Puedo cancelar mi suscripción en cualquier momento?",
        answer: "Sí. Puedes cancelar tu suscripción en cualquier momento desde Ajustes > Suscripción. La cancelación será efectiva al final del período de facturación actual, y seguirás teniendo acceso hasta ese momento."
      }
    ]
  },
  {
    category: "Sistema de Emergencia",
    items: [
      {
        question: "¿Cómo funcionan las alertas de emergencia?",
        answer: "Puedes configurar contactos de emergencia en Ajustes > Contactos de Emergencia. Cuando Anto detecta una situación de crisis de alto riesgo, puede enviar automáticamente alertas a estos contactos (por SMS o WhatsApp) para que puedan ayudarte. Tú tienes control total sobre cuándo y cómo se activan estas alertas."
      },
      {
        question: "¿Puedo revisar mi historial de alertas?",
        answer: "Sí. Puedes ver tu historial completo de alertas de emergencia, incluyendo cuándo se enviaron, a quién y el estado de cada alerta, desde la sección Historial de Alertas en el Dashboard de Crisis."
      }
    ]
  },
  {
    category: "Privacidad y Seguridad",
    items: [
      {
        question: "¿Mis datos están protegidos?",
        answer: "Sí, usamos cifrado de alto nivel para proteger tu información. Tus datos no son compartidos con terceros, y ni siquiera nosotros tenemos acceso a tus conversaciones con Anto. Todas las comunicaciones están encriptadas y cumplimos con las mejores prácticas de seguridad y privacidad."
      },
      {
        question: "¿Puedo descargar mis datos?",
        answer: "Sí. Puedes exportar toda tu información desde Ajustes > Datos personales > Exportar datos. Esto incluye tus conversaciones, hábitos, tareas, estadísticas y cualquier otra información que hayas compartido con la aplicación."
      }
    ]
  },
  {
    category: "Futuras Mejoras y Sugerencias",
    items: [
      {
        question: "¿Qué nuevas funciones están en desarrollo?",
        answer: "Estamos trabajando constantemente en mejorar Anto. Algunas funcionalidades que estamos considerando incluyen:\n- Mejora significativa en la tecnología de chat con Anto para respuestas aún más personalizadas\n- Mejora de detección de crisis con algoritmos más avanzados\n- Modo oscuro para una mejor experiencia visual\n- Internacionalización (más idiomas)\n- Integración con wearables (Apple Watch, Fitbit)\n- Más técnicas terapéuticas especializadas\n- Integración con profesionales de la salud mental"
      },
      {
        question: "¿Dónde puedo sugerir mejoras para Anto?",
        answer: "Puedes enviarnos ideas desde Ajustes > Ayuda > Sugerencias o contactar directamente con Anto a través del chat. Nos encanta escuchar a nuestros usuarios para seguir mejorando la aplicación y hacerla más útil para todos."
      }
    ]
  }
];

export default faqData;
