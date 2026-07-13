/**
 * UserFact model: hechos biográficos manuales del usuario.
 * Complementa la extracción automática de userFactsGroundingService.
 * 
 * Permite al usuario y al asistente registrar explícitamente hechos
 * importantes que luego se inyectan en el prompt para grounding.
 */

import mongoose from 'mongoose';

const userFactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fact: {
      type: String,
      required: true,
      maxlength: 150,
      trim: true,
    },
    category: {
      type: String,
      enum: ['work', 'family', 'study', 'health', 'relationships', 'commitment', 'other'],
      default: 'other',
    },
    source: {
      type: String,
      enum: ['user', 'assistant', 'extracted'],
      default: 'user',
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: false,
    },
    metadata: {
      extractedFrom: String, // ID del mensaje si viene de extracción automática
      confidence: Number, // 0-1, para hechos extraídos automáticamente
      verifiedByUser: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para query eficiente por usuario y hechos activos
userFactSchema.index({ userId: 1, isActive: 1, createdAt: -1 });

// Índice para buscar por categoría
userFactSchema.index({ userId: 1, category: 1 });

const UserFact = mongoose.model('UserFact', userFactSchema);

export default UserFact;
