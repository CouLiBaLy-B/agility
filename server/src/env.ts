import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16).default('change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
});

export const env = EnvSchema.parse(process.env);
