import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { posts } from "../../drizzle/schema/posts";
import { eq } from "drizzle-orm";

export const listUserPostsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/users/:login/posts",
    {
      schema: {
        tags: ["Postagens"],
        description: "Listar postagens de um usuario",
        params: z.object({
          login: z.string(),
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
      const { login } = request.params;
      const { page } = request.query;
      const limit = 20;
      const offset = (page - 1) * limit;

      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.userLogin, login))
        .orderBy(posts.createdAt)
        .limit(limit)
        .offset(offset);

      const mappedResult = result.map((post) => ({
        id: post.id,
        user_login: post.userLogin,
        post_id: post.postId,
        message: post.message,
        created_at: post.createdAt,
        updated_at: post.updatedAt,
      }));

      return reply.status(200).send(mappedResult);
    },
  );
};
