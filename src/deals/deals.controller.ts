import { Controller, Post, Body, Headers, Query, Req } from '@nestjs/common';
import { DealsService } from './deals.service';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post('webhook/whatsapp')
  async webhook(
    @Body() body: any,
    @Headers() headers: any,
    @Query() query: any,
    @Req() request: any,
  ) {
    return this.dealsService.handleWebhook(
      body,
      headers,
      query,
      request.method,
      request.url,
      request.path,
    );
  }
}

