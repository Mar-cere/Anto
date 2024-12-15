const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const openai = require('openai');
const { authenticateToken } = require('../middlewares/authMiddleware');
const openaiClient = new openai({
  apiKey: process.env.OPENAI_API_KEY
});

// Prompt del sistema mejorado con más contexto y capacidades
const SYSTEM_PROMPT = `Eres Anto, una asistente personal AI enfocada en apoyo emocional y psicologico.

PERSONALIDAD:
- Empática y comprensiva, pero directa y eficiente
- Profesional pero cercana
- Proactiva en sugerencias
- Orientada a soluciones prácticas
- Siempre enfocada en avanzar en la conversacion, solucionar problemas, mantener el chat abierto para ayudar en el desahogo personal

CAPACIDADES:
1. Productividad:
   - Técnicas de gestión del tiempo
   - Método Pomodoro
   - GTD (Getting Things Done)
   - Priorización de tareas

2. Bienestar:
   - Equilibrio trabajo-vida
   - Técnicas de mindfulness
   - Gestión del estrés
   - Hábitos saludables

3. Organización:
   - Planificación diaria/semanal
   - Gestión de proyectos
   - Establecimiento de metas SMART
   - Seguimiento de hábitos

DIRECTRICES:
- Da respuestas completas
- Sugiere funcionalidades específicas de la app solo cuando sea relevante
- Adapta el tono según el contexto emocional del usuario
- Ofrece ejemplos prácticos y accionables
- Mantén un seguimiento de los objetivos mencionados previamente

Si detectas:
- Estrés: Ofrece técnicas de respiración o pausas
- Indecisión: Ayuda a desglosar las decisiones
- Procrastinación: Sugiere el método Pomodoro
- Desorganización: Recomienda usar el sistema de tareas

La funcion de Anto es principalmente el acompañamiento emocional y la ayuda psicologica del usuario, los demas son agregados`;

// Función para analizar el sentimiento del mensaje
const analyzeSentiment = (text) => {
  const stressWords = ['estresado', 'ansioso', 'preocupado', 'abrumado'];
  const urgencyWords = ['urgente', 'inmediato', 'pronto', 'rápido'];
  const confusionWords = ['confundido', 'no sé', 'indeciso', 'duda'];

  return {
    isStressed: stressWords.some(word => text.toLowerCase().includes(word)),
    isUrgent: urgencyWords.some(word => text.toLowerCase().includes(word)),
    isConfused: confusionWords.some(word => text.toLowerCase().includes(word))
  };
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ 
      userId: req.user.id 
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const sentiment = analyzeSentiment(text);

    // Guardar mensaje del usuario
    const userMessage = await Message.create({
      userId: req.user.id,
      text,
      sender: 'User'
    });

    // Obtener contexto de conversación
    const previousMessages = await Message.find({ 
      userId: req.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(8)  // Aumentamos a 8 mensajes para más contexto
    .sort({ createdAt: 1 });

    // Adaptar el contexto según el sentimiento
    let contextualPrompt = SYSTEM_PROMPT;
    if (sentiment.isStressed) {
      contextualPrompt += '\nEl usuario parece estresado. Prioriza técnicas de calma y bienestar.';
    }
    if (sentiment.isUrgent) {
      contextualPrompt += '\nEl usuario necesita ayuda urgente. Ofrece soluciones inmediatas y prácticas.';
    }
    if (sentiment.isConfused) {
      contextualPrompt += '\nEl usuario necesita claridad. Proporciona explicaciones paso a paso.';
    }

    const messages = [
      { role: "system", content: contextualPrompt },
      ...previousMessages.map(msg => ({
        role: msg.sender.toLowerCase() === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: text }
    ];

    try {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: sentiment.isUrgent ? 0.3 : 0.7, // Más preciso si es urgente
        messages: [
          {
            role: "system",
            content: "Eres un asistente amigable y profesional llamado Anto. Tus respuestas son concisas y útiles."
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });
      console.log('6. Backend - Respuesta de OpenAI recibida');

      const aiMessage = await Message.create({
        userId: req.user.id,
        text: completion.choices[0].message.content,
        sender: 'AI'
      });
      console.log('7. Backend - Respuesta AI guardada:', aiMessage);

      res.json([userMessage, aiMessage]);
      console.log('8. Backend - Respuesta enviada al frontend');
    } catch (aiError) {
      console.error('Backend - Error de OpenAI:', aiError);
      
      const aiMessage = await Message.create({
        userId: req.user.id,
        text: "Lo siento, estoy teniendo problemas para procesar tu mensaje. ¿Podrías intentarlo de nuevo?",
        sender: 'AI'
      });

      res.json([userMessage, aiMessage]);
    }
  } catch (error) {
    console.error('Backend - Error general:', error);
    res.status(500).json({ message: 'Error al procesar el mensaje' });
  }
});

module.exports = router;
