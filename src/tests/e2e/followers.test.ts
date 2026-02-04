import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import type { FastifyInstance } from "fastify";
import { makeUser } from "../factories/make-user";
import { makeSession } from "../factories/make-session";

describe("Followers E2E", () => {
  let app: FastifyInstance;
  let authToken: string;
  let user1Login: string;
  let user2Login: string;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();

    // Cria primeiro usuário e faz login
    const user1Data = makeUser();
    await request(app.server).post("/users").send({ user: user1Data });

    const sessionData = makeSession({
      login: user1Data.login,
      password: user1Data.password,
    });

    const loginResponse = await request(app.server)
      .post("/sessions")
      .send(sessionData);

    authToken = loginResponse.body.token;
    user1Login = user1Data.login;

    // Cria segundo usuário para ser seguido
    const user2Data = makeUser();
    await request(app.server).post("/users").send({ user: user2Data });
    user2Login = user2Data.login;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should follow a user", async () => {
    const response = await request(app.server)
      .post(`/users/${user2Login}/followers`)
      .set("x-session-token", authToken);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("follower_login", user1Login);
    expect(response.body).toHaveProperty("followed_login", user2Login);
  });

  it("should list followers", async () => {
    const response = await request(app.server).get(
      `/users/${user2Login}/followers`,
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should unfollow a user", async () => {
    // Segue primeiro
    await request(app.server)
      .post(`/users/${user2Login}/followers`)
      .set("x-session-token", authToken);

    const response = await request(app.server)
      .delete(`/users/${user2Login}/followers/1`)
      .set("x-session-token", authToken);

    expect(response.status).toBe(204);
  });
});
