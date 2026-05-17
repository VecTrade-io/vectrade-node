import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    exclude: ["benchmarks/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
  },
});
