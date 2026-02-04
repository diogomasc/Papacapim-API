import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import type { FastifyInstance } from "fastify";
import { makeUser } from "../factories/make-user";
import { makeSession } from "../factories/make-session";

describe("Sessions E2E", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should create a new session (login)", async () => {
    // Cria usuário primeiro
    const userData = makeUser();
    await request(app.server).post("/users").send({ user: userData });

    const sessionData = makeSession({
      login: userData.login,
      password: userData.password,
    });

    const response = await request(app.server)
      .post("/sessions")
      .send(sessionData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user_login", userData.login);
  });

  it("should delete a session (logout)", async () => {
    // Cria usuário e faz login
    const userData = makeUser();
    await request(app.server).post("/users").send({ user: userData });

    const sessionData = makeSession({
      login: userData.login,
      password: userData.password,
    });

    const loginResponse = await request(app.server)
      .post("/sessions")
      .send(sessionData);

    const sessionId = loginResponse.body.id;

    const response = await request(app.server).delete(`/sessions/${sessionId}`);

    expect(response.status).toBe(204);
  });
});
