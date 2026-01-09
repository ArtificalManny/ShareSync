import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

let mongod: MongoMemoryServer;

export const setupTestDatabase = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  return MongooseModule.forRoot(uri);
};

export const closeTestDatabase = async (connection: Connection) => {
  if (connection) {
    await connection.dropDatabase();
    await connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
};

export const clearTestDatabase = async (connection: Connection) => {
  const collections = connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
