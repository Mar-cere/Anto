/**
 * Servidor principal de la aplicación
 * 
 * Este archivo configura y ejecuta el servidor Express, estableciendo
 * middlewares, rutas y conexión a la base de datos.
 * 
 * @version 1.2.0
 * @author AntoApp Team
 */

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import http from 'http';
import mongoose from 'mongoose';
import morgan from 'morgan';

// Importación de configuración y middleware
import config from './config/config.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sanitizeAll } from './middleware/sanitizeInput.js';
import { performanceMiddleware } from './middleware/performance.js';
import { ensureIndexes } from './middleware/queryOptimizer.js';
import logger from './utils/logger.js';
import { initializeSentry } from './utils/sentry.js';

// Importación de rutas
import { setupSocketIO } from './config/socket.js';
import { setupSwagger } from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import cloudinaryRoutes from './routes/cloudinary.js';
import crisisRoutes from './routes/crisisRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import notificationEngagementRoutes from './routes/notificationEngagementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentMetricsRoutes from './routes/paymentMetricsRoutes.js';
import paymentRecoveryRoutes from './routes/paymentRecoveryRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import responseFeedbackRoutes from './routes/responseFeedbackRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import testNotificationRoutes from './routes/testNotificationRoutes.js';
import therapeuticTechniquesRoutes from './routes/therapeuticTechniquesRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Constantes de configuración
const APP_VERSION = '1.2.0';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_REQUESTS = 100;
const ALLOWED_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const ALLOWED_HEADERS = ['Content-Type', 'Authorization'];
const MONGODB_CONNECTION_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
};

// Constantes de servicios
const SERVICES = {
  TASKS: 'tasks',
  HABITS: 'habits',
  USERS: 'users',
  AUTH: 'auth',
  CHAT: 'chat',
  CLOUDINARY: 'cloudinary'
};

// Helper: obtener estado de MongoDB
const getMongoDBStatus = () => {
  const state = mongoose.connection.readyState;
  return state === MONGODB_CONNECTION_STATES.CONNECTED ? 'connected' : 'disconnected';
};

// Helper: cerrar conexión de MongoDB
const closeMongoDBConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info('✅ Conexión a MongoDB cerrada correctamente');
  } catch (err) {
    logger.error('❌ Error al cerrar conexión a MongoDB', { error: err.message });
  }
};

// Helper: manejar señales de terminación
const handleShutdown = (signal) => {
  logger.info(`👋 Recibida señal ${signal}. Cerrando servidor...`);
  closeMongoDBConnection().then(() => {
    logger.info('👋 Servidor cerrado correctamente');
    process.exit(0);
  });
};

// Inicialización de la aplicación
const app = express();
const PORT = config.app.port;

logger.info('🔧 Inicializando servidor...');
logger.info(`📋 Puerto configurado: ${PORT}`);
logger.info(`🌍 Ambiente: ${config.app.environment}`);

// Configuración de proxy (necesario para rate limiting detrás de proxy y SSL)
app.set('trust proxy', 1);

