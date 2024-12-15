const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const openai = require('openai');
const { authenticateToken } = require('../middlewares/authMiddleware');
const openaiClient = new openai({
  apiKey: process.env.OPENAI_API_KEY
});

// Prompt del sistema mejorado con más contexto y capacidades
const SYSTEM_PROMPT = `Eres Anto, una psicóloga virtual con formación en terapias humanistas y cognitivas conductuales. Tu propósito principal es proporcionar apoyo emocional, validar sentimientos y guiar al usuario hacia reflexiones útiles.

PERSONALIDAD:
- Cálida y comprensiva, pero profesional y estructurada.
- Siempre utiliza frases que validen los sentimientos del usuario, como "Entiendo cómo te sientes", "Eso debe ser difícil para ti", o "Gracias por compartir eso conmigo."
- Si el usuario parece molesto o inseguro, prioriza mostrar empatía antes de ofrecer consejos.

FUNCIONES PRINCIPALES:
1. Escuchar y validar emociones:
   - Usa preguntas abiertas para profundizar, como "¿Puedes contarme más sobre eso?" o "¿Qué crees que te está afectando más?"
   - Evita trivializar las emociones del usuario.
2. Ofrecer estrategias psicológicas:
   - Si el usuario está ansioso, utiliza técnicas de mindfulness.
   - Si el usuario está bloqueado, sugiere dividir tareas en pasos pequeños.
3. Generar confianza:
   - Responde de manera personalizada utilizando detalles que el usuario haya mencionado previamente.

DIRECTRICES DE ESTILO:
- Usa lenguaje sencillo, pero profesional.
- Limita tus respuestas a 2-3 párrafos claros y concisos.
- Utiliza ejemplos prácticos para ayudar al usuario a visualizar soluciones.

TERAPIA COGNITIVA-CONDUCTUAL (CBT):
- Ayuda al usuario a identificar patrones de pensamiento negativos y reformularlos:
   - "¿Qué evidencias tienes para respaldar ese pensamiento?"
   - "¿Hay otra forma de interpretar esta situación?"
   - "¿Cómo crees que este pensamiento está afectando tus emociones y acciones?"

ADAPTACIÓN:
- Si el usuario está en crisis emocional, prioriza técnicas de calma y redirige al círculo de apoyo.
- Si el usuario está reflexivo, fomenta el autodescubrimiento con preguntas introspectivas.

AUTOEVALUACIONES Y ESCALAS EMOCIONALES:
- Al inicio de la interacción, pregunta: "¿Cómo te sientes en una escala del 1 al 10?"
- Utiliza esta información para ajustar las respuestas.
- Al final de la conversación, pregunta: "¿Qué tan útil te resultó esta conversación en una escala del 1 al 10?"
`;

// Función para analizar el sentimiento del mensaje
const analyzeSentiment = (text) => {
  const keywords = {
    stress: ['estresado', 'ansioso', 'preocupado', 'abrumado'],
    urgency: ['urgente', 'inmediato', 'pronto', 'rápido'],
    confusion: ['confundido', 'no sé', 'indeciso', 'duda']
  };

  return {
    isStressed: keywords.stress.some(word => text.toLowerCase().includes(word)),
    isUrgent: keywords.urgency.some(word => text.toLowerCase().includes(word)),
    isConfused: keywords.confusion.some(word => text.toLowerCase().includes(word))
  };
};

const detectLanguage = (text) => {
  return text.match(/[áéíóúñ]/i) ? 'es' : 'en';
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ 
      userId: req.user.id 
    }).sort({ createdAt: 1 });

    const filteredMessages = messages.filter(msg => msg.isImportant);
    res.json(filteredMessages);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '' || text.length > 500) {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío o demasiado largo' });
    }

    const sentiment = analyzeSentiment(text);

    // Detectar idioma
    const language = detectLanguage(text);
    const localizedPrompt = language === 'es' ? SYSTEM_PROMPT : 'You are Anto, a friendly personal assistant focused on emotional support.';

    // Guardar mensaje del usuario
    const userMessage = await Message.create({
      userId: req.user.id,
      text,
      sender: 'User',
      isImportant: true
    });

    // Obtener contexto de conversación
    const previousMessages = await Message.find({ 
      userId: req.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(15)  // Más mensajes para contexto extendido
    .sort({ createdAt: 1 });

    const filteredMessages = previousMessages.filter(msg => msg.isImportant);

    // Adaptar el contexto según el sentimiento
    let contextualPrompt = localizedPrompt;
    if (sentiment.isStressed) {
      contextualPrompt += '\nEl usuario parece estresado. Prioriza técnicas de calma y bienestar.';
    }
    if (sentiment.isUrgent) {
      contextualPrompt += '\nEl usuario necesita ayuda urgente. Ofrece soluciones inmediatas y prácticas.';
    }
    if (sentiment.isConfused) {
      contextualPrompt += '\nEl usuario necesita claridad. Proporciona explicaciones paso a paso.';
    }

    // Ajustar la temperatura según el estado emocional
    const temperature = sentiment.isUrgent ? 0.3 : 0.7;

    const messages = [
      { role: "system", content: contextualPrompt },
      ...filteredMessages.map(msg => ({
        role: msg.sender.toLowerCase() === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: text }
    ];

    try {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature,
        max_tokens: 150,
      });

      const aiMessage = await Message.create({
        userId: req.user.id,
        text: completion.choices[0].message.content,
        sender: 'AI',
        isImportant: true
      });

      // Autoevaluación al final
      aiMessage.text += '\n\nAntes de terminar, ¿puedes decirme qué tan útil te pareció esta conversación en una escala del 1 al 10?';

      res.json([userMessage, aiMessage]);
    } catch (aiError) {
      console.error('Backend - Error de OpenAI:', aiError.response?.data || aiError.message);

      let errorMessage = "Lo siento, estoy teniendo problemas para procesar tu mensaje. ¿Podrías intentarlo de nuevo?";
      if (aiError.response?.status === 429) {
        errorMessage = "El servicio está saturado en este momento. Por favor, intenta más tarde.";
      } else if (aiError.response?.status === 400) {
        errorMessage = "Hubo un error con el mensaje enviado. Intenta reformular tu pregunta.";
      }

      const aiMessage = await Message.create({
        userId: req.user.id,
        text: errorMessage,
        sender: 'AI',
        isImportant: false
      });

      res.json([userMessage, aiMessage]);
    }
  } catch (error) {
    console.error('Backend - Error general:', error);
    res.status(500).json({ message: 'Error al procesar el mensaje' });
  }
});

module.exports = router;
