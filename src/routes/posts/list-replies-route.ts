import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { posts } from "../../drizzle/schema/posts";
import { eq } from "drizzle-orm";

export const listRepliesRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/posts/:id/replies",
    {
      schema: {
        tags: ["Postagens"],
        description: "Listar respostas de uma postagem",
        params: z.object({
          id: z.coerce.number(),
        }),
        querystring: z.object({
          page: z.coerce.number().default(1),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              user_login: z.string(),
              post_id: z.number().nullable(),
              message: z.string(),
              created_at: z.date(),
              updated_at: z.date(),
            }),
          ),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { page } = request.query;
      const limit = 20;
      const offset = (page - 1) * limit;

      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.postId, id))
        .orderBy(posts.createdAt)
        .limit(limit)
        .offset(offset);

      return reply.status(200).send(result);
    },
  );
};
