const express = require('express');
const router = express.Router();
const Timer = require('../models/Timer');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Obtener todas las sesiones del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const timers = await Timer.find({ 
      userId: req.user.id,
      isActive: true 
    })
    .sort({ startTime: -1 })
    .limit(50);
    res.json(timers);
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    res.status(500).json({ message: 'Error al obtener las sesiones' });
  }
});

// Crear nueva sesión
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newTimer = new Timer({
      ...req.body,
      userId: req.user.id,
      endTime: new Date()
    });
    const savedTimer = await newTimer.save();
    res.status(201).json(savedTimer);
  } catch (error) {
    console.error('Error al crear sesión:', error);
    res.status(400).json({ message: 'Error al crear la sesión' });
  }
});

// Obtener estadísticas
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Timer.aggregate([
      {
        $match: {
          userId: req.user.id,
          completed: true,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMinutes: { $sum: { $divide: ['$duration', 60] } },
          pomodoroSessions: {
            $sum: {
              $cond: [{ $eq: ['$type', 'pomodoro'] }, 1, 0]
            }
          },
          meditationSessions: {
            $sum: {
              $cond: [{ $eq: ['$type', 'meditation'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalSessions: 0,
      totalMinutes: 0,
      pomodoroSessions: 0,
      meditationSessions: 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener las estadísticas' });
  }
});

// Obtener sesiones por tipo
router.get('/by-type/:type', authenticateToken, async (req, res) => {
  try {
    const timers = await Timer.find({
      userId: req.user.id,
      type: req.params.type,
      isActive: true
    })
    .sort({ startTime: -1 })
    .limit(10);
    res.json(timers);
  } catch (error) {
    console.error('Error al obtener sesiones por tipo:', error);
    res.status(500).json({ message: 'Error al obtener las sesiones' });
  }
});

// Eliminar sesión (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const timer = await Timer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!timer) {
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    res.json({ message: 'Sesión eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    res.status(500).json({ message: 'Error al eliminar la sesión' });
  }
});

module.exports = router;
