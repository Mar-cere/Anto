const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateUser, authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';
const SALT_ROUNDS = 10;

// Registro de usuario
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  console.log('[Registro] Datos recibidos:', { name, email });

  if (!name || !email || !password) {
    console.log('[Registro] Faltan campos obligatorios');
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    // Normalizar email a minúsculas antes de la búsqueda
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      console.log('[Registro] Usuario ya existente con el email:', normalizedEmail);
      return res.status(400).json({ message: 'El usuario ya existe.' });
    }

    console.log('[Registro] Creando hash para la contraseña...');
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('[Registro] Configuración del hash:', hashedPassword.substring(0, 7));

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    console.log('[Registro] Guardando nuevo usuario en la base de datos...');
    const savedUser = await newUser.save();
    
    console.log('[Registro] Usuario registrado con éxito:', {
      id: savedUser._id,
      email: savedUser.email,
      hashConfig: savedUser.password.substring(0, 7)
    });

    res.status(201).json({ message: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error('[Registro] Error:', error.message);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('[Inicio de sesión] Faltan campos obligatorios');
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    // Normalizar email a minúsculas antes de la búsqueda
    const normalizedEmail = email.toLowerCase();
    console.log('[Inicio de sesión] Buscando usuario con el email:', normalizedEmail);
    
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('[Inicio de sesión] Usuario no encontrado con el email:', normalizedEmail);
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    console.log('[Inicio de sesión] Comparando contraseña...');
    console.log('[Inicio de sesión] Algoritmo del hash almacenado:', user.password.substring(0, 7));
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('[Inicio de sesión] ¿Contraseña válida?:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('[Inicio de sesión] Credenciales inválidas');
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    console.log('[Inicio de sesión] Inicio de sesión exitoso');
    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      },
    });
  } catch (error) {
    console.error('[Inicio de sesión] Error:', error.message);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar perfil de usuario
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validaciones
    if (!name || !email) {
      return res.status(400).json({ message: 'Nombre y email son requeridos' });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user.id } 
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está en uso' });
    }

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});

module.exports = router;
