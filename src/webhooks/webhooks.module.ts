import { Module } from '@nestjs/common';
import { OutgoingWebhooksService } from './outgoing-webhooks.service';
import { IncomingWebhooksService } from './incoming-webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [WhatsappModule, SupabaseModule, GoogleModule],
  controllers: [WebhooksController],
  providers: [OutgoingWebhooksService, IncomingWebhooksService],
  exports: [OutgoingWebhooksService],
})
export class WebhooksModule {}

