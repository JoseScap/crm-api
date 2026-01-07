import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Query,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { SignatureGuard, UseSignature } from '../auth/signature.guard';
import { knownSignatureConfigs } from 'src/auth/signature.config';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('whatsapp/webhook/message-received')
  @UseSignature({
    secretKeyEnvVar: knownSignatureConfigs.KAPSO_WEBHOOK.secretEnvVar,
    headerNameEnvVar: knownSignatureConfigs.KAPSO_WEBHOOK.headerEnvVar,
    algorithm: 'sha256',
    encoding: 'hex',
  })
  @UseGuards(SignatureGuard)
  async handleWhatsappWebhook(
    @Body() body: any,
    @Headers() headers: any,
    @Query() query: any,
    @Req() request: any,
  ) {
    return this.leadsService.handleWhatsappWebhook({
      body,
      headers,
      query,
      method: request.method,
      url: request.url,
      path: request.path,
    });
  }

  @Get('whatsapp/messages/:phoneNumberId')
  async getChatMessages(
    @Param('phoneNumberId') phoneNumberId: string,
    @Query('phone_number') phoneNumber: string,
    @Query('conversation_id') conversationId: string,
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

    return this.leadsService.getChatMessages(phoneNumberId, options);
  }

  @Post('whatsapp/messages/:phoneNumberId')
  async sendMessage(
    @Param('phoneNumberId') phoneNumberId: string,
    @Body() body: { to: string; text: string; preview_url?: boolean },
  ) {
    return this.leadsService.sendMessage(
      phoneNumberId,
      body.to,
      body.text,
      body.preview_url,
    );
  }

}

