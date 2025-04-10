import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { register } from 'tsconfig-paths';
import { createSwaggerConfig, generateSwaggerHtml } from '../src/config/swagger/swagger.config.shared';

// Register path aliases
const tsConfig = require('../tsconfig.json');
const baseUrl = path.resolve(__dirname, '..');
register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});

async function generateSwaggerDocs() {
  // Create a NestJS application instance
  const app = await NestFactory.create(AppModule);
  
  // Configure Swagger
  const config = createSwaggerConfig();

  // Generate Swagger document
  const document = SwaggerModule.createDocument(app, config);
  
  // Create docs directory if it doesn't exist
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Create __GENERATED__ directory if it doesn't exist
  const generatedDir = path.join(docsDir, '__GENERATED__');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }
  
  // Write the Swagger JSON file
  fs.writeFileSync(
    path.join(generatedDir, 'swagger.json'),
    JSON.stringify(document, null, 2)
  );
  
  // Write the Swagger YAML file
  fs.writeFileSync(
    path.join(generatedDir, 'swagger.yaml'),
    JSON.stringify(document, null, 2)
  );
  
  // Create a simple HTML file to view the documentation
  fs.writeFileSync(
    path.join(generatedDir, 'index.html'),
    generateSwaggerHtml('./swagger.json')
  );
  
  console.log(`Static Swagger documentation generated in ${generatedDir}`);
  console.log(`Open ${path.join(generatedDir, 'index.html')} in your browser to view the documentation`);
  
  // Close the application
  await app.close();
}

// Run the function
generateSwaggerDocs().catch(console.error); 