import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { followers } from "../../drizzle/schema/followers";
import { sessions } from "../../drizzle/schema/sessions";
import { eq } from "drizzle-orm";

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
        if (error.code === "23505") {
          return reply
            .status(400)
            .send({ message: "Ja esta seguindo este usuario" });
        }
        throw error;
      }
    },
  );
};
