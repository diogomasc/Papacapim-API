import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { followers } from "../../drizzle/schema/followers";
import { sessions } from "../../drizzle/schema/sessions";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";
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

      // Verifica se usuário a ser seguido existe
      const [followedUser] = await db
        .select()
        .from(users)
        .where(eq(users.login, followedLogin))
        .limit(1);

      if (!followedUser) {
        return reply.status(404).send({ message: "Usuario nao encontrado" });
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
          return reply.status(204).send(null);
        }
        throw error;
      }
    },
  );
};
