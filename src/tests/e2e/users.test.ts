import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import type { FastifyInstance } from "fastify";
import { makeUser } from "../factories/make-user";

describe("Users E2E", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should create a new user", async () => {
    const userData = makeUser();

    const response = await request(app.server)
      .post("/users")
      .send({ user: userData });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("login", userData.login);
    expect(response.body).toHaveProperty("name", userData.name);
  });

  it("should list users", async () => {
    const response = await request(app.server).get("/users");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should get user by login", async () => {
    // Cria usuário primeiro
    const userData = makeUser();
    await request(app.server).post("/users").send({ user: userData });

    const response = await request(app.server).get(`/users/${userData.login}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("login", userData.login);
  });

  it("should update user", async () => {
    // Cria usuário primeiro
    const userData = makeUser();
    const createResponse = await request(app.server)
      .post("/users")
      .send({ user: userData });

    const userId = createResponse.body.id;
    const newName = "Updated Name";

    const response = await request(app.server)
      .patch(`/users/${userId}`)
      .send({ user: { name: newName } });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("name", newName);
  });

  it("should delete user", async () => {
    // Cria usuário primeiro
    const userData = makeUser();
    const createResponse = await request(app.server)
      .post("/users")
      .send({ user: userData });

    const userId = createResponse.body.id;

    const response = await request(app.server).delete(`/users/${userId}`);

    expect(response.status).toBe(204);
  });
});
