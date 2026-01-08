import { Controller, Post, Body, Get } from '@nestjs/common';
import { IncomingWebhooksService } from './incoming-webhooks.service';
import type {
  ReplyWhatsappMessageDto,
  ChangeLeadStageDto,
  CheckAvailabilityForMeetingDto,
  BookMeetingDto,
} from './webhooks.types';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly incomingWebhooksService: IncomingWebhooksService,
  ) {}

  @Post('reply-whatsapp-message')
  async replyWhatsappMessage(@Body() body: ReplyWhatsappMessageDto) {
    return this.incomingWebhooksService.replyWhatsappMessage(body);
  }

  @Post('change-lead-stage')
  async changeLeadStage(@Body() body: ChangeLeadStageDto) {
    return this.incomingWebhooksService.changeLeadStage(body);
  }

  @Post('check-availability')
  async checkAvailability(@Body() body: CheckAvailabilityForMeetingDto) {
    return this.incomingWebhooksService.checkAvailabilityForMeeting(body);
  }

  @Post('book-meeting')
  async bookMeeting(@Body() body: BookMeetingDto) {
    return this.incomingWebhooksService.bookMeeting(body);
  }
}

