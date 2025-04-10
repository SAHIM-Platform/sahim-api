import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { setupCors } from './config/cors/cors.config';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT ?? 5000;
  setupCors(app);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Removes any properties that are not explicitly defined in the DTO
      forbidNonWhitelisted: true, // Prevents request from containing any properties not allowed in the DTO
      transform: true, // Automatically transforms input data to the expected types
      errorHttpStatusCode: 400, // Ensures that the error response has a 'Bad Request' status code
      stopAtFirstError: false, // Allows all validation errors to be shown, not just the first one
    }),
  );

  if (process.env.NODE_ENV === 'development') {
    setupSwagger(app);
    console.log(`Swagger docs available at: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  if (process.env.NODE_ENV === 'development') {
    console.log(`Application is running on: http://localhost:${port}`);
  }
}
bootstrap();

