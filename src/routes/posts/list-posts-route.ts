import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { posts } from "../../drizzle/schema/posts";
import { followers } from "../../drizzle/schema/followers";
import { sessions } from "../../drizzle/schema/sessions";
import { eq, ilike, inArray } from "drizzle-orm";

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

      // Filtra por feed (apenas posts de usuários seguidos)
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

        // Obtém usuários seguidos
        const followedUsers = await db
          .select({ login: followers.followedLogin })
          .from(followers)
          .where(eq(followers.followerLogin, session.userLogin));

        const followedLogins = followedUsers.map((f) => f.login);

        if (followedLogins.length > 0) {
          query = query.where(inArray(posts.userLogin, followedLogins)) as any;
        } else {
          // Nenhum usuário seguido, retorna array vazio
          return reply.status(200).send([]);
        }
      }

      // Filtra por busca
      if (search) {
        query = query.where(ilike(posts.message, `%${search}%`)) as any;
      }

      const result = await query;

      // Mapeia para snake_case para resposta
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
