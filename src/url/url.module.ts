import { Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { DatabaseModule } from '../database/database.module';
import { UrlController } from './url.controller';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule ,AuthModule],
  controllers: [UrlController],
  providers: [UrlService ,JwtService]
})
export class UrlModule {}
