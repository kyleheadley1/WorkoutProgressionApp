// server/index.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import workoutsRouter from './src/routes/workouts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'workouts_app';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// routes
app.use('/api/workouts', workoutsRouter);

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
    console.log('[server] connected to Mongo');
    app.listen(PORT, () =>
      console.log(`[server] listening on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('[server] failed to start:', err);
    process.exit(1);
  }
}

start();
