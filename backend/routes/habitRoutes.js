/**
 * Rutas de Hábitos - Gestiona CRUD de hábitos, progreso, estadísticas y recordatorios
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';
import Habit from '../models/Habit.js';

const router = express.Router();

// Constantes de configuración
const VALID_ICONS = [
  'exercise', 'meditation', 'reading', 'water', 
  'sleep', 'study', 'diet', 'coding', 'workout',
  'yoga', 'journal', 'music', 'art', 'language'
];
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;
const MIN_WEEK = 1;
const MAX_WEEK = 53;
const MIN_MONTH = 1;
const MAX_MONTH = 12;

// Rate limiters: control de frecuencia de peticiones
const createHabitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: 'Demasiados hábitos creados. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const updateHabitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: 'Demasiadas actualizaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const deleteHabitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: 'Demasiadas eliminaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const patchHabitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: 'Demasiadas modificaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Helper: buscar hábito por ID y validar propiedad
const findHabitById = async (habitId, userId) => {
  // Asegurar que los IDs sean ObjectIds válidos
  if (!mongoose.Types.ObjectId.isValid(habitId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }
  return await Habit.findOne({
    _id: new mongoose.Types.ObjectId(habitId),
    userId: new mongoose.Types.ObjectId(userId)
  });
};

// Helper: validar año
const validateYear = (year) => {
  const yearNum = parseInt(year);
  return !isNaN(yearNum) && yearNum >= MIN_YEAR && yearNum <= MAX_YEAR;
};

// Helper: validar semana
const validateWeek = (week) => {
  const weekNum = parseInt(week);
  return !isNaN(weekNum) && weekNum >= MIN_WEEK && weekNum <= MAX_WEEK;
};

// Helper: validar mes
const validateMonth = (month) => {
  const monthNum = parseInt(month);
  return !isNaN(monthNum) && monthNum >= MIN_MONTH && monthNum <= MAX_MONTH;
};

// Esquemas de validación Joi
const notificationSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  time: Joi.date().optional(),
  days: Joi.array()
    .items(Joi.number().min(0).max(6))
    .default([0, 1, 2, 3, 4, 5, 6])
    .messages({
      'number.min': 'Los días deben estar entre 0 y 6',
      'number.max': 'Los días deben estar entre 0 y 6'
    }),
  message: Joi.string()
    .max(200)
    .messages({
      'string.max': 'El mensaje debe tener máximo 200 caracteres'
    })
});

const habitSchema = Joi.object({
  title: Joi.string()
    .required()
    .max(100)
    .trim()
    .messages({
      'string.empty': 'El título es requerido',
      'string.max': 'El título debe tener máximo 100 caracteres',
      'any.required': 'El título es requerido'
    }),
  description: Joi.string()
    .max(500)
    .trim()
    .allow('', null)
    .default('')
    .messages({
      'string.max': 'La descripción debe tener máximo 500 caracteres'
    }),
  icon: Joi.string()
    .required()
    .valid(...VALID_ICONS)
    .messages({
      'any.required': 'El icono es requerido',
      'any.only': 'Icono no válido'
    }),
  frequency: Joi.string()
    .valid('daily', 'weekly', 'monthly')
    .required()
    .messages({
      'any.required': 'La frecuencia es requerida',
      'any.only': 'Frecuencia no válida'
    }),
  reminder: notificationSchema.default({}),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'any.only': 'Prioridad no válida'
    }),
  category: Joi.string()
    .max(50)
    .trim()
    .default('General')
    .messages({
      'string.max': 'La categoría debe tener máximo 50 caracteres'
    }),
  tags: Joi.array()
    .items(
      Joi.string().max(30).trim().messages({
        'string.max': 'Cada etiqueta debe tener máximo 30 caracteres'
      })
    )
    .default([]),
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional()
    .messages({
      'string.pattern.base': 'El color debe ser un código hexadecimal válido'
    }),
  goal: Joi.object({
    target: Joi.number()
      .min(1)
      .messages({
        'number.min': 'El objetivo debe ser al menos 1'
      }),
    unit: Joi.string()
      .max(20)
      .messages({
        'string.max': 'La unidad debe tener máximo 20 caracteres'
      }),
    period: Joi.string()
      .valid('day', 'week', 'month')
      .messages({
        'any.only': 'Período no válido'
      })
  }).optional()
});

// Obtener todos los hábitos del usuario con filtros
router.get('/', async (req, res) => {
  console.log('📋 GET /api/habits - Petición recibida');
  console.log('👤 Usuario:', req.user?._id || req.user?.userId);
  try {
    const { 
      status, 
      frequency, 
      priority, 
      search, 
      overdue,
      category,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const query = { 
      userId: userId,
      deletedAt: { $exists: false }
    };

    // Filtrar por estado (active/archived)
    if (status) {
      query['status.archived'] = status === 'archived';
    }

    // Filtrar por frecuencia
    if (frequency) {
      query.frequency = frequency;
    }

    // Filtrar por prioridad
    if (priority) {
      query.priority = priority;
    }

    // Filtrar por categoría
    if (category) {
      query.category = category;
    }

    // Filtrar por vencidos
    if (overdue === 'true') {
      query['status.isOverdue'] = true;
    }

    // Búsqueda por título o descripción
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Validar y procesar parámetros de paginación
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Validar y procesar parámetros de ordenamiento
    const sortOptions = ['createdAt', '-createdAt', 'priority', '-priority', 'title', '-title'];
    const sortField = sortOptions.includes(sort) ? sort : '-createdAt';

    const [habits, total] = await Promise.all([
      Habit.find(query)
        .sort(sortField)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Habit.countDocuments(query)
    ]);

    // Calcular estadísticas adicionales
    // Optimización: Proyectar solo campos necesarios antes de agrupar
    const stats = await Habit.aggregate([
      { $match: query },
      {
        // Optimización: Proyectar solo campos necesarios
        $project: {
          'status.archived': 1,
          'progress.completedDates': 1
        }
      },
      {
        $group: {
          _id: null,
          totalHabits: { $sum: 1 },
          activeHabits: {
            $sum: { $cond: [{ $eq: ['$status.archived', false] }, 1, 0] }
          },
          completedToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status.archived', false] },
                    { 
                      $in: [
                        new Date().toISOString().split('T')[0], 
                        { $ifNull: ['$progress.completedDates', []] }
                      ] 
                    }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        habits,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        },
        stats: stats[0] || {
          totalHabits: 0,
          activeHabits: 0,
          completedToday: 0
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener hábitos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los hábitos', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener hábitos activos (DEBE estar antes de /:id)
router.get('/active', async (req, res) => {
  console.log('📋 GET /api/habits/active - Petición recibida');
  console.log('👤 Usuario:', req.user?._id || req.user?.userId);
  try {
    const habits = await Habit.getActiveHabits(req.user._id);
    res.json({
      success: true,
      data: habits
    });
  } catch (error) {
    console.error('Error al obtener hábitos activos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los hábitos activos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener hábitos vencidos (DEBE estar antes de /:id)
router.get('/overdue', async (req, res) => {
  try {
    const habits = await Habit.getOverdueHabits(req.user._id);
    res.json({
      success: true,
      data: habits
    });
  } catch (error) {
    console.error('Error al obtener hábitos vencidos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los hábitos vencidos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener estadísticas de hábitos (DEBE estar antes de /:id)
router.get('/stats', async (req, res) => {
  try {
    const stats = await Habit.getStats(req.user._id);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener las estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener progreso semanal (DEBE estar antes de /:id)
router.get('/weekly-progress', async (req, res) => {
  try {
    const { year, week } = req.query;
    
    if (!validateYear(year) || !validateWeek(week)) {
      return res.status(400).json({
        success: false,
        message: 'Año o semana inválidos'
      });
    }
    
    const progress = await Habit.getWeeklyProgress(req.user._id, parseInt(year), parseInt(week));
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error al obtener progreso semanal:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el progreso semanal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener progreso mensual (DEBE estar antes de /:id)
router.get('/monthly-progress', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!validateYear(year) || !validateMonth(month)) {
      return res.status(400).json({
        success: false,
        message: 'Año o mes inválidos'
      });
    }
    
    const progress = await Habit.getMonthlyProgress(req.user._id, parseInt(year), parseInt(month));
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error al obtener progreso mensual:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el progreso mensual',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Crear nuevo hábito
router.post('/', createHabitLimiter, async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = habitSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        success: false,
        message: 'Datos inválidos', 
        errors: error.details.map(detail => detail.message)
      });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;

    const habit = new Habit({
      ...value,
      userId: userId,
      status: {
        archived: false,
        isOverdue: false
      },
      progress: {
        streak: 0,
        completedDates: [],
        weeklyProgress: [],
        monthlyProgress: []
      },
      reminder: {
        ...value.reminder,
        lastNotified: null
      }
    });

    await habit.save();
    res.status(201).json({ 
      success: true, 
      data: habit,
      message: 'Hábito creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear hábito:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error al crear el hábito', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar hábito
router.put('/:id', validateObjectId, updateHabitLimiter, async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = habitSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        success: false,
        message: 'Datos inválidos', 
        errors: error.details.map(detail => detail.message)
      });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    // Actualizar hábito (Mongoose timestamps maneja updatedAt automáticamente)
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: userId },
      value,
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'Hábito no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      data: habit,
      message: 'Hábito actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar hábito:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error al actualizar el hábito', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Archivar/desarchivar hábito
router.patch('/:id/archive', validateObjectId, patchHabitLimiter, async (req, res) => {
  try {
    const habit = await findHabitById(req.params.id, req.user._id);
    
    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'Hábito no encontrado' 
      });
    }

    await habit.toggleArchive();
    res.json({ 
      success: true,
      data: habit,
      message: habit.status.archived ? 'Hábito archivado' : 'Hábito desarchivado'
    });
  } catch (error) {
    console.error('Error al archivar hábito:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error al archivar el hábito',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar hábito (soft delete)
router.delete('/:id', validateObjectId, deleteHabitLimiter, async (req, res) => {
  try {
    const habit = await findHabitById(req.params.id, req.user._id);
    
    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'Hábito no encontrado' 
      });
    }

    await habit.softDelete();
    res.json({ 
      success: true,
      message: 'Hábito eliminado correctamente',
      data: { id: habit._id }
    });
  } catch (error) {
    console.error('Error al eliminar hábito:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar el hábito', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Marcar hábito como completado/no completado
router.patch('/:id/toggle', validateObjectId, patchHabitLimiter, async (req, res) => {
  try {
    const habit = await findHabitById(req.params.id, req.user._id);
    
    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'Hábito no encontrado' 
      });
    }

    if (habit.status.archived) {
      return res.status(400).json({ 
        success: false,
        message: 'No se puede modificar un hábito archivado' 
      });
    }

    await habit.toggleComplete();
    res.json({ 
      success: true, 
      data: habit,
      message: 'Estado del hábito actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado del hábito:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error al actualizar el hábito', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar recordatorio del hábito
router.patch('/:id/reminder', validateObjectId, patchHabitLimiter, async (req, res) => {
  try {
    const { error, value } = notificationSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const habit = await findHabitById(req.params.id, req.user._id);

    if (!habit) {
      return res.status(404).json({ 
        success: false,
        message: 'Hábito no encontrado' 
      });
    }

    habit.reminder = {
      ...habit.reminder,
      ...value,
      lastNotified: null
    };

    await habit.save();
    res.json({ 
      success: true, 
      data: habit,
      message: 'Recordatorio actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar recordatorio:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error al actualizar el recordatorio', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router; 