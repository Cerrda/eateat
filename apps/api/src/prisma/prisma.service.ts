import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { databaseConfig } from '../config/database.config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(databaseConfig.KEY) database: ConfigType<typeof databaseConfig>) {
    const adapter = new PrismaPg({
      connectionString: database.url,
      max: 1,
      idleTimeoutMillis: 10_000,
    });
    super({ adapter });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
