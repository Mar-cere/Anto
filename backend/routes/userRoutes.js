const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Clave secreta para JWT (usando dotenv para mayor seguridad)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// Middleware para parsear el cuerpo de las solicitudes
router.use(express.json());

// Ruta de registro
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Validaciones
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'El formato del correo electrónico no es válido.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe.' });
    }

    // Generar hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name, // Almacenar nombre en texto plano (opcionalmente puedes ofuscarlo)
      email,
      password: hashedPassword,
      uuid: uuidv4(), // Generar un UUID único
    });

    await newUser.save();

    return res.status(201).json({ message: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta de inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: { id: user._id, name: user.name, email: user.email }, // Evitar enviar contraseña
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
