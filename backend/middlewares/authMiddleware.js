const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// Middleware para validar credenciales del usuario
const validateUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('[Middleware] Contraseña ingresada:', password);
    console.log('[Middleware] Hash almacenado:', user.password);
    console.log('[Middleware] ¿Contraseña válida?:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Añadir el usuario y token al request para su uso posterior
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };
    req.token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    next(); // Continuar con la ruta
  } catch (error) {
    console.error('[Middleware] Error en validación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Middleware para autenticar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Obtener token del encabezado

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }

    req.user = user; // Añadir datos del usuario al request
    next(); // Continuar con la ruta
  });
};

module.exports = { validateUser, authenticateToken };
