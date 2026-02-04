import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { posts } from "../../drizzle/schema/posts";
import { sessions } from "../../drizzle/schema/sessions";
import { eq } from "drizzle-orm";

export const deletePostRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/posts/:id",
    {
      schema: {
        tags: ["Postagens"],
        description: "Excluir postagem",
        headers: z.object({
          "x-session-token": z.string(),
        }),
        params: z.object({
          id: z.coerce.number(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
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

      // Verifica se o post pertence ao usuário
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

      if (!post) {
        return reply.status(404).send({ message: "Postagem nao encontrada" });
      }

      if (post.userLogin !== session.userLogin) {
        return reply
          .status(403)
          .send({ message: "Sem permissao para excluir esta postagem" });
      }

      await db.delete(posts).where(eq(posts.id, id));

      return reply.status(204).send(null);
    },
  );
};
