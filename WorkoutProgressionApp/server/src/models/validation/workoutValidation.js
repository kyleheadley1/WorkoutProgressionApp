// server/src/validation/workoutValidation.js
import Joi from 'joi';

// Define exercise-level validation
const exerciseSchema = Joi.object({
  exerciseId: Joi.string().required(),
  target: Joi.object({
    weight: Joi.number().min(0).required(),
    reps: Joi.number().integer().min(1).required(),
    sets: Joi.number().integer().min(1).required(),
  }).required(),
  sets: Joi.array()
    .items(
      Joi.object({
        setNumber: Joi.number().integer().min(1).required(),
        weight: Joi.number().min(0).required(),
        reps: Joi.number().integer().min(1).required(),
        rpe: Joi.number().min(0).max(10).optional(),
      })
    )
    .min(1)
    .required(),
});

// Define full workout validation
export const workoutSchema = Joi.object({
  userId: Joi.string().optional(),
  type: Joi.string()
    .valid('push', 'pull', 'legs', 'Upper Body', 'Lower Body', 'Full Body')
    .required(),
  date: Joi.date().iso().required(),
  exercises: Joi.array().items(exerciseSchema).min(1).required(),
});
