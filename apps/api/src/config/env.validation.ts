const NODE_ENVS = ['development', 'test', 'production'] as const;

export type NodeEnv = (typeof NODE_ENVS)[number];

export interface ValidatedEnv extends Record<string, unknown> {
  NODE_ENV: NodeEnv;
  PORT: number;
  WEB_ORIGIN: string;
  DATABASE_URL: string;
}

export function validateEnv(config: Record<string, unknown>): ValidatedEnv {
  const nodeEnv = config.NODE_ENV ?? 'development';
  if (typeof nodeEnv !== 'string' || !isNodeEnv(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const webOrigin = config.WEB_ORIGIN ?? 'http://localhost:5173';
  if (typeof webOrigin !== 'string' || webOrigin.length === 0) {
    throw new Error('WEB_ORIGIN must be a non-empty string');
  }

  const databaseUrl = config.DATABASE_URL;
  if (!isPostgresUrl(databaseUrl)) {
    throw new Error('DATABASE_URL must be a postgresql connection string');
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    WEB_ORIGIN: webOrigin,
    DATABASE_URL: databaseUrl,
  };
}

function isNodeEnv(value: string): value is NodeEnv {
  return NODE_ENVS.some((env) => env === value);
}

function isPostgresUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (value.startsWith('postgresql://') || value.startsWith('postgres://'))
  );
}
