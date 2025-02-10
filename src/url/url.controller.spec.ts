import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import  request from 'supertest';
import { UrlController } from './url.controller';
import { AuthGuard } from '../guards/authentication.guard';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { UrlService } from './url.service';

describe('UrlController (Integration Tests)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let databaseService: DatabaseService;
  let token: string;
  let newUser:any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule],
      controllers: [UrlController],
      providers: [
        UrlService,
        DatabaseService,
        {
          provide: AuthGuard,
          useValue: { canActivate: () => true },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    jwtService = module.get<JwtService>(JwtService);
    databaseService = module.get<DatabaseService>(DatabaseService); // Inject DatabaseService
    // Hash password
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Insert test user into database
    const insertQuery = `
        INSERT INTO users (email, password)
        VALUES ($1, $2)
        RETURNING id, email
    `;
    const insertValues = ['test@example.com', hashedPassword];

    const  rows  = await databaseService.query(insertQuery, insertValues); // Use instance method
    newUser = rows[0];

    // Generate JWT token
    const payload = { userId: newUser.id, email: newUser.email };
    token = jwtService.sign(payload);

  });
  beforeEach(async () => {
    await databaseService.query(`DELETE FROM urls `);
    await databaseService.query(`DELETE FROM visits `);

  })

  describe("Post url/shorten" ,()=>{
    it('should return 200 for a valid shorten request', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/url/shorten')
        .set('Authorization', `Bearer ${token}`)
        .send({ longUrl: 'https://example.com' });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body.shortUrl).not.toBeNull();
      expect(response.body.message).toBe("URL shortened successfully");
    });

    it('should return conflict 409 for a repeated long url', async () => {
      const longUrl = 'https://example.com';
      const shortUrl = 'abc123';
      const userId = newUser.id;

      const insertQuery = `
    INSERT INTO urls (original_url, short_url, user_id)
    VALUES ($1, $2, $3)
    RETURNING id
  `;

      await databaseService.query(insertQuery, [longUrl, shortUrl, userId]);

      const response = await request(app.getHttpServer())
        .post('/v1/url/shorten')
        .set('Authorization', `Bearer ${token}`)
        .send({ longUrl });

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe('the URL has already been shortened');
    });
  })

  describe("Get url/:shortUrl" ,()=>{
    it('should return 308 for a valid shorten request', async () => {
      const longUrl = 'https://example.com';
      const shortUrl = 'abc123';
      const userId = newUser.id;

      const insertQuery = `
        INSERT INTO urls (original_url, short_url, user_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      await databaseService.query(insertQuery, [longUrl, shortUrl, userId]);

      const response = await request(app.getHttpServer())
       .get(`/v1/url/${shortUrl}`)
       .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HttpStatus.PERMANENT_REDIRECT);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("longUrl");
    });
    it('should return 404 for an invalid shorten request', async () => {
      const response = await request(app.getHttpServer())
       .get('/v1/url/invalid')
       .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      expect(response.body.message).toBe('URL not found');
    });
  });

  describe("Get url/stats/:shortUrl" ,()=>{
    it('should return 200 for a valid shorten request', async () => {
      const longUrl = 'https://example.com';
      const shortUrl = 'abc123';
      const userId = newUser.id;

      const insertQuery = `
        INSERT INTO urls (original_url, short_url, user_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      await databaseService.query(insertQuery, [longUrl, shortUrl, userId]);

      const response = await request(app.getHttpServer())
       .get(`/v1/url/stats/${shortUrl}`)
       .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('stats');
    });
  })
  afterAll(async () => {
    await databaseService.query(`DELETE FROM users `);
    await databaseService.query(`DELETE FROM urls `);
    await databaseService.query(`DELETE FROM visits `);
    await app.close();
  });
});
