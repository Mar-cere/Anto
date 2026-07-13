/**
 * UserFact model: hechos biográficos manuales del usuario.
 * Complementa la extracción automática de userFactsGroundingService.
 * 
 * Permite al usuario y al asistente registrar explícitamente hechos
 * importantes que luego se inyectan en el prompt para grounding.
 * 
 * ## Límites y validaciones
 * 
 * - Fact: 5-150 caracteres después de sanitizar
 * - Categorías: work, family, study, health, relationships, commitment, other
 * - Sources: user, assistant, extracted
 * - Confidence: 0-1 (solo para hechos extraídos automáticamente)
 * - Pre-save hook sanitiza: saltos de línea, tabs, caracteres problemáticos
 * 
 * ## Índices recomendados
 * 
 * - `{ userId: 1, isActive: 1, createdAt: -1 }` - Query principal de hechos activos
 * - `{ userId: 1, category: 1 }` - Filtrado por categoría
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
      minlength: [5, 'Fact must be at least 5 characters long'],
      maxlength: [150, 'Fact cannot exceed 150 characters'],
      trim: true,
      validate: {
        validator: function (v) {
          // Validar que no sea solo espacios o caracteres problemáticos
          return v && v.trim().length >= 5;
        },
        message: 'Fact must contain meaningful content (at least 5 non-whitespace characters)',
      },
    },
    category: {
      type: String,
      enum: {
        values: ['work', 'family', 'study', 'health', 'relationships', 'commitment', 'other'],
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
    },
    source: {
      type: String,
      enum: {
        values: ['user', 'assistant', 'extracted'],
        message: '{VALUE} is not a valid source',
      },
      default: 'user',
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: false,
    },
    metadata: {
      extractedFrom: String,
      confidence: {
        type: Number,
        min: [0, 'Confidence must be between 0 and 1'],
        max: [1, 'Confidence must be between 0 and 1'],
        default: undefined,
      },
      verifiedByUser: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Pre-save hook para sanitización adicional
userFactSchema.pre('save', function (next) {
  if (this.isModified('fact')) {
    // Sanitizar el fact: remover saltos de línea, tabs, caracteres problemáticos
    let sanitized = this.fact
      .replace(/[\r\n\t]+/g, ' ') // Eliminar saltos de línea y tabs
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .replace(/[<>{}]/g, '') // Remover caracteres problemáticos
      .trim();

    // Validar longitud después de sanitizar
    if (sanitized.length < 5) {
      return next(new Error('Fact must contain at least 5 meaningful characters after sanitization'));
    }

    this.fact = sanitized;
  }
  next();
});

const UserFact = mongoose.model('UserFact', userFactSchema);

export default UserFact;
