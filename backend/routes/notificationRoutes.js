const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Obtener todas las notificaciones del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.id,
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener las notificaciones' });
  }
});

// Marcar notificación como leída
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ message: 'Error al marcar la notificación como leída' });
  }
});

// Marcar todas las notificaciones como leídas
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({ message: 'Error al marcar las notificaciones como leídas' });
  }
});

// Eliminar notificación (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    res.json({ message: 'Notificación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ message: 'Error al eliminar la notificación' });
  }
});

module.exports = router;
