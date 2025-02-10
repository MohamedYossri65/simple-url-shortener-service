import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/authentication.guard';
import { UrlService } from './url.service';
import { Request } from 'express';
import { CustomResponse } from '../utils/custom-response';
import { ShortenUrlDto } from './dtos/shorten-url.dto';
import { RedirectUrlDto } from './dtos/redirect-url.dto';

@Controller('v1/url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async shorten(@Body() shortenUrlDto: ShortenUrlDto, @Req() req: any): Promise<CustomResponse> {
    return await this.urlService.shorten(shortenUrlDto.longUrl, req.user.id);
  }

  @Get(':shortUrl')
  @HttpCode(HttpStatus.PERMANENT_REDIRECT)
  async redirect(@Param() params: RedirectUrlDto, @Req() req: Request): Promise<CustomResponse> {
    return await this.urlService.getLongUrl(params.shortUrl, req.headers['user-agent'], req.ip);
  }
  @Get('stats/:shortUrl')
  @UseGuards(AuthGuard)
  async stats(@Param() params: RedirectUrlDto):Promise<CustomResponse> {
    return this.urlService.getStats(params.shortUrl);
  }

}
