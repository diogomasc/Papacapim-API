import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { sessions } from "../../drizzle/schema/sessions";
import { hashPassword } from "../../functions/hash-password";
import { isUniqueConstraintError } from "../../functions/is-unique-constraint-error";
import { eq } from "drizzle-orm";

export const updateUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    "/users/:id",
    {
      schema: {
        tags: ["Usuarios"],
        description: "Atualizar usuario",
        params: z.object({
          id: z.coerce.number(),
        }),
        body: z.object({
          user: z.object({
            login: z.string().min(3).optional(),
            name: z.string().min(3).optional(),
            password: z.string().min(6).optional(),
            password_confirmation: z.string().min(6).optional(),
          }),
        }),
        headers: z.object({
          "x-session-token": z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { user: userData } = request.body;
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

      // Busca usuario alvo
      const [userToUpdate] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!userToUpdate) {
        return reply.status(404).send({ message: "Usuario nao encontrado" });
      }

      // Valida permissão (Autorização)
      if (userToUpdate.login !== session.userLogin) {
        return reply
          .status(403)
          .send({ message: "Sem permissao para alterar este usuario" });
      }

      // Valida confirmação de senha se a senha estiver sendo alterada
      if (
        userData.password &&
        userData.password !== userData.password_confirmation
      ) {
        return reply.status(400).send({ message: "Senhas nao conferem" });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (userData.login) {
        updateData.login = userData.login;
      }

      if (userData.name) {
        updateData.name = userData.name;
      }

      if (userData.password) {
        updateData.passwordHash = await hashPassword(userData.password);

        // Deleta todas as sessões quando a senha muda
        const [currentUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (currentUser) {
          await db
            .delete(sessions)
            .where(eq(sessions.userLogin, currentUser.login));
        }
      }

      try {
        const [user] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, id))
          .returning();

        if (!user) {
          return reply.status(404).send({ message: "Usuario nao encontrado" });
        }

        return reply.status(200).send({
          id: user.id,
          login: user.login,
          name: user.name,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        });
      } catch (error: any) {
        if (isUniqueConstraintError(error)) {
          // Unique constraint violation (probably login)
          return reply.status(400).send({ message: "Login ja existe" });
        }
        throw error;
      }
    },
  );
};
