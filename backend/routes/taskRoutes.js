/**
 * Rutas de Tareas y Recordatorios - Gestiona CRUD de tareas, recordatorios, subtareas y estadísticas
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { validateChatOriginForUser } from '../utils/validateChatOriginForUser.js';
import {
  recordProductActionCreatedFromDoc,
  recordProductActionCreateFailed
} from '../utils/metricsProductActions.js';
import {
  generateSubtaskTitlesWithLlm,
  pickNewSubtaskTitles,
  MAX_SUBTASKS_TOTAL
} from '../services/taskSubtasksLlmService.js';

const router = express.Router();

/** Tareas y metas cuentan para el perfil; los recordatorios no. */
function isCountableTaskItem(itemType) {
  return itemType === 'task' || itemType === 'goal';
}

/**
 * Incrementa `User.stats.tasksCompleted` solo en la transición a `completed`.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} previousStatus
 * @param {{ status: string, itemType: string }} doc
 */
async function bumpUserTasksCompletedIfNewlyCompleted(userId, previousStatus, doc) {
  if (previousStatus === 'completed' || doc.status !== 'completed') return;
  if (!isCountableTaskItem(doc.itemType)) return;
  await User.updateOne({ _id: userId }, { $inc: { 'stats.tasksCompleted': 1 } });
}

// Constantes de configuración
const MAX_ESTIMATED_TIME = 1440; // 24 horas en minutos
const MIN_REMINDER_INTERVAL = 5; // minutos
const MAX_REMINDER_INTERVAL = 1440; // 24 horas en minutos

// Rate limiters: control de frecuencia de peticiones
const createTaskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: 'Demasiadas tareas creadas. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const updateTaskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50,
  message: 'Demasiadas actualizaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const deleteTaskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: 'Demasiadas eliminaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const patchTaskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: 'Demasiadas modificaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Helper: buscar tarea por ID y validar propiedad
const findTaskById = async (taskId, userId, populate = false) => {
  // Asegurar que los IDs sean ObjectIds válidos
  if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }
  const query = Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId),
    deletedAt: { $exists: false }
  });
  
  if (populate) {
    query.populate('parentTask', 'title status');
  }
  
  return await query;
};

// Helper: construir query de búsqueda por texto
const buildSearchQuery = (searchText, userId) => {
  const regex = new RegExp(searchText, 'i');
  return {
    userId,
    $or: [
      { title: { $regex: regex } },
      { description: { $regex: regex } },
      { category: { $regex: regex } },
      { tags: { $in: [regex] } }
    ],
    deletedAt: { $exists: false }
  };
};

// Esquemas de validación Joi
const subtaskSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'El título de la subtarea es requerido',
      'string.min': 'El título de la subtarea debe tener al menos 1 carácter',
      'string.max': 'El título de la subtarea debe tener máximo 100 caracteres',
      'any.required': 'El título de la subtarea es requerido'
    }),
  completed: Joi.boolean().optional(),
  completedAt: Joi.date().optional().allow(null)
});

const notificationSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  reminderTime: Joi.date().optional(),
  repeatReminder: Joi.boolean().default(false),
  reminderInterval: Joi.number()
    .min(MIN_REMINDER_INTERVAL)
    .max(MAX_REMINDER_INTERVAL)
    .default(30)
    .messages({
      'number.min': 'El intervalo mínimo es 5 minutos',
      'number.max': 'El intervalo máximo es 24 horas'
    })
});

const repeatSchema = Joi.object({
  type: Joi.string()
    .valid('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom')
    .default('none'),
  interval: Joi.number()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'El intervalo debe ser al menos 1'
    }),
  endDate: Joi.date().optional(),
  daysOfWeek: Joi.array().items(
    Joi.number().min(0).max(6)
  ).optional()
});

