import { Module } from '@nestjs/common';
import { OutgoingWebhooksService } from './outgoing-webhooks.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  providers: [OutgoingWebhooksService],
  exports: [OutgoingWebhooksService],
})
export class WebhooksModule {}

