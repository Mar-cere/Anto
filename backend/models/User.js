const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); // Biblioteca para generar UUID

const UserSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      unique: true,
      default: uuidv4, // Genera un UUID único automáticamente
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido'], // Validación de correo
    },
    password: {
      type: String,
      required: true,
    },
    preferences: {
      language: {
        type: String,
        default: 'es', // Idioma predeterminado
      },
      theme: {
        type: String,
        default: 'light', // Tema predeterminado
      },
    },
    journalEntries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JournalEntry',
      },
    ],
    habits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    alarms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alarm',
      },
    ],
    role: {
      type: String,
      enum: ['admin', 'user'], // Posibles roles
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
  }
);

// Middleware para hash de contraseñas (usando bcrypt)
UserSchema.pre('save', async function (next) {
  // Hash de contraseñas
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  // Encriptar nombres
  if (this.isModified('name')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.name = await bcrypt.hash(this.name, salt);
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Verificar el nombre desencriptado
UserSchema.methods.verifyName = async function (name) {
  return bcrypt.compare(name, this.name);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
