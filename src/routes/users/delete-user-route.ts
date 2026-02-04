import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";

export const deleteUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/users/:id",
    {
      schema: {
        tags: ["Usuarios"],
        description: "Excluir usuario",
        params: z.object({
          id: z.coerce.number(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      await db.delete(users).where(eq(users.id, id));

      return reply.status(204).send(null);
    },
  );
};
