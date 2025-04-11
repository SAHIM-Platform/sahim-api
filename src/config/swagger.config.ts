import { SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { createSwaggerConfig, generateSwaggerHtml } from './swagger/swagger.config.shared';

export const setupSwagger = (app: INestApplication) => {
  const config = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  
  // Setup Swagger UI
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  // Generate static documentation files in development
  if (process.env.NODE_ENV === 'development') {
    generateStaticDocs(document);
  }
};

/**
 * Generates static Swagger documentation files
 * @param document The Swagger document
 */
const generateStaticDocs = (document: any) => {
  // Create docs directory if it doesn't exist
  const docsDir = path.join(process.cwd(), 'docs', '__GENERATED__');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Write the Swagger JSON file
  fs.writeFileSync(
    path.join(docsDir, 'swagger.json'),
    JSON.stringify(document, null, 2)
  );
  
  // Write the Swagger YAML file
  fs.writeFileSync(
    path.join(docsDir, 'swagger.yaml'),
    JSON.stringify(document, null, 2)
  );
  
  // Create a simple HTML file to view the documentation
  fs.writeFileSync(
    path.join(docsDir, 'index.html'),
    generateSwaggerHtml('./swagger.json')
  );
  
  console.log(`Static Swagger documentation generated in ${docsDir}`);
  console.log(`Open ${path.join(docsDir, 'index.html')} in your browser to view the documentation`);
};