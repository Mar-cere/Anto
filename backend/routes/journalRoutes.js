const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Obtener todas las entradas del diario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, mood } = req.query;
    let query = { userId: req.user.id, isActive: true };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (mood) {
      query.mood = mood;
    }

    const journals = await Journal.find(query)
      .sort({ date: -1 })
      .limit(50);
    res.json(journals);
  } catch (error) {
    console.error('Error al obtener entradas del diario:', error);
    res.status(500).json({ message: 'Error al obtener las entradas del diario' });
  }
});

// Obtener una entrada específica
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const journal = await Journal.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!journal) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json(journal);
  } catch (error) {
    console.error('Error al obtener entrada:', error);
    res.status(500).json({ message: 'Error al obtener la entrada' });
  }
});

// Crear nueva entrada
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newJournal = new Journal({
      ...req.body,
      userId: req.user.id
    });
    const savedJournal = await newJournal.save();
    res.status(201).json(savedJournal);
  } catch (error) {
    console.error('Error al crear entrada:', error);
    res.status(400).json({ message: 'Error al crear la entrada' });
  }
});

// Actualizar entrada
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedJournal = await Journal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!updatedJournal) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json(updatedJournal);
  } catch (error) {
    console.error('Error al actualizar entrada:', error);
    res.status(400).json({ message: 'Error al actualizar la entrada' });
  }
});

// Eliminar entrada (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const journal = await Journal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!journal) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json({ message: 'Entrada eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar entrada:', error);
    res.status(500).json({ message: 'Error al eliminar la entrada' });
  }
});

// Obtener estadísticas de estado de ánimo
router.get('/stats/mood', authenticateToken, async (req, res) => {
  try {
    const stats = await Journal.aggregate([
      { 
        $match: { 
          userId: req.user.id,
          isActive: true,
          date: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener las estadísticas' });
  }
});

module.exports = router;
