import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/users/auth.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '.env', // Explicitly specify the .env file
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        console.log('MONGODB_URI in AppModule:', uri); // Debug log
        if (!uri) {
          throw new Error('MONGODB_URI is not defined in .env');
        }
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UploadsModule,
    ProjectsModule,
  ],
})
export class AppModule {}