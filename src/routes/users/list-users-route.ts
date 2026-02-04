import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { ilike, or } from "drizzle-orm";

export const listUsersRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/users",
    {
      schema: {
        tags: ["Usuarios"],
        description: "Listar usuarios com paginacao e busca",
        querystring: z.object({
          page: z.coerce.number().default(1),
          search: z.string().optional(),
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
      const { page, search } = request.query;
      const limit = 20;
      const offset = (page - 1) * limit;

      let query = db
        .select({
          id: users.id,
          login: users.login,
          name: users.name,
          created_at: users.createdAt,
          updated_at: users.updatedAt,
        })
        .from(users);

      if (search) {
        query = query.where(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.login, `%${search}%`),
          ),
        ) as any;
      }

      const result = await query.limit(limit).offset(offset);

      return reply.status(200).send(result);
    },
  );
};
