import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT ?? 5000;
  await app.listen(port);
  app.use(cookieParser());

  if (process.env.NODE_ENV === 'development') {
    console.log(`Application is running on: http://localhost:${port}`);
  }
}
bootstrap();
