import { z } from "zod";

const envSchema = z.object({
  // Servidor
  PORT: z.coerce.number().default(3333),

  // Banco de dados
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(10),
});

export const env = envSchema.parse(process.env);
