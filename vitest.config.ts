import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/index.ts', 'src/adapters/preact.tsx', 'src/adapters/solid.tsx', 'src/adapters/astro.ts'],
      thresholds: {
        lines: 95,
        functions: 85,
        statements: 90,
      },
    },
  },
});
