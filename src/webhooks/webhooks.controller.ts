import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IncomingWebhooksService } from './incoming-webhooks.service';
import type { ReplyWhatsappMessageDto } from './webhooks.types';
import { WebhookOriginGuard } from '../auth/webhook-origin.guard';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly incomingWebhooksService: IncomingWebhooksService,
  ) {}

  @Post('reply-whatsapp-message')
  @UseGuards(WebhookOriginGuard)
  async replyWhatsappMessage(@Body() body: ReplyWhatsappMessageDto) {
    return this.incomingWebhooksService.replyWhatsappMessage(body);
  }
}

