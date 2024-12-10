const express = require('express');
const router = express.Router();
const { validateUser, authenticateToken } = require('../middlewares/authMiddleware');
const Emotion = require('../models/Emotion'); // Asegúrate de tener el modelo de emociones

// Ruta para registrar emociones
router.post('/emotions', authenticateToken, async (req, res) => {
  const { emotion, emoji, timestamp } = req.body;

  console.log('[Registro de Emoción] Datos recibidos:', { emotion, emoji, timestamp });

  if (!emotion || !emoji || !timestamp) {
    console.warn('[Registro de Emoción] Faltan campos obligatorios');
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    console.log('[Registro de Emoción] Creando nueva emoción en la base de datos...');
    
    const newEmotion = new Emotion({
      userId: req.user.id,
      emotion,
      emoji,
      timestamp,
    });

    const savedEmotion = await newEmotion.save();

    console.log('[Registro de Emoción] Emoción registrada con éxito:', savedEmotion);
    res.status(201).json({ message: 'Estado emocional registrado con éxito.', data: savedEmotion });
  } catch (error) {
    console.error('[Registro de Emoción] Error al registrar la emoción:', error.message);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
