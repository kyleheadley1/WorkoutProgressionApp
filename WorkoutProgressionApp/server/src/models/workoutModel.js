import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const exerciseSchema = new mongoose.Schema({
  exerciseId: {
    type: String,
    required: true,
    enum: [
      'bulgarianSplitSquats',
      'bulgarianSplitSquatsPause',
      'romanianDeadlifts',
      'legPress',
      'calfRaises',
      'legExtensions',
      'legCurls',
    ],
  },
  weight: {
    type: Number,
    required: true,
  },
  sets: {
    type: Number,
    required: true,
  },
  reps: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const workoutSchema = new mongoose.Schema({
  workoutType: {
    type: String,
    required: true,
    enum: ['push', 'pull', 'legs', 'Upper Body', 'Lower Body', 'Full Body'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  exercises: [exerciseSchema],
});

const myURI = 'mongodb://localhost:27017';
const URI = process.env.MONGO_URI || myURI;

export default mongoose.model('Workout', workoutSchema);
