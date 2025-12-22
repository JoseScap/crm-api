import { Controller, Post, Get, Body, Headers, Query, Req, Param } from '@nestjs/common';
import { DealsService } from './deals.service';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post('whatsapp/webhook/message-received')
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

  @Get('whatsapp/messages/:conversationId')
  async getChatMessages(
    @Param('phoneNumberId') phoneNumberId: string,
    @Query('phoneNumber') phoneNumber: string,
    @Query('conversationId') conversationId: string,
    @Query('limit') limit: string,
    @Query('before') before?: string,
    @Query('after') after?: string,
  ) {
    const options: {
      phoneNumber: string;
      conversationId: string;
      limit: number;
      before?: string;
      after?: string;
    } = {
      phoneNumber: phoneNumber,
      conversationId: conversationId,
      limit: parseInt(limit, 10),
      before: before,
      after: after,
    };

    if (conversationId) {
      options.conversationId = conversationId;
    }

    if (limit) {
      const limitNumber = parseInt(limit, 10);
      if (!isNaN(limitNumber) && limitNumber >= 1 && limitNumber <= 100) {
        options.limit = limitNumber;
      }
    }

    if (before) {
      options.before = before;
    }

    if (after) {
      options.after = after;
    }

    return this.dealsService.getChatMessages(phoneNumberId, options);
  }

  @Post('whatsapp/messages/:phoneNumberId')
  async sendMessage(
    @Param('phoneNumberId') phoneNumberId: string,
    @Body() body: { to: string; text: string; preview_url?: boolean },
  ) {
    return this.dealsService.sendMessage(
      phoneNumberId,
      body.to,
      body.text,
      body.preview_url,
    );
  }
}

