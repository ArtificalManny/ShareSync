import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppModule } from '../../src/app.module';
import { setupTestDatabase, closeTestDatabase } from '../helpers/test-db.helper';
import { io as ioClient, Socket } from 'socket.io-client';

describe('Socket.IO Integration Tests', () => {
  let app: INestApplication;
  let connection: Connection;
  let authToken: string;
  let clientSocket: Socket;
  let serverAddress: string;

  const testUser = {
    firstName: 'Socket',
    lastName: 'Tester',
    username: 'sockettester',
    email: 'socket@example.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        await setupTestDatabase(),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    connection = moduleFixture.get<Connection>(getConnectionToken());
    
    await app.listen(0);
    const address = app.getHttpServer().address();
    serverAddress = `http://localhost:${address.port}`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    await closeTestDatabase(connection);
    await app.close();
  });

  afterEach(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    
    const collections = ['projects', 'tasks'];
    for (const collectionName of collections) {
      const collection = connection.collections[collectionName];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  });

  describe('Socket Connection', () => {
    it('should connect to socket server with valid auth', (done) => {
      clientSocket = ioClient(serverAddress, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should disconnect gracefully', (done) => {
      clientSocket = ioClient(serverAddress, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
    });
  });

  // TODO: Event emission tests - requires backend controllers to emit Socket.IO events
  // Currently, the Socket.IO infrastructure (gateways) exists but controllers don't broadcast:
  // - project:created
  // - project:updated  
  // - project:deleted
  // - tasks:created
  // - tasks:updated
  //
  // To implement:
  // 1. Inject gateway into ProjectService/TasksService
  // 2. Emit events after CRUD operations
  // 3. Join project rooms when clients connect
  //
  // These tests are skipped until event emission is implemented in the backend.
});
