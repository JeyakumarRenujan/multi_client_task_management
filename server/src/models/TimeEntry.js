import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: '' },
    clientId: { type: String, default: '' },
    taskId: { type: String, default: '' },
    description: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    isBillable: { type: Boolean, default: true },
    hourlyRate: { type: Number, default: 0 },
    isBilled: { type: Boolean, default: false },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
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

export const TimeEntryModel = mongoose.models.TimeEntry || mongoose.model('TimeEntry', timeEntrySchema);

