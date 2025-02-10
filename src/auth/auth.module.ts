import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from '../guards/authentication.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
        }),
      ],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '90d' },
      }),
    }),
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
