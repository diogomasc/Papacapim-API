import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import type { FastifyInstance } from "fastify";
import { makeUser } from "../factories/make-user";
import { makeSession } from "../factories/make-session";
import { makePost } from "../factories/make-post";

describe("Posts E2E", () => {
  let app: FastifyInstance;
  let authToken: string;
  let userLogin: string;

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
    userLogin = userData.login;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should create a new post", async () => {
    const postData = makePost();

    const response = await request(app.server)
      .post("/posts")
      .set("x-session-token", authToken)
      .send({ post: postData });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("message", postData.message);
    expect(response.body).toHaveProperty("user_login", userLogin);
  });

  it("should list posts", async () => {
    // Cria alguns posts primeiro
    const postData1 = makePost();
    const postData2 = makePost();

    await request(app.server)
      .post("/posts")
      .set("x-session-token", authToken)
      .send({ post: postData1 });

    await request(app.server)
      .post("/posts")
      .set("x-session-token", authToken)
      .send({ post: postData2 });

    // Agora lista posts com token
    const response = await request(app.server)
      .get("/posts?page=1")
      .set("x-session-token", authToken);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("should list user posts", async () => {
    const response = await request(app.server).get(`/users/${userLogin}/posts`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should reply to a post", async () => {
    // Cria post primeiro
    const postData = makePost();
    const createResponse = await request(app.server)
      .post("/posts")
      .set("x-session-token", authToken)
      .send({ post: postData });

    const postId = createResponse.body.id;
    const replyData = makePost();

    const response = await request(app.server)
      .post(`/posts/${postId}/replies`)
      .set("x-session-token", authToken)
      .send({ reply: replyData });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("post_id", postId);
    expect(response.body).toHaveProperty("message", replyData.message);
  });

  it("should list post replies", async () => {
    // Cria post primeiro
    const postData = makePost();
    const createResponse = await request(app.server)
      .post("/posts")
      .set("x-session-token", authToken)
      .send({ post: postData });

    const postId = createResponse.body.id;

    const response = await request(app.server).get(`/posts/${postId}/replies`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should delete a post", async () => {
    // Cria post primeiro
    const postData = makePost();
    const createResponse = await request(app.server)
      .post("/posts")
      .set("x-session-token", authToken)
      .send({ post: postData });

    const postId = createResponse.body.id;

    const response = await request(app.server)
      .delete(`/posts/${postId}`)
      .set("x-session-token", authToken);

    expect(response.status).toBe(204);
  });
});
