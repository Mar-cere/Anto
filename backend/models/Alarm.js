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
        return /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(v);
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
  active: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

AlarmSchema.index({ userId: 1, active: 1 });

module.exports = mongoose.model('Alarm', AlarmSchema);

