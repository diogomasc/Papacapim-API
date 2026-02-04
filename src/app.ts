import { fastifyCors } from "@fastify/cors";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import { fastify } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { routes } from "./routes";

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

  // Registra todas as rotas
  await app.register(routes);

  return app;
}
