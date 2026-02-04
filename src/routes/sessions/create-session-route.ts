import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { sessions } from "../../drizzle/schema/sessions";
import { verifyPassword } from "../../functions/verify-password";
import { generateToken } from "../../functions/generate-token";
import { eq } from "drizzle-orm";

export const createSessionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/sessions",
    {
      schema: {
        tags: ["Autenticacao"],
        description: "Criar nova sessao (login)",
        body: z.object({
          login: z.string(),
          password: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { login, password } = request.body;

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.login, login))
        .limit(1);

      if (!user) {
        return reply.status(401).send({ message: "Credenciais invalidas" });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return reply.status(401).send({ message: "Credenciais invalidas" });
      }

      // Generate token
      const token = generateToken();
      const ip = request.ip;

      // Create session
      const [session] = await db
        .insert(sessions)
        .values({
          userLogin: login,
          token,
          ip,
        })
        .returning();

      return reply.status(200).send({
        id: session.id,
        user_login: session.userLogin,
        token: session.token,
        ip: session.ip,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      });
    },
  );
};
