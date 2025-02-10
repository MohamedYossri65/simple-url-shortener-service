import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class ShortenUrlDto {
  @IsNotEmpty({ message: 'URL is required' })
  @IsString({ message: 'URL must be a string' })
  @IsUrl({}, { message: 'Invalid URL format' })
  longUrl: string;
}