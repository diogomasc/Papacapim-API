import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { hashPassword } from "../../functions/hash-password";

export const createUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/users",
    {
      schema: {
        tags: ["Usuarios"],
        description: "Criar novo usuario",
        body: z.object({
          user: z.object({
            login: z.string().min(3),
            name: z.string().min(3),
            password: z.string().min(6),
            password_confirmation: z.string().min(6),
          }),
        }),
        response: {
          201: z.object({
            id: z.number(),
            login: z.string(),
            name: z.string(),
            created_at: z.date(),
            updated_at: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { user: userData } = request.body;

      // Validate password confirmation
      if (userData.password !== userData.password_confirmation) {
        return reply.status(400).send({ message: "Senhas nao conferem" });
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      try {
        // Create user
        const [user] = await db
          .insert(users)
          .values({
            login: userData.login,
            name: userData.name,
            passwordHash,
          })
          .returning();

        return reply.status(201).send({
          id: user.id,
          login: user.login,
          name: user.name,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        });
      } catch (error: any) {
        if (error.code === "23505") {
          // Unique constraint violation
          return reply.status(400).send({ message: "Login ja existe" });
        }
        throw error;
      }
    },
  );
};
