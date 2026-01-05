import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}

