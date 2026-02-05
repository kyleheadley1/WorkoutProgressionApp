import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Align server schema with client payload structure used by the app.
// A workout contains many exercises; each exercise has a target and a list of sets.
const setSchema = new mongoose.Schema(
  {
    setNumber: { type: Number },
    reps: { type: Number, required: true },
    weight: { type: Number, required: true },
    rpe: { type: Number },
    isWarmup: { type: Boolean, default: false },
  },
  { _id: false }
);

const targetSchema = new mongoose.Schema(
  {
    weight: { type: Number },
    reps: { type: Number },
    sets: { type: Number },
  },
  { _id: false }
);

const exerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String, required: true }, // allow any exercise id used by client
    target: targetSchema,
    sets: { type: [setSchema], default: [] },
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema({
  // The client sends { type: 'push' | 'pull' | 'legs' | 'Upper Body' | ... }
  type: { type: String, required: true },
  // For backwards compatibility if older clients send workoutType instead of type
  workoutType: { type: String },
  dayType: { type: String },
  date: { type: Date, default: Date.now },
  exercises: { type: [exerciseSchema], default: [] },
});

// Normalize type on save if only workoutType provided
workoutSchema.pre('validate', function (next) {
  if (!this.type && this.workoutType) {
    this.type = this.workoutType;
  }
  next();
});

export default mongoose.model('Workout', workoutSchema);
