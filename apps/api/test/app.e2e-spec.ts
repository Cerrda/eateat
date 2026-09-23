import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  const prisma = {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
  };

  beforeEach(async () => {
    prisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health/live', () => {
    return request(app.getHttpServer()).get('/api/health/live').expect(200);
  });

  it('GET /api/health/ready', () => {
    return request(app.getHttpServer()).get('/api/health/ready').expect(200);
  });

  it('GET /api/health/ready reports down when the database check fails', () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));

    return request(app.getHttpServer()).get('/api/health/ready').expect(503);
  });
});
