const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes'); // Rutas de usuarios
const emotionRoutes = require('./routes/emotionRoutes'); // Rutas de emociones
const alarmRoutes = require('./routes/alarmRoutes');

dotenv.config();

const app = express();

// Conexión a MongoDB
const connectDB = async () => {
  try {
    console.log('[Conexión DB] Intentando conectar a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[Conexión DB] Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('[Conexión DB] Error al conectar a MongoDB:', error.message);
    process.exit(1); // Detiene el servidor si no se conecta a la base de datos
  }
};
connectDB();

// Middleware
app.use(express.json()); // Parsear JSON en las solicitudes
console.log('[Middleware] Middleware JSON activado.');

// Rutas
app.use('/api/users', (req, res, next) => {
  console.log(`[Rutas] Accediendo a /api/users con método ${req.method}`);
  next();
}, userRoutes);

app.use('/api/emotions', (req, res, next) => {
  console.log(`[Rutas] Accediendo a /api/emotions con método ${req.method}`);
  next();
}, emotionRoutes);

app.use('/api/alarms', (req, res, next) => {
  console.log(`[Rutas] Accediendo a /api/alarms con método ${req.method}`);
  next();
}, alarmRoutes);

// Manejo de errores 404
app.use((req, res) => {
  console.warn(`[Errores 404] Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('[Errores Globales] Stack de errores:', err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// Puerto de escucha
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[Servidor] Servidor corriendo en el puerto ${PORT}`);
});
