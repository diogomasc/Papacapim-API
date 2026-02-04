import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { likes } from "../../drizzle/schema/likes";
import { sessions } from "../../drizzle/schema/sessions";
import { eq, and } from "drizzle-orm";

export const unlikePostRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/posts/:id/likes/:likeId",
    {
      schema: {
        tags: ["Curtidas"],
        description: "Remover curtida de postagem",
        headers: z.object({
          "x-session-token": z.string(),
        }),
        params: z.object({
          id: z.coerce.number(),
          likeId: z.coerce.number(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id: postId } = request.params;
      const token = request.headers["x-session-token"];

      // Get current user from session
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      if (!session) {
        return reply.status(401).send({ message: "Sessao invalida" });
      }

      await db
        .delete(likes)
        .where(
          and(eq(likes.postId, postId), eq(likes.userLogin, session.userLogin)),
        );

      return reply.status(204).send();
    },
  );
};
