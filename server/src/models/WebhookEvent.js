import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  status: { type: String, enum: ['processing', 'processed', 'failed'], required: true, default: 'processing' },
  receivedAt: { type: Date, required: true, default: Date.now },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

export const WebhookEvent = mongoose.models.WebhookEvent
  || mongoose.model('WebhookEvent', webhookEventSchema);
