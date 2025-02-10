import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from './auth.module';
import bcrypt from 'bcrypt';

describe('AuthController (Integration Tests)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule],
      controllers: [AuthController],
      providers: [AuthService, DatabaseService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    databaseService = module.get<DatabaseService>(DatabaseService);

  });

  beforeEach(async () => {
    await databaseService.query(`DELETE FROM users WHERE email = $1` ,['testAuth@example.com']);
    const hashedPassword = await bcrypt.hash('12345678', 10); // Hash the password before inserting

    await databaseService.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      ['testAuth@example.com', hashedPassword] // Store hashed password
    );
  })

  describe('POST /v1/auth/sign-up', () => {
    it('should return 200 for a valid signup', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/sign-up')
        .send({ email: 'newuser@example.com', password: 'password123' });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('user created successfully');
    });

    it('should return 409 if email already exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/sign-up')
        .send({ email: 'testAuth@example.com', password: '12345678' });

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe('User with the same email already exists');
    });
  });

  describe('POST /v1/auth/sign-in', () => {
    it('should return 200 and a token for valid credentials', async () => {

      const response = await request(app.getHttpServer())
        .post('/v1/auth/sign-in')
        .send({ email: 'testAuth@example.com', password: '12345678' });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
    });


    it('should return 401 for invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/sign-in')
        .send({ email: 'testAuth@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
