import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exeptionFilters/GlobalExceptionFilter';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common'
import morgan from 'morgan';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';



async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )

  // Set security HTTP headers
  app.use(helmet());
  // Data sanitization against NoSQL query injection
  app.use(ExpressMongoSanitize());
  // Compression middleware
  app.use(compression());
  // Logging middleware in development environment  (optional)  // Enable this line only in development environment to see logs in console.
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);

}
bootstrap();