const chatOriginSchema = Joi.object({
  conversationId: Joi.string()
    .custom((value, helpers) => {
      if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'conversationId ObjectId')
    .required(),
  sourceMessageId: Joi.string()
    .custom((value, helpers) => {
      if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'sourceMessageId ObjectId')
    .required(),
  source: Joi.string().valid('chat_v1').required()
}).optional();

/** Clave opcional de idempotencia (creación desde chat, reintentos de red). */
const clientRequestIdSchema = Joi.string()
  .trim()
  .max(80)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .optional()
  .allow(null, '');

const taskSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'El título es requerido',
      'string.min': 'El título debe tener al menos 1 carácter',
      'string.max': 'El título debe tener máximo 100 caracteres',
      'any.required': 'El título es requerido'
    }),
  description: Joi.string()
    .max(500)
    .allow('', null)
    .default('')
    .messages({
      'string.max': 'La descripción debe tener máximo 500 caracteres'
    }),
  dueDate: Joi.date()
    .min(new Date())
    .required()
    .messages({
      'date.min': 'La fecha de vencimiento no puede ser anterior a la actual',
      'any.required': 'La fecha de vencimiento es requerida'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium'),
  status: Joi.string()
    .valid('pending', 'in_progress', 'completed', 'cancelled')
    .default('pending'),
  itemType: Joi.string()
    .valid('task', 'reminder', 'goal')
    .default('task'),
  category: Joi.string()
    .max(50)
    .default('General')
    .messages({
      'string.max': 'La categoría debe tener máximo 50 caracteres'
    }),
  tags: Joi.array()
    .items(Joi.string().max(20).messages({
      'string.max': 'Cada etiqueta debe tener máximo 20 caracteres'
    }))
    .default([]),
  estimatedTime: Joi.number()
    .min(0)
    .max(MAX_ESTIMATED_TIME)
    .optional()
    .messages({
      'number.min': 'El tiempo estimado no puede ser negativo',
      'number.max': 'El tiempo estimado máximo es 24 horas'
    }),
  actualTime: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'El tiempo real no puede ser negativo'
    }),
  progress: Joi.number()
    .min(0)
    .max(100)
    .default(0)
    .messages({
      'number.min': 'El progreso no puede ser negativo',
      'number.max': 'El progreso no puede exceder 100%'
    }),
  subtasks: Joi.array()
    .items(subtaskSchema)
    .default([]),
  parentTask: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'ID de tarea padre inválido')
    .optional(),
  notifications: notificationSchema.default({}),
  repeat: repeatSchema.default({}),
  chatOrigin: chatOriginSchema.optional().allow(null),
  clientRequestId: clientRequestIdSchema
});

const updateTaskSchema = taskSchema.fork(
  ['title', 'dueDate'], 
  field => field.optional()
);

