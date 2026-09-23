import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      WEB_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://eateat:eateat@localhost:5432/eateat?schema=public',
    },
  },
});
