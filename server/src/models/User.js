import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    title: { type: String, default: 'Independent Freelancer' },
    hourlyRate: { type: Number, default: 65 },
    currency: { type: String, default: '$' },
    bio: { type: String, default: '' },
    notificationSettings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      deadlineReminderHours: { type: Number, default: 24 },
    },
    idleSettings: {
      enabled: { type: Boolean, default: true },
      timeoutMinutes: { type: Number, default: 5 },
      style: { type: String, default: 'starfield' },
    },
    aiSettings: {
      provider: { type: String, default: 'builtin' },
      geminiApiKey: { type: String, default: '' },
      geminiModel: { type: String, default: 'gemini-1.5-flash' },
      openaiApiKey: { type: String, default: '' },
      openaiModel: { type: String, default: 'gpt-4o-mini' },
      customInstructions: { type: String, default: '' },
    },
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

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