// Redirección HTTP → HTTPS en producción
if (config.app.environment === 'production') {
  app.use((req, res, next) => {
    // Verificar si la petición es HTTP y no es un health check
    if (req.header('x-forwarded-proto') !== 'https' && req.path !== '/health') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Ruta de prueba simple (lo más básico posible)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Health check endpoint básico (antes de middlewares pesados)
// Esta ruta debe estar disponible siempre, incluso si otros servicios fallan
app.get('/health', (req, res) => {
  try {
    const mongoStatus = getMongoDBStatus();
    const response = { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus,
      services: {
        [SERVICES.TASKS]: 'active',
        [SERVICES.HABITS]: 'active',
        [SERVICES.USERS]: 'active',
        [SERVICES.AUTH]: 'active',
        [SERVICES.CHAT]: 'active',
        [SERVICES.CLOUDINARY]: 'active'
      },
      version: APP_VERSION
    };
    const statusCode = mongoStatus === 'connected' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('❌ Error en health check', { error: error.message });
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      mongodb: 'error',
      error: error.message,
      version: APP_VERSION
    });
  }
});

logger.info('✅ Rutas / y /health registradas');

// Configuración de seguridad básica
// Configuración de Helmet con opciones de seguridad mejoradas
app.use(helmet({
  contentSecurityPolicy: config.app.environment === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // Desactivar CSP en desarrollo para facilitar debugging
  hsts: config.app.environment === 'production' ? {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  } : false, // Solo en producción
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Configuración de CORS
// En producción, permitir múltiples orígenes o usar el frontendUrl configurado
const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      config.app.frontendUrl,
      'https://anto-ion2.onrender.com',
      'http://localhost:3000',
      'http://localhost:19006', // Expo dev server
      /^https:\/\/.*\.onrender\.com$/, // Cualquier subdominio de Render
    ];
    
    // Verificar si el origen está permitido
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed || config.app.environment === 'development') {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ALLOWED_HTTP_METHODS,
  allowedHeaders: [...ALLOWED_HEADERS, 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

// Middleware de performance (medir tiempos de respuesta)
app.use(performanceMiddleware);

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitización global de inputs (después de body parsing, antes de rutas)
// Excluir webhooks y rutas que manejan datos binarios
app.use((req, res, next) => {
  // Excluir sanitización para webhooks y rutas específicas
  const excludedPaths = [
    '/api/payments/webhook', // Webhook de Mercado Pago necesita datos sin sanitizar
    '/api/health', // Health check no necesita sanitización
    '/health' // Health check básico
  ];
  
  if (excludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Aplicar sanitización a todas las demás rutas
  sanitizeAll(req, res, next);
});

// Compresión de respuestas (gzip)
app.use(compression());

// Middleware de logging (solo en desarrollo)
if (config.app.environment === 'development') {
  app.use(morgan('dev'));
}

// Configuración de rate limiting (excluir /health)
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  skip: (req) => req.path === '/health' // Excluir /health del rate limiting
});
app.use(limiter);

// Conexión a MongoDB (no bloquea el inicio del servidor)
const connectMongoDB = async () => {
  // En modo test, no conectar automáticamente - los tests manejan su propia conexión
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    // Verificar que la URI esté definida
    if (!config.mongodb.uri) {
      console.warn('⚠️ MONGO_URI no está definida en las variables de entorno');
      return;
    }

    // Validar formato de URI
    if (!config.mongodb.uri.startsWith('mongodb://') && !config.mongodb.uri.startsWith('mongodb+srv://')) {
      console.warn('⚠️ MONGO_URI debe comenzar con mongodb:// o mongodb+srv://');
      return;
    }

    // Asegurar que la URI tenga un nombre de base de datos
    let mongoUri = config.mongodb.uri;
    if (!mongoUri.includes('/?') && !mongoUri.match(/\/[^?]+(\?|$)/)) {
      // Si no tiene nombre de base de datos, agregar uno por defecto
      const separator = mongoUri.includes('?') ? '&' : '?';
      mongoUri = mongoUri.replace(/\?/, `${separator}dbName=anto`);
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // Timeout de 10 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
      maxPoolSize: 10, // Mantener hasta 10 conexiones en el pool
      retryWrites: true,
      w: 'majority'
    });

    logger.info('✅ Conexión exitosa a MongoDB');
    logger.info(`📊 Base de datos: ${mongoose.connection.name || 'default'}`);
    
    // Asegurar índices después de conectar
    try {
      await ensureIndexes();
    } catch (error) {
      logger.warn('Error al crear índices:', { error: error.message });
    }
    
    // Manejar eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error('❌ Error en la conexión de MongoDB', { error: err.message });
      logger.critical('Error crítico de base de datos', { error: err });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB desconectado. Intentando reconectar...');
    });

  } catch (err) {
    logger.error('❌ Error conectando a MongoDB', { 
      error: err.message,
      stack: err.stack 
    });
    logger.warn('⚠️ El servidor continuará sin MongoDB. Algunas funcionalidades no estarán disponibles.');
    // NO hacer process.exit(1) para que el servidor pueda iniciar
  }
};

// Conectar a MongoDB de forma asíncrona (no bloquea el inicio)
connectMongoDB();

// Rutas de la API
logger.info('📋 Registrando rutas de la API...');
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/crisis', crisisRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications', notificationEngagementRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/therapeutic-techniques', therapeuticTechniquesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments', paymentRecoveryRoutes);
app.use('/api/payments', paymentMetricsRoutes);
app.use('/api/feedback', responseFeedbackRoutes);
app.use('/api/health', healthRoutes);

// Rutas de testing (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/notifications', testNotificationRoutes);
  logger.debug('✅ Rutas de testing de notificaciones registradas');
}

logger.info('✅ Todas las rutas registradas');

// Inicializar Sentry si está configurado (después de crear app)
initializeSentry(app);

