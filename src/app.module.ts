import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesGuard } from './auth/guards/role-auth.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PrismaModule } from 'prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { AdminsModule } from './admins/admins.module';
import { ThreadsModule } from './threads/threads.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerConfigService } from './config/throttler-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfigService,
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    AdminsModule,
    ThreadsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, 
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
