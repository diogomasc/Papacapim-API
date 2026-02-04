import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { sessions } from "../../drizzle/schema/sessions";
import { eq } from "drizzle-orm";

export const deleteUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/users/:id",
    {
      schema: {
        tags: ["Usuarios"],
        description: "Excluir usuario",
        params: z.object({
          id: z.coerce.number(),
        }),
        headers: z.object({
          "x-session-token": z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const token = request.headers["x-session-token"];

      // Valida sessão (Autenticação)
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      if (!session) {
        return reply.status(401).send({ message: "Sessao invalida" });
      }

      const [userToDelete] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!userToDelete) {
        return reply.status(404).send({ message: "Usuario nao encontrado" });
      }

      if (userToDelete.login !== session.userLogin) {
        return reply
          .status(403)
          .send({ message: "Sem permissao para excluir este usuario" });
      }

      await db.delete(users).where(eq(users.id, id));

      return reply.status(204).send(null);
    },
  );
};
