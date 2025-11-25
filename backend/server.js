/**
 * Servidor principal de la aplicación
 * 
 * Este archivo configura y ejecuta el servidor Express, estableciendo
 * middlewares, rutas y conexión a la base de datos.
 * 
 * @version 1.2.0
 * @author AntoApp Team
 */

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

// Importación de configuración y middleware
import config from './config/config.js';
import { errorHandler } from './middleware/errorHandler.js';

// Importación de rutas
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import cloudinaryRoutes from './routes/cloudinary.js';
import habitRoutes from './routes/habitRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import crisisRoutes from './routes/crisisRoutes.js';

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
    console.log('✅ Conexión a MongoDB cerrada correctamente');
  } catch (err) {
    console.error('❌ Error al cerrar conexión a MongoDB:', err);
  }
};

// Helper: manejar señales de terminación
const handleShutdown = (signal) => {
  console.log(`👋 Recibida señal ${signal}. Cerrando servidor...`);
  closeMongoDBConnection().then(() => {
    process.exit(0);
  });
};

// Inicialización de la aplicación
const app = express();
const PORT = config.app.port;

console.log('🔧 Inicializando servidor...');
console.log(`📋 Puerto configurado: ${PORT}`);
console.log(`🌍 Ambiente: ${config.app.environment}`);

// Configuración de proxy (necesario para rate limiting detrás de proxy)
app.set('trust proxy', 1);

// Ruta de prueba simple (lo más básico posible)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Ruta de health check (PRIMERO, antes de cualquier middleware)
// Esta ruta debe estar disponible siempre, incluso si otros servicios fallan
app.get('/health', (req, res) => {
  try {
    console.log('📊 Health check solicitado - Inicio');
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
    console.log('📤 Enviando respuesta de health');
    res.status(200).json(response);
    console.log('✅ Respuesta enviada');
  } catch (error) {
    console.error('❌ Error en health check:', error);
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      mongodb: 'error',
      error: error.message,
      version: APP_VERSION
    });
  }
});

console.log('✅ Rutas / y /health registradas');

// Configuración de seguridad básica
app.use(helmet({
  contentSecurityPolicy: false // Desactivar CSP para APIs
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

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    console.log('✅ Conexión exitosa a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.name || 'default'}`);
    
    // Manejar eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error en la conexión de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado. Intentando reconectar...');
    });

  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err);
    console.error('💡 Verifica que:');
    console.error('   1. La URI de MongoDB esté correcta en el archivo .env');
    console.error('   2. Tu conexión a internet esté activa');
    console.error('   3. El cluster de MongoDB Atlas esté accesible');
    console.error('   4. Tu IP esté en la whitelist de MongoDB Atlas');
    console.warn('⚠️ El servidor continuará sin MongoDB. Algunas funcionalidades no estarán disponibles.');
    // NO hacer process.exit(1) para que el servidor pueda iniciar
  }
};

// Conectar a MongoDB de forma asíncrona (no bloquea el inicio)
connectMongoDB();

// Rutas de la API
console.log('📋 Registrando rutas de la API...');
app.use('/api/tasks', taskRoutes);
console.log('✅ Ruta /api/tasks registrada');
app.use('/api/habits', habitRoutes);
console.log('✅ Ruta /api/habits registrada');
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/crisis', crisisRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
console.log('✅ Todas las rutas registradas');

// Manejo de rutas no encontradas
app.use((req, res) => {
  console.log(`⚠️ Ruta no encontrada: ${req.method} ${req.path}`);
  console.log(`📋 Headers:`, req.headers);
  res.status(404).json({ 
    message: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Manejo global de errores (debe ser el último middleware)
app.use(errorHandler);

// Iniciar servidor
// Siempre escuchar en 0.0.0.0 para que funcione en Render y otros servicios en la nube
// 0.0.0.0 también funciona en localhost, así que es seguro usarlo siempre
const HOST = '0.0.0.0';
const isRender = process.env.RENDER === 'true' || !!process.env.PORT;

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor corriendo en ${HOST}:${PORT}`);
  console.log(`📝 Ambiente: ${config.app.environment}`);
  console.log(`🔗 URL Frontend: ${config.app.frontendUrl}`);
  console.log(`🌐 Servidor accesible desde: ${HOST === '0.0.0.0' ? 'cualquier IP (Render)' : 'localhost'}`);
  console.log(`🔍 Render detectado: ${isRender ? 'Sí' : 'No'}`);
  
  // Iniciar servicio de recordatorios periódicos (solo en producción o si está habilitado)
  if (process.env.ENABLE_REMINDERS !== 'false') {
    const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
    
    // Ejecutar inmediatamente al iniciar (solo en producción)
    if (config.app.environment === 'production') {
      setTimeout(async () => {
        try {
          const emergencyReminderService = (await import('./services/emergencyReminderService.js')).default;
          console.log('📧 Iniciando envío de recordatorios de contactos de emergencia...');
          await emergencyReminderService.sendRemindersToAllUsers();
        } catch (error) {
          console.error('❌ Error en servicio de recordatorios:', error);
        }
      }, 60000); // Esperar 1 minuto después del inicio
    }
    
    // Programar ejecución diaria
    setInterval(async () => {
      try {
        const emergencyReminderService = (await import('./services/emergencyReminderService.js')).default;
        console.log('📧 Ejecutando recordatorios periódicos de contactos de emergencia...');
        await emergencyReminderService.sendRemindersToAllUsers();
      } catch (error) {
        console.error('❌ Error en servicio de recordatorios:', error);
      }
    }, REMINDER_INTERVAL_MS);
    
    console.log('✅ Servicio de recordatorios de contactos de emergencia iniciado (cada 24 horas)');
  }

  // Iniciar servicio de seguimiento post-crisis
  if (process.env.ENABLE_CRISIS_FOLLOWUP !== 'false') {
    setTimeout(async () => {
      try {
        const crisisFollowUpService = (await import('./services/crisisFollowUpService.js')).default;
        console.log('📋 Iniciando servicio de seguimiento post-crisis...');
        crisisFollowUpService.start();
      } catch (error) {
        console.error('❌ Error iniciando servicio de seguimiento post-crisis:', error);
      }
    }, 120000); // Esperar 2 minutos después del inicio para que MongoDB esté listo
  }
});

// Manejo de señales de terminación
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;