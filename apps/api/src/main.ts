import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser('json', { limit: '18mb' });
  app.enableShutdownHooks();
  configureApp(app);

  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('app.port'));
}

await bootstrap();
