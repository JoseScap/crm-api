import { Controller, Get, Post, Body, Headers, Query, Req } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('webhook')
  webhook(
    @Body() body: any,
    @Headers() headers: any,
    @Query() query: any,
    @Req() request: any,  
  ) {
    return this.appService.handleWebhook(
      body,
      headers,
      query,
      request.method,
      request.url,
      request.path,
    );
  }
}
