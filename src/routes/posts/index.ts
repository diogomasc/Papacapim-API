import type { FastifyInstance } from "fastify";
import { createPostRoute } from "./create-post-route";
import { deletePostRoute } from "./delete-post-route";
import { listPostsRoute } from "./list-posts-route";
import { listRepliesRoute } from "./list-replies-route";
import { listUserPostsRoute } from "./list-user-posts-route";
import { replyPostRoute } from "./reply-post-route";

export async function postsRoutes(app: FastifyInstance) {
  await app.register(createPostRoute);
  await app.register(deletePostRoute);
  await app.register(listPostsRoute);
  await app.register(listRepliesRoute);
  await app.register(listUserPostsRoute);
  await app.register(replyPostRoute);
}
