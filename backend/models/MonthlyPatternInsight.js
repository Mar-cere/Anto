/**
 * Informe mensual de patrones generado por motor multimodal (#217).
 */
import mongoose from 'mongoose';

const monthlyPatternInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    monthKey: { type: String, required: true, trim: true, maxlength: 8, index: true },
    language: { type: String, enum: ['es', 'en'], default: 'es' },
    status: {
      type: String,
      enum: ['pending', 'ready', 'failed'],
      default: 'pending',
      index: true,
    },
    headline: { type: String, maxlength: 240, default: '' },
    body: { type: String, maxlength: 2000, default: '' },
    insights: {
      type: [
        {
          type: { type: String, maxlength: 64 },
          label: { type: String, maxlength: 280 },
          strength: { type: Number, min: 0, max: 1 },
          detail: { type: String, maxlength: 500 },
          disclaimer: { type: String, maxlength: 64 },
        },
      ],
      default: [],
    },
    correlations: { type: Array, default: [] },
    sourceSummary: { type: Object, default: {} },
    abcPatterns: {
      type: [
        {
          situationSample: { type: String, maxlength: 120 },
          count: { type: Number, min: 0 },
          summary: { type: String, maxlength: 280 },
          disclaimer: { type: String, maxlength: 64 },
        },
      ],
      default: [],
    },
    conductSuggestion: { type: String, maxlength: 300, default: null },
    disclaimers: { type: [String], default: [] },
    llmEnriched: { type: Boolean, default: false },
    generatedAt: { type: Date, default: null },
    lastError: { type: String, maxlength: 500, default: null },
  },
  { timestamps: true },
);

monthlyPatternInsightSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

export default mongoose.model('MonthlyPatternInsight', monthlyPatternInsightSchema);
