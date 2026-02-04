import type { FastifyInstance } from "fastify";
import { createUserRoute } from "./create-user-route";
import { deleteUserRoute } from "./delete-user-route";
import { getUserRoute } from "./get-user-route";
import { listUsersRoute } from "./list-users-route";
import { updateUserRoute } from "./update-user-route";

export async function usersRoutes(app: FastifyInstance) {
  await app.register(createUserRoute);
  await app.register(deleteUserRoute);
  await app.register(getUserRoute);
  await app.register(listUsersRoute);
  await app.register(updateUserRoute);
}
