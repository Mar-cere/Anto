const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      unique: true,
      default: uuidv4,
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
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido'],
    },
    password: {
      type: String,
      required: true,
    },
    preferences: {
      language: {
        type: String,
        default: 'es',
      },
      theme: {
        type: String,
        default: 'light',
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
      enum: ['admin', 'user'],
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
    timestamps: true,
  }
);

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error al comparar contraseñas');
  }
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
