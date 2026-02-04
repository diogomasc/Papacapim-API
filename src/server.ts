import { env } from "./env";
import { createApp } from "./app";

const app = await createApp();

await app.listen({ port: env.PORT, host: "0.0.0.0" });

console.log(`🚀 Server running on http://localhost:${env.PORT}`);
console.log(`📚 Swagger docs available at http://localhost:${env.PORT}/docs`);
