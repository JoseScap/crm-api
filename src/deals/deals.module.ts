import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CacheModule } from '../cache/cache.module';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { SignatureGuard } from '../auth/signature.guard';
import { SignatureService } from '../auth/signature.service';

@Module({
  imports: [ConfigModule.forRoot(), SupabaseModule, CacheModule],
  controllers: [DealsController],
  providers: [DealsService, ApiKeyGuard, SignatureGuard, SignatureService],
})
export class DealsModule {}
