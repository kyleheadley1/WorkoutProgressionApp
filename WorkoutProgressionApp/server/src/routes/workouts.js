// server/src/routes/workouts.js
import { Router } from 'express';
import Workout from '../models/workoutModel.js'; // you already have this model
// If you added Joi validation earlier, uncomment the next line and the validation block.
// import { workoutSchema } from '../validation/workoutValidation.js';

const r = Router();

// CREATE
r.post('/', async (req, res) => {
  try {
    // const { value, error } = workoutSchema.validate(req.body, { abortEarly: false });
    // if (error) return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
    const doc = await Workout.create(req.body /* or value */);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// LIST (optional date range)
r.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    const q = {};
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to) q.date.$lte = new Date(to);
    }
    const items = await Workout.find(q).sort({ date: -1 }).limit(500);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// READ
r.get('/:id', async (req, res) => {
  try {
    const item = await Workout.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// UPDATE
r.patch('/:id', async (req, res) => {
  try {
    const updated = await Workout.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE
r.delete('/:id', async (req, res) => {
  try {
    const deleted = await Workout.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default r;