// Obtener todas las tareas y recordatorios del usuario (con filtros y paginación)
router.get('/', async (req, res) => {
  console.log('📋 GET /api/tasks - Petición recibida');
  console.log('👤 Usuario:', req.user?._id || req.user?.userId);
  try {
    const {
      type,
      status,
      priority,
      category,
      overdue,
      page = 1,
      limit = 20,
      sort = 'dueDate',
      order = 'asc'
    } = req.query;

    // Construir query base
    let query = { 
      userId: mongoose.Types.ObjectId.isValid(req.user._id) 
        ? new mongoose.Types.ObjectId(req.user._id) 
        : req.user._id,
      deletedAt: { $exists: false }
    };
    
    if (type) {
      query.itemType = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['completed', 'cancelled'] };
    }

    // Configurar paginación y ordenamiento
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort(sortObj)
        .limit(parseInt(limit))
        .skip(skip)
        .populate('parentTask', 'title status')
        .lean(),
      Task.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    
    // Verificar si es un error de conexión de MongoDB
    if (error.message && (
      error.message.includes('MongoServerSelectionError') ||
      error.message.includes('MongoNetworkError') ||
      error.message.includes('MongoTimeoutError') ||
      error.message.includes('connection') ||
      error.message.includes('connect ECONNREFUSED')
    )) {
      return res.status(503).json({ 
        success: false,
        message: 'Servicio temporalmente no disponible. La base de datos no está conectada.',
        error: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener las tareas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

function isDuplicateKeyError(err) {
  return Boolean(err && (err.code === 11000 || err.code === 11001));
}

// Crear una nueva tarea o recordatorio
router.post('/', createTaskLimiter, async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = taskSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    if (value.chatOrigin) {
      const originOk = await validateChatOriginForUser(value.chatOrigin, req.user._id);
      if (!originOk) {
        await recordProductActionCreateFailed(req.user._id, 'task');
        return res.status(400).json({
          message: 'Origen de chat inválido: la conversación o el mensaje no existe o no pertenece al usuario'
        });
      }
    }

    if (!value.clientRequestId) {
      delete value.clientRequestId;
    } else {
      const existingTask = await Task.findOne({
        userId: req.user._id,
        clientRequestId: value.clientRequestId,
        deletedAt: { $exists: false }
      });
      if (existingTask) {
        await recordProductActionCreatedFromDoc(req.user._id, 'task', existingTask, true);
        return res.status(200).json({
          success: true,
          message: 'Tarea ya registrada (reintento idempotente)',
          data: existingTask,
          idempotentReplay: true
        });
      }
    }

    // Preparar datos para el modelo
    const itemData = {
      ...value,
      userId: req.user._id
    };
    if (value.chatOrigin) {
      itemData.chatOrigin = {
        conversationId: new mongoose.Types.ObjectId(value.chatOrigin.conversationId),
        sourceMessageId: new mongoose.Types.ObjectId(value.chatOrigin.sourceMessageId),
        source: value.chatOrigin.source
      };
    }

    // Validaciones específicas por tipo
    if (itemData.itemType === 'reminder') {
      itemData.status = 'pending';
      delete itemData.priority; // Los recordatorios no tienen prioridad
    }

    // Validar tarea padre si se proporciona
    if (itemData.parentTask) {
      const parentTask = await findTaskById(itemData.parentTask, req.user._id);
      if (!parentTask) {
        return res.status(400).json({ message: 'Tarea padre no encontrada' });
      }
    }

    const task = new Task(itemData);
    try {
      await task.save();
    } catch (saveErr) {
      if (isDuplicateKeyError(saveErr) && value.clientRequestId) {
        const replay = await Task.findOne({
          userId: req.user._id,
          clientRequestId: value.clientRequestId,
          deletedAt: { $exists: false }
        });
        if (replay) {
          await recordProductActionCreatedFromDoc(req.user._id, 'task', replay, true);
          return res.status(200).json({
            success: true,
            message: 'Tarea ya registrada (reintento idempotente)',
            data: replay,
            idempotentReplay: true
          });
        }
      }
      throw saveErr;
    }

    await recordProductActionCreatedFromDoc(req.user._id, 'task', task, false);
    res.status(201).json({ 
      success: true, 
      message: 'Tarea creada exitosamente',
      data: task 
    });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    if (req.body?.chatOrigin) {
      await recordProductActionCreateFailed(req.user._id, 'task');
    }
    res.status(400).json({ 
      message: 'Error al crear la tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener tareas pendientes
router.get('/pending', async (req, res) => {
  console.log('📋 GET /api/tasks/pending - Petición recibida');
  console.log('👤 Usuario:', req.user?._id || req.user?.userId);
  try {
    const { type, limit = 10 } = req.query;
    
    const tasks = await Task.getPendingItems(req.user._id, type, {
      limit: parseInt(limit),
      sort: { dueDate: 1 }
    });
    
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error al obtener tareas pendientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener las tareas pendientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener tareas vencidas
router.get('/overdue', async (req, res) => {
  try {
    const tasks = await Task.getOverdueItems(req.user._id);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error al obtener tareas vencidas:', error);
    res.status(500).json({ 
      message: 'Error al obtener las tareas vencidas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener recordatorios próximos
router.get('/reminders/upcoming', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const reminders = await Task.getUpcomingReminders(req.user._id, parseInt(hours));
    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('Error al obtener recordatorios próximos:', error);
    res.status(500).json({ 
      message: 'Error al obtener los recordatorios próximos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener estadísticas
router.get('/stats', async (req, res) => {
  try {
    const stats = await Task.getStats(req.user._id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener items por fecha
router.get('/date/:date', async (req, res) => {
  try {
    const { type } = req.query;
    const date = new Date(req.params.date);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Fecha inválida' });
    }
    
    const items = await Task.getItemsByDate(req.user._id, date, type);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error al obtener items por fecha:', error);
    res.status(500).json({ 
      message: 'Error al obtener items por fecha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Buscar tareas por texto (título, descripción, categoría, tags)
router.get('/search/:query', async (req, res) => {
  try {
    const { query: searchText } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchQuery = buildSearchQuery(searchText, req.user._id);
    
    const [tasks, total] = await Promise.all([
      Task.find(searchQuery)
        .sort({ dueDate: 1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Task.countDocuments(searchQuery)
    ]);
    
    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al buscar tareas:', error);
    res.status(500).json({ 
      message: 'Error al buscar tareas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener una tarea específica
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const task = await findTaskById(req.params.id, req.user._id, true);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ 
      message: 'Error al obtener la tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar una tarea o recordatorio
router.put('/:id', validateObjectId, updateTaskLimiter, async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = updateTaskSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    if (value.chatOrigin) {
      const originOk = await validateChatOriginForUser(value.chatOrigin, req.user._id);
      if (!originOk) {
        return res.status(400).json({
          message: 'Origen de chat inválido: la conversación o el mensaje no existe o no pertenece al usuario'
        });
      }
      value.chatOrigin = {
        conversationId: new mongoose.Types.ObjectId(value.chatOrigin.conversationId),
        sourceMessageId: new mongoose.Types.ObjectId(value.chatOrigin.sourceMessageId),
        source: value.chatOrigin.source
      };
    }

    // No permitir cambiar tipo ni usuario
    delete value.itemType;
    delete value.userId;

    const task = await findTaskById(req.params.id, req.user._id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const previousStatus = task.status;

    // Actualizar campos (merge para objetos anidados)
    Object.keys(value).forEach(key => {
      if (key === 'notifications') {
        task.notifications = {
          ...task.notifications,
          ...value.notifications
        };
      } else if (key === 'repeat') {
        task.repeat = {
          ...task.repeat,
          ...value.repeat
        };
      } else {
        task[key] = value[key];
      }
    });

    await task.save();
    await bumpUserTasksCompletedIfNewlyCompleted(req.user._id, previousStatus, task);

    res.json({ 
      success: true, 
      message: 'Tarea actualizada exitosamente',
      data: task 
    });
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(400).json({ 
      message: 'Error al actualizar la tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar una tarea o recordatorio (soft delete)
router.delete('/:id', validateObjectId, deleteTaskLimiter, async (req, res) => {
  try {
    const task = await findTaskById(req.params.id, req.user._id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    await task.softDelete();
    
    res.json({ 
      success: true,
      message: 'Tarea eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ 
      message: 'Error al eliminar la tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Marcar tarea como completada
router.patch('/:id/complete', validateObjectId, patchTaskLimiter, async (req, res) => {
  try {
    const task = await findTaskById(req.params.id, req.user._id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const previousStatus = task.status;

    await task.markAsCompleted();
    await bumpUserTasksCompletedIfNewlyCompleted(req.user._id, previousStatus, task);

    res.json({ 
      success: true, 
      message: 'Tarea marcada como completada',
      data: task 
    });
  } catch (error) {
    console.error('Error al completar tarea:', error);
    res.status(400).json({ 
      message: error.message || 'Error al completar la tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Marcar tarea como en progreso
router.patch('/:id/in-progress', validateObjectId, patchTaskLimiter, async (req, res) => {
  try {
    const task = await findTaskById(req.params.id, req.user._id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    await task.markAsInProgress();
    
    res.json({ 
      success: true, 
      message: 'Tarea marcada como en progreso',
      data: task 
    });
  } catch (error) {
    console.error('Error al marcar tarea en progreso:', error);
    res.status(400).json({ 
      message: error.message || 'Error al marcar la tarea en progreso',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cancelar tarea
router.patch('/:id/cancel', validateObjectId, patchTaskLimiter, async (req, res) => {
  try {
    const task = await findTaskById(req.params.id, req.user._id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    await task.cancel();
    
    res.json({ 
      success: true, 
      message: 'Tarea cancelada',
      data: task 
    });
  } catch (error) {
    console.error('Error al cancelar tarea:', error);
    res.status(400).json({ 
      message: 'Error al cancelar la tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Sugerir subtareas con LLM (1–5) y persistir las que no dupliquen títulos existentes
router.post('/:id/subtasks/generate', validateObjectId, patchTaskLimiter, async (req, res) => {
  try {
    const task = await findTaskById(req.params.id, req.user._id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (task.itemType !== 'task' && task.itemType !== 'goal') {
      return res.status(400).json({
        message: 'Solo tareas y metas admiten generación de subtareas'
      });
    }

    if (task.status === 'completed' || task.status === 'cancelled') {
      return res.status(400).json({
        message: 'No se pueden sugerir subtareas en una tarea completada o cancelada'
      });
    }

    const rawTitles = await generateSubtaskTitlesWithLlm({
      title: task.title,
      description: task.description,
      itemType: task.itemType
    });

    const toAdd = pickNewSubtaskTitles(task.subtasks, rawTitles, {
      maxTotal: MAX_SUBTASKS_TOTAL
    });

    if (toAdd.length === 0) {
      return res.json({
        success: true,
        message: 'No se añadieron subtareas nuevas (límite alcanzado o ya existían)',
        addedCount: 0,
        data: task
      });
    }

    for (const t of toAdd) {
      task.subtasks.push({ title: t, completed: false });
    }
    await task.save({ validateModifiedOnly: true });

    res.json({
      success: true,
      message: `${toAdd.length} subtarea(s) añadida(s)`,
      addedCount: toAdd.length,
      data: task
    });
  } catch (error) {
    console.error('Error generando subtareas (LLM):', error);
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        message: 'No se pudo guardar las subtareas. Revisa los datos de la tarea.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    const code = error?.message;
    if (code === 'SUBTASKS_LLM_DISABLED') {
      return res.status(503).json({
        message: 'Generación de subtareas desactivada en el servidor'
      });
    }
    if (code === 'OPENAI_NOT_CONFIGURED') {
      return res.status(503).json({
        message: 'Asistente no disponible (falta configuración en el servidor)'
      });
    }
    if (code === 'LLM_PARSE_FAILED') {
      return res.status(502).json({
        message: 'No se pudo interpretar la respuesta del asistente. Intenta de nuevo.'
      });
    }
    if (code === 'TASK_TITLE_REQUIRED') {
      return res.status(400).json({ message: 'La tarea no tiene un título válido' });
    }
    const status = error?.status ?? error?.statusCode;
    if (status === 408 || /timeout|timed out|ETIMEDOUT/i.test(String(error?.message || ''))) {
      return res.status(504).json({
        message: 'El asistente tardó demasiado. Intenta de nuevo.'
      });
    }
    res.status(500).json({
      message: 'Error al generar subtareas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Agregar subtarea a una tarea
router.post('/:id/subtasks', validateObjectId, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'El título de la subtarea es requerido' });
    }

    const task = await findTaskById(req.params.id, req.user._id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    await task.addSubtask(title.trim());
    
    res.json({ 
      success: true, 
      message: 'Subtarea agregada exitosamente',
      data: task 
    });
  } catch (error) {
    console.error('Error al agregar subtarea:', error);
    res.status(400).json({ 
      message: 'Error al agregar la subtarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Completar subtarea
router.patch('/:id/subtasks/:subtaskIndex/complete', validateObjectId, patchTaskLimiter, async (req, res) => {
  try {
    const subtaskIndex = parseInt(req.params.subtaskIndex);
    
    if (isNaN(subtaskIndex) || subtaskIndex < 0) {
      return res.status(400).json({ message: 'Índice de subtarea inválido' });
    }

    const task = await findTaskById(req.params.id, req.user._id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (subtaskIndex >= task.subtasks.length) {
      return res.status(400).json({ message: 'Índice de subtarea fuera de rango' });
    }

    await task.completeSubtask(subtaskIndex);
    
    res.json({ 
      success: true, 
      message: 'Subtarea completada exitosamente',
      data: task 
    });
  } catch (error) {
    console.error('Error al completar subtarea:', error);
    res.status(400).json({ 
      message: error.message || 'Error al completar la subtarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;