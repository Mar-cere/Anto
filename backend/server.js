require('dotenv').config(); // Carga las variables de entorno desde .env
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Conexión exitosa a MongoDB'))
  .catch((error) => console.error('Error al conectar a MongoDB:', error));
