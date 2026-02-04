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
});
