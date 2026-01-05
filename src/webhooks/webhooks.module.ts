import { Module } from '@nestjs/common';
import { OutgoingWebhooksService } from './outgoing-webhooks.service';
import { IncomingWebhooksService } from './incoming-webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookOriginGuard } from '../auth/webhook-origin.guard';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [WhatsappModule, SupabaseModule],
  controllers: [WebhooksController],
  providers: [OutgoingWebhooksService, IncomingWebhooksService, WebhookOriginGuard],
  exports: [OutgoingWebhooksService],
})
export class WebhooksModule {}

