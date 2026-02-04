import type { FastifyInstance } from "fastify";
import { followUserRoute } from "./follow-user-route";
import { listFollowersRoute } from "./list-followers-route";
import { unfollowUserRoute } from "./unfollow-user-route";

export async function followersRoutes(app: FastifyInstance) {
  await app.register(followUserRoute);
  await app.register(listFollowersRoute);
  await app.register(unfollowUserRoute);
}
