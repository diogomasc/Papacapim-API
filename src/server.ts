import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { env } from "./env";

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

const app = fastify();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, {
  origin: true,
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Papacapim API",
      description: "API RESTful para rede social Papacapim",
      version: "1.0.0",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Servidor local",
      },
    ],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

// Register session routes
app.register(createSessionRoute);
app.register(deleteSessionRoute);

// Register user routes
app.register(createUserRoute);
app.register(updateUserRoute);
app.register(listUsersRoute);
app.register(getUserRoute);
app.register(deleteUserRoute);

// Register follower routes
app.register(followUserRoute);
app.register(listFollowersRoute);
app.register(unfollowUserRoute);

// Register post routes
app.register(createPostRoute);
app.register(replyPostRoute);
app.register(listPostsRoute);
app.register(listUserPostsRoute);
app.register(listRepliesRoute);
app.register(deletePostRoute);

// Register like routes
app.register(likePostRoute);
app.register(listLikesRoute);
app.register(unlikePostRoute);

app
  .listen({
    port: env.PORT,
    host: "0.0.0.0",
  })
  .then(() => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(
      `📚 Swagger docs available at http://localhost:${env.PORT}/docs`,
    );
  });