// Configurar Swagger (solo en desarrollo o si está habilitado)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  setupSwagger(app);
  logger.info('✅ Swagger configurado en /api-docs');
}

// Manejo de rutas no encontradas (debe ir antes del errorHandler)
app.use(notFoundHandler);

// Manejo global de errores (debe ser el último middleware)
app.use(errorHandler);

// Exportar la app para tests (antes de iniciar el servidor)
export { app };

// Iniciar servidor solo si no estamos en modo test
// En modo test, el servidor no se inicia automáticamente para evitar conflictos de puerto
if (process.env.NODE_ENV !== 'test') {
  // Siempre escuchar en 0.0.0.0 para que funcione en Render y otros servicios en la nube
  // 0.0.0.0 también funciona en localhost, así que es seguro usarlo siempre
  const HOST = '0.0.0.0';
  const isRender = process.env.RENDER === 'true' || !!process.env.PORT;

  // Crear servidor HTTP para Socket.IO
  const server = http.createServer(app);
  
  // Configurar Socket.IO
  const io = setupSocketIO(server);
  
  // Exportar io para uso en otros módulos
  app.set('io', io);
  
  server.listen(PORT, HOST, () => {
  logger.info(`🚀 Servidor corriendo en ${HOST}:${PORT}`);
  logger.info(`📝 Ambiente: ${config.app.environment}`);
  logger.info(`🔗 URL Frontend: ${config.app.frontendUrl}`);
  logger.info(`🌐 Servidor accesible desde: ${HOST === '0.0.0.0' ? 'cualquier IP (Render)' : 'localhost'}`);
  logger.info(`🔍 Render detectado: ${isRender ? 'Sí' : 'No'}`);
  
  // Iniciar servicio de recordatorios periódicos (solo en producción o si está habilitado, NO en test)
  if (process.env.ENABLE_REMINDERS !== 'false' && process.env.NODE_ENV !== 'test') {
    const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
    
    // Ejecutar inmediatamente al iniciar (solo en producción)
    if (config.app.environment === 'production') {
      setTimeout(async () => {
        try {
          const emergencyReminderService = (await import('./services/emergencyReminderService.js')).default;
          logger.info('📧 Iniciando envío de recordatorios de contactos de emergencia...');
          await emergencyReminderService.sendRemindersToAllUsers();
        } catch (error) {
          logger.error('❌ Error en servicio de recordatorios', { error: error.message });
        }
      }, 60000); // Esperar 1 minuto después del inicio
    }
    
    // Programar ejecución diaria
    setInterval(async () => {
      try {
        const emergencyReminderService = (await import('./services/emergencyReminderService.js')).default;
        logger.info('📧 Ejecutando recordatorios periódicos de contactos de emergencia...');
        await emergencyReminderService.sendRemindersToAllUsers();
      } catch (error) {
        logger.error('❌ Error en servicio de recordatorios', { error: error.message });
      }
    }, REMINDER_INTERVAL_MS);
    
    logger.info('✅ Servicio de recordatorios de contactos de emergencia iniciado (cada 24 horas)');
  }

  // Iniciar servicio de seguimiento post-crisis (NO en test)
  if (process.env.ENABLE_CRISIS_FOLLOWUP !== 'false' && process.env.NODE_ENV !== 'test') {
    setTimeout(async () => {
      try {
        const crisisFollowUpService = (await import('./services/crisisFollowUpService.js')).default;
        logger.info('📋 Iniciando servicio de seguimiento post-crisis...');
        crisisFollowUpService.start();
      } catch (error) {
        logger.error('❌ Error iniciando servicio de seguimiento post-crisis', { error: error.message });
      }
    }, 120000); // Esperar 2 minutos después del inicio para que MongoDB esté listo
  }

  // Iniciar servicio de programación de notificaciones (NO en test)
  if (process.env.ENABLE_NOTIFICATION_SCHEDULER !== 'false' && process.env.NODE_ENV !== 'test') {
    setTimeout(async () => {
      try {
        const notificationScheduler = (await import('./services/notificationScheduler.js')).default;
        logger.info('📅 Iniciando servicio de programación de notificaciones...');
        notificationScheduler.start();
      } catch (error) {
        logger.error('❌ Error iniciando servicio de programación de notificaciones', { error: error.message });
      }
    }, 180000); // Esperar 3 minutos después del inicio para que MongoDB esté listo
  }
  });
}

// Manejo de señales de terminación (solo si el servidor se inició)
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default app;