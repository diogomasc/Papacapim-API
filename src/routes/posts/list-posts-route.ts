import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { posts } from "../../drizzle/schema/posts";
import { followers } from "../../drizzle/schema/followers";
import { sessions } from "../../drizzle/schema/sessions";
import { eq, ilike, inArray, isNull } from "drizzle-orm";

export const listPostsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/posts",
    {
      schema: {
        tags: ["Postagens"],
        description: "Listar postagens com paginacao, feed e busca",
        querystring: z.object({
          page: z.coerce.number().default(1),
          feed: z.coerce.number().optional(),
          search: z.string().optional(),
        }),
        headers: z
          .object({
            "x-session-token": z.string(),
          })
          .optional(),
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
      const { page, feed, search } = request.query;
      const limit = 20;
      const offset = (page - 1) * limit;

      let query = db
        .select()
        .from(posts)
        .orderBy(posts.createdAt)
        .limit(limit)
        .offset(offset);

      // Filter by feed (only posts from followed users)
      if (feed === 1) {
        const token = request.headers["x-session-token"];

        if (!token) {
          return reply
            .status(401)
            .send({ message: "Token necessario para feed" });
        }

        const [session] = await db
          .select()
          .from(sessions)
          .where(eq(sessions.token, token))
          .limit(1);

        if (!session) {
          return reply.status(401).send({ message: "Sessao invalida" });
        }

        // Get followed users
        const followedUsers = await db
          .select({ login: followers.followedLogin })
          .from(followers)
          .where(eq(followers.followerLogin, session.userLogin));

        const followedLogins = followedUsers.map((f) => f.login);

        if (followedLogins.length > 0) {
          query = query.where(inArray(posts.userLogin, followedLogins)) as any;
        } else {
          // No followed users, return empty array
          return reply.status(200).send([]);
        }
      }

      // Filter by search
      if (search) {
        query = query.where(ilike(posts.message, `%${search}%`)) as any;
      }

      const result = await query;

      return reply.status(200).send(result);
    },
  );
};
