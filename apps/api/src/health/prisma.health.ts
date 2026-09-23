import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PrismaHealthIndicator {
  private readonly logger = new Logger(PrismaHealthIndicator.name);

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  pingCheck(key: string) {
    return this.healthIndicatorService.check(key).attempt(async () => {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        this.logger.error(
          JSON.stringify({ msg: 'database readiness check failed' }),
          error instanceof Error ? error.stack : undefined,
        );
        throw new Error('database unavailable');
      }
    });
  }
}
