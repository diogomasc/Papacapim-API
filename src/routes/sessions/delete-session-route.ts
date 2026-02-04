import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { sessions } from "../../drizzle/schema/sessions";
import { eq } from "drizzle-orm";

export const deleteSessionRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/sessions/:id",
    {
      schema: {
        tags: ["Autenticacao"],
        description: "Encerrar sessao (logout)",
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

      await db.delete(sessions).where(eq(sessions.id, id));

      return reply.status(204).send(null);
    },
  );
};
