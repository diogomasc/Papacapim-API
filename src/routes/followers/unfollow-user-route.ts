import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { followers } from "../../drizzle/schema/followers";
import { sessions } from "../../drizzle/schema/sessions";
import { eq, and } from "drizzle-orm";

export const unfollowUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/users/:login/followers/:id",
    {
      schema: {
        tags: ["Seguidores"],
        description: "Deixar de seguir usuario",
        params: z.object({
          login: z.string(),
          id: z.coerce.number(),
        }),
        headers: z.object({
          "x-session-token": z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { login: followedLogin } = request.params;
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

      await db
        .delete(followers)
        .where(
          and(
            eq(followers.followerLogin, session.userLogin),
            eq(followers.followedLogin, followedLogin),
          ),
        );

      return reply.status(204).send(null);
    },
  );
};
