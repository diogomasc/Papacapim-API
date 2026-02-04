import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { likes } from "../../drizzle/schema/likes";
import { eq } from "drizzle-orm";

export const listLikesRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/posts/:id/likes",
    {
      schema: {
        tags: ["Curtidas"],
        description: "Listar curtidas de uma postagem",
        params: z.object({
          id: z.coerce.number(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              user_login: z.string(),
              post_id: z.number(),
              created_at: z.date(),
              updated_at: z.date(),
            }),
          ),
        },
      },
    },
    async (request, reply) => {
      const { id: postId } = request.params;

      const result = await db
        .select()
        .from(likes)
        .where(eq(likes.postId, postId))
        .orderBy(likes.createdAt);

      return reply.status(200).send(result);
    },
  );
};
