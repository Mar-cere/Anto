const express = require('express');
const mongoose = require('mongoose'); // Asegúrate de importar mongoose si estás usando MongoDB
const userRoutes = require('./routes/userRoutes');
require('dotenv').config(); // Importar dotenv para manejar variables de entorno

const app = express();

// Conexión a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1); // Detiene el servidor si no se conecta a la base de datos
  }
};
connectDB();

// Middleware
app.use(express.json()); // Parsear JSON en las solicitudes

// Rutas
app.use('/api/users', userRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// Puerto de escucha
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
