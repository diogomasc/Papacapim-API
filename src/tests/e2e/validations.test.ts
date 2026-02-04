import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import type { FastifyInstance } from "fastify";
import { makeUser } from "../factories/make-user";

describe("API Validations (Sad Path)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("User Validations", () => {
    it("should fail to create user when passwords do not match", async () => {
      // Tenta criar usuário com confirmação de senha diferente
      const userData = makeUser();
      const payload = {
        user: {
          ...userData,
          password_confirmation: "wrong-password",
        },
      };

      const response = await request(app.server).post("/users").send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Senhas nao conferem");
    });

    it("should fail to create user with short password", async () => {
      // Tenta criar usuário com senha de 3 caracteres (min é 6 no schema)
      const userData = makeUser({ password: "123" });

      const response = await request(app.server)
        .post("/users")
        .send({ user: userData });

      // Fastify/Zod retorna 400 para erros validação de schema
      expect(response.status).toBe(400);
    });

    it("should fail to create duplicate user login", async () => {
      // Cria usuário inicial
      const userData = makeUser();
      await request(app.server).post("/users").send({ user: userData });

      // Tenta criar usuário com o mesmo login
      const response = await request(app.server)
        .post("/users")
        .send({ user: userData });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Login ja existe");
    });
  });

  describe("Session Validations", () => {
    it("should fail to login with wrong password", async () => {
      // Cria usuário
      const userData = makeUser();
      await request(app.server).post("/users").send({ user: userData });

      // Tenta logar com senha errada
      const response = await request(app.server).post("/sessions").send({
        login: userData.login,
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Credenciais invalidas");
    });

    it("should fail to login with non-existent user", async () => {
      // Tenta logar com usuário que não existe
      const response = await request(app.server).post("/sessions").send({
        login: "non-existent-user",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Credenciais invalidas");
    });
  });

  describe("Protected Routes Validations", () => {
    it("should fail to access protected route without token", async () => {
      // Tenta criar post sem token
      // Fastify retorna 400 pois o header é obrigatório no schema
      const response = await request(app.server)
        .post("/posts")
        .send({ post: { message: "Hello" } });

      expect(response.status).toBe(400);
    });

    it("should fail to access protected route with invalid token", async () => {
      // Tenta criar post com token inválido
      // Aqui passa pelo schema (string presente), mas falha na lógica (401)
      const response = await request(app.server)
        .post("/posts")
        .set("x-session-token", "invalid-token-123")
        .send({ post: { message: "Hello" } });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Sessao invalida");
    });
  });
  describe("Posts Validations", () => {
    it("should fail to delete post from another user", async () => {
      // Cria usuário 1 e post
      const user1 = makeUser();
      await request(app.server).post("/users").send({ user: user1 });
      const login1Res = await request(app.server)
        .post("/sessions")
        .send({ login: user1.login, password: user1.password });
      const token1 = login1Res.body.token;

      const postRes = await request(app.server)
        .post("/posts")
        .set("x-session-token", token1)
        .send({ post: { message: "User 1 Post" } });
      const postId = postRes.body.id;

      // Cria usuário 2
      const user2 = makeUser();
      await request(app.server).post("/users").send({ user: user2 });
      const login2Res = await request(app.server)
        .post("/sessions")
        .send({ login: user2.login, password: user2.password });
      const token2 = login2Res.body.token;

      // Usuário 2 tenta deletar post do Usuário 1
      const response = await request(app.server)
        .delete(`/posts/${postId}`)
        .set("x-session-token", token2);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        "Sem permissao para excluir esta postagem",
      );
    });

    it("should fail to delete non-existent post", async () => {
      const user = makeUser();
      await request(app.server).post("/users").send({ user });
      const loginRes = await request(app.server)
        .post("/sessions")
        .send({ login: user.login, password: user.password });
      const token = loginRes.body.token;

      const response = await request(app.server)
        .delete("/posts/999999")
        .set("x-session-token", token);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Postagem nao encontrada",
      );
    });
  });

  describe("Followers Validations", () => {
    it("should allow (idempotent) following same user twice", async () => {
      const user1 = makeUser();
      const user2 = makeUser();
      await request(app.server).post("/users").send({ user: user1 });
      await request(app.server).post("/users").send({ user: user2 });

      const login1Res = await request(app.server)
        .post("/sessions")
        .send({ login: user1.login, password: user1.password });
      const token1 = login1Res.body.token;

      await request(app.server)
        .post(`/users/${user2.login}/followers`)
        .set("x-session-token", token1);

      const response = await request(app.server)
        .post(`/users/${user2.login}/followers`)
        .set("x-session-token", token1);

      expect(response.status).toBe(204);
    });
  });

  describe("User Security Validations", () => {
    it("should fail to delete another user", async () => {
      // Cria usuário 1 (vítima)
      const user1 = makeUser();
      const u1Res = await request(app.server)
        .post("/users")
        .send({ user: user1 });
      const u1Id = u1Res.body.id;

      // Cria usuário 2 (atacante)
      const user2 = makeUser();
      await request(app.server).post("/users").send({ user: user2 });
      const login2 = await request(app.server)
        .post("/sessions")
        .send({ login: user2.login, password: user2.password });
      const token2 = login2.body.token;

      // Usuário 2 tenta deletar Usuário 1
      const response = await request(app.server)
        .delete(`/users/${u1Id}`)
        .set("x-session-token", token2);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        "Sem permissao para excluir este usuario",
      );
    });

    it("should fail to update another user", async () => {
      // Cria usuário 1 (vítima)
      const user1 = makeUser();
      const u1Res = await request(app.server)
        .post("/users")
        .send({ user: user1 });
      const u1Id = u1Res.body.id;

      // Cria usuário 2 (atacante)
      const user2 = makeUser();
      await request(app.server).post("/users").send({ user: user2 });
      const login2 = await request(app.server)
        .post("/sessions")
        .send({ login: user2.login, password: user2.password });
      const token2 = login2.body.token;

      // Usuário 2 tenta atualizar Usuário 1
      const response = await request(app.server)
        .patch(`/users/${u1Id}`)
        .set("x-session-token", token2)
        .send({ user: { name: "Hacked Name" } });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        "Sem permissao para alterar este usuario",
      );
    });
  });
});
