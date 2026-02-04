import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { likes } from "../../drizzle/schema/likes";
import { sessions } from "../../drizzle/schema/sessions";
import { eq } from "drizzle-orm";

export const likePostRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/posts/:id/likes",
    {
      schema: {
        tags: ["Curtidas"],
        description: "Curtir postagem",
        headers: z.object({
          "x-session-token": z.string(),
        }),
        params: z.object({
          id: z.coerce.number(),
        }),
      },
    },
    async (request, reply) => {
      const { id: postId } = request.params;
      const token = request.headers["x-session-token"];

      // Obtém usuário atual da sessão
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      if (!session) {
        return reply.status(401).send({ message: "Sessao invalida" });
      }

      try {
        const [like] = await db
          .insert(likes)
          .values({
            userLogin: session.userLogin,
            postId,
          })
          .returning();

        return reply.status(201).send({
          id: like.id,
          user_login: like.userLogin,
          post_id: like.postId,
          created_at: like.createdAt,
          updated_at: like.updatedAt,
        });
      } catch (error: any) {
        if (error.code === "23505") {
          return reply.status(400).send({ message: "Postagem ja curtida" });
        }
        throw error;
      }
    },
  );
};
