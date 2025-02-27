import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // Create a NestExpressApplication so we can serve static assets if needed
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  //Enable CORS (adjust origin to match your frontend URL)
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  //Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe());

  //Swagger Configuration
  const config = new DocumentBuilder()
  .setTitle('Intacom API')
  .setDescription('API documentation for Intacom platform')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
  const document  = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  //Serve Static Assets (e.g., upload images)
  //This example serves files from 'uploads' folder at the route '/uploads'
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  //Start the server on port 3000 (adjust as needed)
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();