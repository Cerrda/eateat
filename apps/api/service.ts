import node from '@prisma/composer/node';
import { compute, rawPostgres } from '@prisma/composer-prisma-cloud';
import { type } from 'arktype';

const apiInput = type({
  webOrigin: 'string',
});

export default compute({
  name: 'api',
  deps: { db: rawPostgres() },
  input: apiInput,
  build: node({ module: import.meta.url, entry: './dist/server.mjs' }),
});
