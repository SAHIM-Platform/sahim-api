import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from 'prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesGuard } from './auth/guards/role-auth.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
