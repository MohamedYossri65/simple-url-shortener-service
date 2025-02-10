import { IsNotEmpty, IsString } from 'class-validator';

export class RedirectUrlDto {
  @IsNotEmpty({ message: 'Short URL is required' })
  @IsString({ message: 'Short URL must be a string' })
  shortUrl: string;
}
