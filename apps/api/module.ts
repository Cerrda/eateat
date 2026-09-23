import { module } from '@prisma/composer';
import { envParam, rawPostgres } from '@prisma/composer-prisma-cloud';
import api from './service.ts';

export default module('eateat', ({ provision }) => {
  const db = provision(rawPostgres({ name: 'database' }));
  provision(api, {
    deps: { db },
    input: { webOrigin: envParam('WEB_ORIGIN') },
  });
});
