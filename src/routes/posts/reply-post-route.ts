import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { posts } from "../../drizzle/schema/posts";
import { sessions } from "../../drizzle/schema/sessions";
import { eq } from "drizzle-orm";

export const replyPostRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/posts/:id/replies",
    {
      schema: {
        tags: ["Postagens"],
        description: "Responder uma postagem",
        headers: z.object({
          "x-session-token": z.string(),
        }),
        params: z.object({
          id: z.coerce.number(),
        }),
        body: z.object({
          reply: z.object({
            message: z.string().min(1).max(500),
          }),
        }),
        response: {
          201: z.object({
            id: z.number(),
            user_login: z.string(),
            post_id: z.number().nullable(),
            message: z.string(),
            created_at: z.date(),
            updated_at: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id: postId } = request.params;
      const { reply: replyData } = request.body;
      const token = request.headers["x-session-token"];

      // Get current user from session
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      if (!session) {
        return reply.status(401).send({ message: "Sessao invalida" });
      }

      // Verify post exists
      const [originalPost] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (!originalPost) {
        return reply.status(404).send({ message: "Postagem nao encontrada" });
      }

      const [post] = await db
        .insert(posts)
        .values({
          userLogin: session.userLogin,
          message: replyData.message,
          postId: postId,
        })
        .returning();

      return reply.status(201).send({
        id: post.id,
        user_login: post.userLogin,
        post_id: post.postId,
        message: post.message,
        created_at: post.createdAt,
        updated_at: post.updatedAt,
      });
    },
  );
};
