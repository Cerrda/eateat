import pg from 'pg';
import migration from './prisma/migrations/20260923120000_init_kitchen/migration.sql' with { type: 'text' };
import service from './service.ts';

const { db } = service.load();
const { webOrigin } = service.input();

process.env.DATABASE_URL = db.url;
process.env.PORT = String(service.port());
process.env.WEB_ORIGIN = webOrigin;
process.env.NODE_ENV = 'production';

const client = new pg.Client({ connectionString: db.url });
await client.connect();
try {
  const found = await client.query<{ name: string | null }>(`SELECT to_regclass('public."Member"') AS name`);
  if (!found.rows[0]?.name) {
    await client.query(migration);
  }
} finally {
  await client.end();
}

await import('./src/main.ts');
