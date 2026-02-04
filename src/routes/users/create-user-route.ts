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
      },
    },
    async (request, reply) => {
      const { user: userData } = request.body;

      // Valida confirmação de senha
      if (userData.password !== userData.password_confirmation) {
        return reply.status(400).send({ message: "Senhas nao conferem" });
      }

      // Gera hash da senha
      const passwordHash = await hashPassword(userData.password);

      try {
        // Cria usuário
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
          // Violação de constraint de unicidade
          return reply.status(400).send({ message: "Login ja existe" });
        }
        throw error;
      }
    },
  );
};
