import { Controller, Post, Get, Body, Headers, Query, Req, Param } from '@nestjs/common';
import { DealsService } from './deals.service';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post('whatsapp/webhook')
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

  @Get('whatsapp/conversation/:conversationId')
  async getConversation(@Param('conversationId') conversationId: string) {
    return this.dealsService.getConversation(conversationId);
  }
}

