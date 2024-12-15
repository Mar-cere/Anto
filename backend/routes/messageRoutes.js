const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const OpenAI = require('openai');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Obtener mensajes del usuario
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

// Enviar mensaje y obtener respuesta de IA
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('1. Backend - Request recibido');
    const { text } = req.body;
    console.log('2. Backend - Texto del mensaje:', text);
    console.log('3. Backend - Usuario ID:', req.user.id);

    // Guardar mensaje del usuario
    const userMessage = await Message.create({
      userId: req.user.id,
      text,
      sender: 'User'
    });
    console.log('4. Backend - Mensaje usuario guardado:', userMessage);

    try {
      console.log('5. Backend - Iniciando llamada a OpenAI');
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
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
