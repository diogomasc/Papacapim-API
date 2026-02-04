import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    reporters: "verbose",
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "src/tests/**",
        "src/drizzle/migrations/**",
        "src/server.ts",
      ],
    },
  },
});
