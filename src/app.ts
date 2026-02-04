import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

// Session routes
import { createSessionRoute } from "./routes/sessions/create-session-route";
import { deleteSessionRoute } from "./routes/sessions/delete-session-route";

// User routes
import { createUserRoute } from "./routes/users/create-user-route";
import { updateUserRoute } from "./routes/users/update-user-route";
import { listUsersRoute } from "./routes/users/list-users-route";
import { getUserRoute } from "./routes/users/get-user-route";
import { deleteUserRoute } from "./routes/users/delete-user-route";

// Follower routes
import { followUserRoute } from "./routes/followers/follow-user-route";
import { listFollowersRoute } from "./routes/followers/list-followers-route";
import { unfollowUserRoute } from "./routes/followers/unfollow-user-route";

// Post routes
import { createPostRoute } from "./routes/posts/create-post-route";
import { replyPostRoute } from "./routes/posts/reply-post-route";
import { listPostsRoute } from "./routes/posts/list-posts-route";
import { listUserPostsRoute } from "./routes/posts/list-user-posts-route";
import { listRepliesRoute } from "./routes/posts/list-replies-route";
import { deletePostRoute } from "./routes/posts/delete-post-route";

// Like routes
import { likePostRoute } from "./routes/likes/like-post-route";
import { listLikesRoute } from "./routes/likes/list-likes-route";
import { unlikePostRoute } from "./routes/likes/unlike-post-route";

export async function createApp() {
  const app = fastify();

  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);

  await app.register(fastifyCors, { origin: "*" });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Papacapim API",
        version: "1.0.0",
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
  });

  // Register session routes
  await app.register(createSessionRoute);
  await app.register(deleteSessionRoute);

  // Register user routes
  await app.register(createUserRoute);
  await app.register(updateUserRoute);
  await app.register(listUsersRoute);
  await app.register(getUserRoute);
  await app.register(deleteUserRoute);

  // Register follower routes
  await app.register(followUserRoute);
  await app.register(listFollowersRoute);
  await app.register(unfollowUserRoute);

  // Register post routes
  await app.register(createPostRoute);
  await app.register(replyPostRoute);
  await app.register(listPostsRoute);
  await app.register(listUserPostsRoute);
  await app.register(listRepliesRoute);
  await app.register(deletePostRoute);

  // Register like routes
  await app.register(likePostRoute);
  await app.register(listLikesRoute);
  await app.register(unlikePostRoute);

  return app;
}
