import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import type { FastifyInstance } from "fastify";
import { makeUser } from "../factories/make-user";
import { makeSession } from "../factories/make-session";
import { makePost } from "../factories/make-post";

describe("Likes E2E", () => {
  let app: FastifyInstance;
  let authToken: string;
  let postId: number;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();

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

    authToken = loginResponse.body.token;

    // Cria um post para curtir
    const postData = makePost();
    const postResponse = await request(app.server)
      .post("/posts")
      .set("x-session-token", authToken)
      .send({ post: postData });

    postId = postResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should like a post", async () => {
    const response = await request(app.server)
      .post(`/posts/${postId}/likes`)
      .set("x-session-token", authToken);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("post_id", postId);
  });

  it("should list post likes", async () => {
    const response = await request(app.server).get(`/posts/${postId}/likes`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should unlike a post", async () => {
    // Curte primeiro
    const likeResponse = await request(app.server)
      .post(`/posts/${postId}/likes`)
      .set("x-session-token", authToken);

    const likeId = likeResponse.body.id;

    const response = await request(app.server)
      .delete(`/posts/${postId}/likes/${likeId}`)
      .set("x-session-token", authToken);

    expect(response.status).toBe(204);
  });
});
