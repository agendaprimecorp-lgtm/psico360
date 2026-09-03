import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Os testes compartilham o mesmo banco de testes; em série, um não
    // enxerga o preparo do outro.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
