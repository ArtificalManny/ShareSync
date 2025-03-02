// data-source.ts
import { DataSource } from 'typeorm';
import { User } from './src/modules/users/entities/user.entity';
import { Auth } from './src/modules/auth/entities/auth.entity';
// Import other entities as needed
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Auth /*, other entities */],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false, // Set to false when using migrations
  logging: false,
});
