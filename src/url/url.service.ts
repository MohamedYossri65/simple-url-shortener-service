import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { catchAsyncErr } from '../utils/catchAsyncError';
import * as shortid from 'shortid';
import { UUIDTypes } from 'uuid';

@Injectable()
export class UrlService {

  constructor(private readonly databaseService: DatabaseService) {}


  shorten = catchAsyncErr(async (longUrl: String ,userId:UUIDTypes): Promise<any> =>{
    const queryText = 'SELECT * FROM urls WHERE original_url = $1';
    const values = [longUrl];

    const existingUrl = await this.databaseService.query(queryText, values);

    if (existingUrl.length > 0) {
      throw new HttpException(
        'the URL has already been shortened',
        HttpStatus.CONFLICT,
      );
    }
    const shortUrl = shortid.generate();
    const query = `
      INSERT INTO urls (original_url, short_url ,user_id)
      VALUES ($1, $2 ,$3)
      RETURNING short_url;
    `;
    const result = await this.databaseService.query(query, [longUrl, shortUrl ,userId]);
    return {
      success: true ,
      message: 'URL shortened successfully',
      shortUrl: result[0].short_url,
      longUrl
    };
  })

  getLongUrl = catchAsyncErr(async (shortUrl: string ,userAgent:String ,ipAddress:string): Promise<any>=> {
    const query = `
      SELECT * FROM urls
      WHERE short_url = $1;
    `;
    const result = await this.databaseService.query(query, [shortUrl]);
    if (result.length === 0) {
      throw new HttpException('URL not found' ,404);
    }
    await this.trackVisit(result[0].id, userAgent ,ipAddress)
     return {
      success: true,
      message: 'URL retrieved successfully',
      longUrl: result[0].original_url,
    };
  })

  trackVisit = catchAsyncErr(async (urlId: number, userAgent: string, ipAddress: string): Promise<void> => {
    const query = `
      INSERT INTO visits (url_id, user_agent, ip_address)
      VALUES ($1, $2, $3);
    `;
    await this.databaseService.query(query, [urlId, userAgent, ipAddress]);
  })

  getStats  = catchAsyncErr(async (shortUrl: string): Promise<any> =>{
    const urlQuery = `
      SELECT id FROM urls
      WHERE short_url = $1;
    `;
    const urlResult = await this.databaseService.query(urlQuery, [shortUrl]);
    if (urlResult.length === 0) {
      throw new Error('URL not found');
    }
    const urlId = urlResult[0].id;

    const statsQuery = `
      SELECT COUNT(*) as visits, MIN(visited_at) as first_visit, MAX(visited_at) as last_visit
      FROM visits
      WHERE url_id = $1;
    `;
    const statsResult = await this.databaseService.query(statsQuery, [urlId]);
    return {
      success: true,
      message: 'URL statistics retrieved successfully',
      stats: statsResult[0]
    };
  })
}
