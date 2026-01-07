import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ConfigModule } from '@nestjs/config';
import { SignatureGuard } from '../auth/signature.guard';
import { SignatureService } from '../auth/signature.service';

@Module({
  imports: [ConfigModule.forRoot(), SupabaseModule, WebhooksModule],
  controllers: [LeadsController],
  providers: [LeadsService, SignatureGuard, SignatureService],
})
export class LeadsModule {}
