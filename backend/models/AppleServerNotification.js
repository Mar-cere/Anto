/**
 * Registro de App Store Server Notifications V2 (auditoría e idempotencia por notificationUUID).
 */

import mongoose from 'mongoose';

const appleServerNotificationSchema = new mongoose.Schema(
  {
    notificationUUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    notificationType: { type: String, default: null },
    subtype: { type: String, default: null },
    bundleId: { type: String, default: null },
    environment: { type: String, default: null },
    originalTransactionId: { type: String, default: null },
    transactionId: { type: String, default: null },
    productId: { type: String, default: null },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: ['received', 'processed', 'skipped', 'error'],
      required: true,
    },
    skipReason: { type: String, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

appleServerNotificationSchema.index({ createdAt: -1 });

export default mongoose.model('AppleServerNotification', appleServerNotificationSchema);
