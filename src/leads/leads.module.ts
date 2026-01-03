import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CacheModule } from '../cache/cache.module';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { SignatureGuard } from '../auth/signature.guard';
import { SignatureService } from '../auth/signature.service';

@Module({
  imports: [ConfigModule.forRoot(), SupabaseModule, CacheModule],
  controllers: [LeadsController],
  providers: [LeadsService, ApiKeyGuard, SignatureGuard, SignatureService],
})
export class LeadsModule {}
