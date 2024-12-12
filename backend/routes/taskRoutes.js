const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Obtener todas las tareas del usuario
router.get('/', authenticateToken, async (req, res) => {
  console.log('[GET Tareas] Solicitud recibida. Usuario:', req.user);
  try {
    const tasks = await Task.find({ userId: req.user.id })
      .sort({ dueDate: 1 });
    console.log('[GET Tareas] Tareas encontradas:', tasks.length);
    res.json(tasks);
  } catch (error) {
    console.error('[GET Tareas] Error:', error);
    res.status(500).json({ message: 'Error al obtener las tareas' });
  }
});

// Crear una nueva tarea
router.post('/', authenticateToken, async (req, res) => {
  console.log('[POST Tareas] Solicitud recibida. Datos:', req.body);
  try {
    const newTask = new Task({
      ...req.body,
      userId: req.user.id
    });

    const savedTask = await newTask.save();
    console.log('[POST Tareas] Tarea guardada:', savedTask);
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('[POST Tareas] Error:', error);
    res.status(400).json({ 
      message: 'Error al crear la tarea',
      error: error.message 
    });
  }
});

// Actualizar una tarea
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('[PUT Tareas] Error:', error);
    res.status(400).json({ message: 'Error al actualizar la tarea' });
  }
});

// Eliminar una tarea
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deletedTask) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('[DELETE Tareas] Error:', error);
    res.status(500).json({ message: 'Error al eliminar la tarea' });
  }
});

// Actualizar estado de una subtarea
router.patch('/:taskId/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtarea no encontrada' });
    }

    subtask.completed = req.body.completed;
    await task.save();

    res.json(task);
  } catch (error) {
    console.error('[PATCH Subtareas] Error:', error);
    res.status(400).json({ message: 'Error al actualizar la subtarea' });
  }
});

module.exports = router;
