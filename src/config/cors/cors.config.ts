import { INestApplication, Logger } from '@nestjs/common';

/**
 * Configures CORS settings for the application.
 * @param app - NestJS application instance.
 */
export function setupCors(app: INestApplication) {
  const logger = new Logger('CORS');
  const corsOrigins = process.env.CORS?.split(',') || ['http://localhost:3000'];

  // Enable CORS with specified origins
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],  // Allow Authorization header to be exposed to the frontend
    optionsSuccessStatus: 204,
  });

  logger.log(`CORS enabled for: ${corsOrigins.join(', ')}`);
}
