import type { FastifyInstance } from "fastify";
import { likePostRoute } from "./like-post-route";
import { listLikesRoute } from "./list-likes-route";
import { unlikePostRoute } from "./unlike-post-route";

export async function likesRoutes(app: FastifyInstance) {
  await app.register(likePostRoute);
  await app.register(listLikesRoute);
  await app.register(unlikePostRoute);
}
