import { Controller, Post, Body } from '@nestjs/common';
import { IncomingWebhooksService } from './incoming-webhooks.service';
import type { ReplyWhatsappMessageDto } from './webhooks.types';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly incomingWebhooksService: IncomingWebhooksService,
  ) {}

  @Post('reply-whatsapp-message')
  async replyWhatsappMessage(@Body() body: ReplyWhatsappMessageDto) {
    return this.incomingWebhooksService.replyWhatsappMessage(body);
  }
}

