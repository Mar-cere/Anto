/**
 * Agregado diario (UTC) de uso de tokens OpenAI en este backend.
 * Persiste totales para que el informe por correo sobreviva a reinicios del proceso.
 */
import mongoose from 'mongoose';

const openAITokenUsageDaySchema = new mongoose.Schema(
  {
    dayKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    promptTokens: { type: Number, default: 0, min: 0 },
    completionTokens: { type: Number, default: 0, min: 0 },
    totalTokens: { type: Number, default: 0, min: 0 },
    requests: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

/**
 * Suma una completion al día UTC indicado (upsert).
 * @param {string} dayKey YYYY-MM-DD (UTC)
 * @param {{ promptTokens?: number, completionTokens?: number, totalTokens?: number }} delta
 */
openAITokenUsageDaySchema.statics.incrementForDay = function incrementForDay(dayKey, delta) {
  const p = delta.promptTokens || 0;
  const c = delta.completionTokens || 0;
  const t = delta.totalTokens || 0;
  return this.findOneAndUpdate(
    { dayKey },
    {
      $inc: {
        promptTokens: p,
        completionTokens: c,
        totalTokens: t,
        requests: 1
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export default mongoose.model('OpenAITokenUsageDay', openAITokenUsageDaySchema);
