import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    nodeEnv:
      nodeEnv === 'production' || nodeEnv === 'test' ? nodeEnv : 'development',
    port: Number(process.env.PORT ?? 3000),
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  };
});
