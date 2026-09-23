import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      WEB_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://eateat:eateat@localhost:5432/eateat?schema=public',
    },
  },
});
