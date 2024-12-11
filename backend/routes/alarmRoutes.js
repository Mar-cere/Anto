const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const Alarm = require('../models/Alarm');

// Ruta para obtener alarmas
router.get('/', authenticateToken, async (req, res) => {
  console.log('[GET Alarmas] Solicitud recibida. Usuario:', req.user);
  try {
    const alarms = await Alarm.find({ userId: req.user.id });
    console.log('[GET Alarmas] Alarmas encontradas:', alarms);
    res.status(200).json(alarms);
  } catch (error) {
    console.error('[GET Alarmas] Error al obtener alarmas:', error.message);
    res.status(500).json({ message: 'Error al obtener alarmas.', error: error.message });
  }
});

// Ruta para agregar alarmas
router.post('/', authenticateToken, async (req, res) => {
  console.log('[POST Alarmas] Solicitud recibida. Datos:', req.body);
  try {
    const newAlarm = new Alarm({ ...req.body, userId: req.user.id });
    const savedAlarm = await newAlarm.save();
    console.log('[POST Alarmas] Alarma guardada:', savedAlarm);
    res.status(201).json(savedAlarm);
  } catch (error) {
    console.error('[POST Alarmas] Error al guardar alarma:', error.message);
    res.status(500).json({ message: 'Error al guardar alarma.', error: error.message });
  }
});

// Eliminar una alarma
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedAlarm = await Alarm.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedAlarm) {
      console.log('[Alarms] Alarma no encontrada:', req.params.id);
      return res.status(404).json({ message: 'Alarma no encontrada.' });
    }

    console.log('[Alarms] Alarma eliminada con éxito:', deletedAlarm);
    res.status(200).json({ message: 'Alarma eliminada con éxito.' });
  } catch (error) {
    console.error('[Alarms] Error al eliminar alarma:', error.message);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Actualizar una alarma (opcional, para futuros usos)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { time, label, category, active } = req.body;
    
    // Validar el formato de hora
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    if (time && !timeRegex.test(time)) {
      return res.status(400).json({ message: 'Formato de hora inválido' });
    }

    const updatedAlarm = await Alarm.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { time, label, category, active },
      { new: true, runValidators: true }
    );

    if (!updatedAlarm) {
      return res.status(404).json({ message: 'Alarma no encontrada' });
    }

    res.status(200).json(updatedAlarm);
  } catch (error) {
    console.error('[Alarms] Error al actualizar alarma:', error);
    res.status(500).json({ message: 'Error al actualizar la alarma' });
  }
});

module.exports = router;

