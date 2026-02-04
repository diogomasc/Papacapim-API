import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3333),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(10),
});

export const env = envSchema.parse(process.env);
