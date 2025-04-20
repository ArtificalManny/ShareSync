import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Global CORS configuration
    app.enableCors({
      origin: 'http://localhost:54693',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    });

    await app.listen(3001);
    console.log('Backend server running on http://localhost:3001');
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}
bootstrap();