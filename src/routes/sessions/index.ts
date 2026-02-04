import type { FastifyInstance } from "fastify";
import { createSessionRoute } from "./create-session-route";
import { deleteSessionRoute } from "./delete-session-route";

export async function sessionsRoutes(app: FastifyInstance) {
  await app.register(createSessionRoute);
  await app.register(deleteSessionRoute);
}
