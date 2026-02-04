import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { followers } from "../../drizzle/schema/followers";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";

export const listFollowersRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/users/:login/followers",
    {
      schema: {
        tags: ["Seguidores"],
        description: "Listar seguidores de um usuario",
        params: z.object({
          login: z.string(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              login: z.string(),
              name: z.string(),
              created_at: z.date(),
              updated_at: z.date(),
            }),
          ),
        },
      },
    },
    async (request, reply) => {
      const { login } = request.params;

      const result = await db
        .select({
          id: users.id,
          login: users.login,
          name: users.name,
          created_at: users.createdAt,
          updated_at: users.updatedAt,
        })
        .from(followers)
        .innerJoin(users, eq(followers.followerLogin, users.login))
        .where(eq(followers.followedLogin, login));

      return reply.status(200).send(result);
    },
  );
};
