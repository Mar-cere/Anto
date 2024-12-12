const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Obtener todos los hábitos del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const habits = await Habit.find({ 
      userId: req.user.id,
      isActive: true 
    }).sort({ lastCompleted: -1 });
    res.json(habits);
  } catch (error) {
    console.error('Error al obtener hábitos:', error);
    res.status(500).json({ message: 'Error al obtener los hábitos' });
  }
});

// Crear nuevo hábito
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newHabit = new Habit({
      ...req.body,
      userId: req.user.id
    });
    const savedHabit = await newHabit.save();
    res.status(201).json(savedHabit);
  } catch (error) {
    console.error('Error al crear hábito:', error);
    res.status(400).json({ message: 'Error al crear el hábito' });
  }
});

// Marcar hábito como completado
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Hábito no encontrado' });
    }

    if (habit.isCompletedToday()) {
      return res.status(400).json({ message: 'Hábito ya completado hoy' });
    }

    habit.lastCompleted = new Date();
    const today = new Date();
    
    // Actualizar progreso semanal
    habit.weeklyProgress.push({
      date: today,
      value: Math.min((habit.getAverageProgress('weekly') + 10), 100)
    });

    // Mantener solo los últimos 7 días
    if (habit.weeklyProgress.length > 7) {
      habit.weeklyProgress.shift();
    }

    // Actualizar progreso mensual
    habit.monthlyProgress.push({
      date: today,
      value: Math.min((habit.getAverageProgress('monthly') + 5), 100)
    });

    // Mantener solo los últimos 30 días
    if (habit.monthlyProgress.length > 30) {
      habit.monthlyProgress.shift();
    }

    await habit.save();
    res.json(habit);
  } catch (error) {
    console.error('Error al completar hábito:', error);
    res.status(500).json({ message: 'Error al completar el hábito' });
  }
});

// Actualizar hábito
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedHabit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedHabit) {
      return res.status(404).json({ message: 'Hábito no encontrado' });
    }
    res.json(updatedHabit);
  } catch (error) {
    console.error('Error al actualizar hábito:', error);
    res.status(400).json({ message: 'Error al actualizar el hábito' });
  }
});

// Eliminar hábito (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );
    if (!habit) {
      return res.status(404).json({ message: 'Hábito no encontrado' });
    }
    res.json({ message: 'Hábito eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar hábito:', error);
    res.status(500).json({ message: 'Error al eliminar el hábito' });
  }
});

module.exports = router;
