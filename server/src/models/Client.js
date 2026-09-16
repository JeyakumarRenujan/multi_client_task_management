import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    color: { type: String, default: '#128C7E' },
    status: { type: String, enum: ['active', 'lead', 'inactive'], default: 'active' },
    hourlyRate: { type: Number, default: 0 },
    currency: { type: String, default: '$' },
    totalBilled: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ClientModel = mongoose.models.Client || mongoose.model('Client', clientSchema);
