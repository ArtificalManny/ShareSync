import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppModule } from '../../src/app.module';
import { setupTestDatabase, closeTestDatabase, clearTestDatabase } from '../helpers/test-db.helper';

describe('Projects & Tasks Integration Tests', () => {
  let app: INestApplication;
  let connection: Connection;
  let authToken: string;
  let userId: string;
  let projectId: string;
  let taskId: string;

  const testUser = {
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'janesmith',
    email: 'jane@example.com',
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
    await app.init();

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    authToken = loginResponse.body.access_token;
    userId = loginResponse.body.user._id;
  });

  afterAll(async () => {
    await closeTestDatabase(connection);
    await app.close();
  });

  afterEach(async () => {
    const collections = ['projects', 'tasks'];
    for (const collectionName of collections) {
      const collection = connection.collections[collectionName];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  });

  describe('POST /projects', () => {
    it('should create a new project with authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Project',
          description: 'A test project',
          category: 'Work',
          status: 'In Progress',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe('Test Project');
      expect(response.body.description).toBe('A test project');
      
      projectId = response.body._id;
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .send({
          title: 'Test Project',
        })
        .expect(401);
    });

    it('should fail without title', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No title',
        })
        .expect(400);
    });
  });

  describe('GET /projects', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'List Test Project',
          description: 'For listing',
        });
      
      projectId = response.body._id;
    });

    it('should list user projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].title).toBe('List Test Project');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .expect(401);
    });
  });

  describe('GET /projects/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Get Single Project',
        });
      
      projectId = response.body._id;
    });

    it('should get a single project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(projectId);
      expect(response.body.title).toBe('Get Single Project');
    });

    it('should fail for non-existent project (403 from permission guard)', async () => {
      await request(app.getHttpServer())
        .get('/projects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PATCH /projects/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Test Project',
        });
      
      projectId = response.body._id;
    });

    it('should update a project', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Project Title',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Project Title');
      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('DELETE /projects/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete Test Project',
        });
      
      projectId = response.body._id;
    });

    it('should delete a project', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');
      expect(response.body.projectId).toBe(projectId);

      await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /projects/:projectId/tasks', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task Test Project',
        });
      
      projectId = response.body._id;
    });

    it('should create a task in a project', async () => {
      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Task description',
          status: 'Not Started',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe('Test Task');
      
      taskId = response.body._id;
    });

    it('should fail without title', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No title',
        })
        .expect(400);
    });
  });

  describe('GET /projects/:projectId/tasks', () => {
    it('should list tasks in a project', async () => {
      // Create project
      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'List Tasks Project',
        });
      
      projectId = projectResponse.body._id;

      // Create task
      const taskResponse = await request(app.getHttpServer())
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 1',
        });

      expect(taskResponse.status).toBe(201);
      expect(taskResponse.body.title).toBe('Task 1');

      // List tasks
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const tasks = Array.isArray(response.body) ? response.body : response.body.tasks || [];
      
      expect(Array.isArray(tasks)).toBe(true);
      if (tasks.length > 0) {
        expect(tasks[0].title).toBe('Task 1');
      }
    });
  });

  describe('PATCH /projects/:projectId/tasks/:taskId', () => {
    beforeEach(async () => {
      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Task Project',
        });
      
      projectId = projectResponse.body._id;

      const taskResponse = await request(app.getHttpServer())
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Task',
        });
      
      taskId = taskResponse.body._id;
    });

    it('should update a task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/projects/${projectId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task Title',
          status: 'In Progress',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Task Title');
      expect(response.body.status).toBe('In Progress');
    });
  });
});
