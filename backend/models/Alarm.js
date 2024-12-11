const mongoose = require('mongoose');

const AlarmSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i.test(v);
      },
      message: props => `${props.value} no es un formato de hora válido!`
    }
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Medicamentos', 'Pausas', 'Hábitos', 'Citas', 'General'],
    default: 'General',
  },
  repeatDays: {
    monday: { type: Boolean, default: false },
    tuesday: { type: Boolean, default: false },
    wednesday: { type: Boolean, default: false },
    thursday: { type: Boolean, default: false },
    friday: { type: Boolean, default: false },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false },
  },
  active: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

AlarmSchema.index({ userId: 1, active: 1 });

module.exports = mongoose.model('Alarm', AlarmSchema);

