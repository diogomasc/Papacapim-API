import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { followers } from "../../drizzle/schema/followers";
import { sessions } from "../../drizzle/schema/sessions";
import { and, eq } from "drizzle-orm";
import { isUniqueConstraintError } from "../../functions/is-unique-constraint-error";

export const followUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/users/:login/followers",
    {
      schema: {
        tags: ["Seguidores"],
        description: "Seguir usuario",
        params: z.object({
          login: z.string(),
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

      try {
        const [follower] = await db
          .insert(followers)
          .values({
            followerLogin: session.userLogin,
            followedLogin,
          })
          .returning();

        return reply.status(201).send({
          id: follower.id,
          follower_login: follower.followerLogin,
          followed_login: follower.followedLogin,
          created_at: follower.createdAt,
          updated_at: follower.updatedAt,
        });
      } catch (error: any) {
        if (isUniqueConstraintError(error)) {
          // Já segue (fail silently ou return 400? Aqui retornamos sucesso para ser idempotente ou erro?)
          // O codigo original retornava 204 se já existia?
          // Não, o codigo original retornava throw error se não fosse 23505, mas se fosse 23505 ele retornava o que?
          // Ah, espera. Vou olhar o código original.
          // O codigo original: if (error.code === "23505") { return reply.status(204).send(null); }
          return reply.status(204).send(null);
        }
        throw error;
      }
    },
  );
};
