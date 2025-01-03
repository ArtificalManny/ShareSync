import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    //Serve static files
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });

    //Enable CORS for frontend domain
    app.enableCors({
        origin: 'http://localhost:3000' //Update with your frontend URL
        credentials: true,
    });

        await app.listen(3000);
}
bootstrap();