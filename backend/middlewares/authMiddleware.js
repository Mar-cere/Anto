const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

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

module.exports = validateUser;

