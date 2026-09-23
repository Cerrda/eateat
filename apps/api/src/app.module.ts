import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config.js';
import { databaseConfig } from './config/database.config.js';
import { validateEnv } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { DishModule } from './dishes/dish.module.js';
import { HealthModule } from './health/health.module.js';
import { KitchenModule } from './kitchen/kitchen.module.js';
import { MediaModule } from './media/media.module.js';
import { OrderModule } from './orders/order.module.js';
import { RecordModule } from './records/record.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig],
      validate: validateEnv,
    }),
    HealthModule,
    MediaModule,
    AuthModule,
    KitchenModule,
    DishModule,
    OrderModule,
    RecordModule,
  ],
})
export class AppModule {}
