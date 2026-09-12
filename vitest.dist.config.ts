import { defineConfig } from 'vitest/config';

// Reads the built `dist/` directory. Run `npm run build` first.
export default defineConfig({
  test: {
    include: ['tests/dist/**/*.test.ts'],
    environment: 'node',
  },
});
