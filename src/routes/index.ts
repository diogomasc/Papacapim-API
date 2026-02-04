import type { FastifyInstance } from "fastify";
import { followersRoutes } from "./followers";
import { likesRoutes } from "./likes";
import { postsRoutes } from "./posts";
import { sessionsRoutes } from "./sessions";
import { usersRoutes } from "./users";

export async function routes(app: FastifyInstance) {
  await app.register(followersRoutes);
  await app.register(likesRoutes);
  await app.register(postsRoutes);
  await app.register(sessionsRoutes);
  await app.register(usersRoutes);
}
