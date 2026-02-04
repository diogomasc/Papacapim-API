import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";

export const getUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/users/:login",
    {
      schema: {
        tags: ["Usuarios"],
        description: "Obter usuario especifico",
        params: z.object({
          login: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { login } = request.params;

      const [user] = await db
        .select({
          id: users.id,
          login: users.login,
          name: users.name,
          created_at: users.createdAt,
          updated_at: users.updatedAt,
        })
        .from(users)
        .where(eq(users.login, login))
        .limit(1);

      if (!user) {
        return reply.status(404).send({ message: "Usuario nao encontrado" });
      }

      return reply.status(200).send(user);
    },
  );
};
