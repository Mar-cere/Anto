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

// Configuración de proxy (necesario para rate limiting detrás de proxy)
app.set('trust proxy', 1);

// Configuración de seguridad básica
app.use(helmet());

// Configuración de CORS
app.use(cors({
  origin: config.app.frontendUrl,
  methods: ALLOWED_HTTP_METHODS,
  allowedHeaders: ALLOWED_HEADERS
}));

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS
});
app.use(limiter);

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging (solo en desarrollo)
if (config.app.environment === 'development') {
  app.use(morgan('dev'));
}

// Conexión a MongoDB
mongoose.connect(config.mongodb.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conexión exitosa a MongoDB'))
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  process.exit(1);
});

// Rutas de la API
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: getMongoDBStatus(),
    services: {
      [SERVICES.TASKS]: 'active',
      [SERVICES.HABITS]: 'active',
      [SERVICES.USERS]: 'active',
      [SERVICES.AUTH]: 'active',
      [SERVICES.CHAT]: 'active',
      [SERVICES.CLOUDINARY]: 'active'
    },
    version: APP_VERSION
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo global de errores (debe ser el último middleware)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📝 Ambiente: ${config.app.environment}`);
  console.log(`🔗 URL Frontend: ${config.app.frontendUrl}`);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;